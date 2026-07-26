#!/usr/bin/env bash
# One-command прод-деплой AI English & Math Teacher (шаги 5–9 деплой-чеклиста):
# .env → docker compose (Postgres+API+миграции) → seed → сборка фронта → nginx → HTTPS.
# Запускать из корня проекта на сервере Ubuntu под пользователем с sudo.
#   ./scripts/deploy.sh app.example.com [admin@app.example.com]
set -euo pipefail

DOMAIN="${1:-}"
ADMIN_EMAIL="${2:-admin@${DOMAIN:-localhost}}"
[ -z "$DOMAIN" ] && { echo "Использование: $0 <домен> [email-админа]"; exit 1; }
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
echo "▶ Деплой $DOMAIN (корень: $ROOT)"

command -v docker >/dev/null || { echo "❌ Docker не установлен — см. Шаг 3 чеклиста"; exit 1; }

# ---------- .env ----------
if [ ! -f .env ]; then
  echo "▶ Генерирую .env со случайными секретами"
  cat > .env <<EOF
POSTGRES_USER=app_user
POSTGRES_PASSWORD=$(openssl rand -hex 24)
POSTGRES_DB=ai_english_teacher
PORT=4000
JWT_SECRET=$(openssl rand -hex 64)
CORS_ORIGINS=https://$DOMAIN
SEED_ADMIN_EMAIL=$ADMIN_EMAIL
SEED_ADMIN_PASSWORD=$(openssl rand -base64 18)
EOF
  chmod 600 .env
  echo "✔ .env создан. Пароль администратора:"; grep '^SEED_ADMIN_PASSWORD=' .env
else
  echo "✔ .env уже существует — использую его"
fi

# ---------- БД + API ----------
echo "▶ docker compose up (миграции применяются автоматически)"
docker compose up -d --build

echo "▶ Жду готовности API (127.0.0.1:4000)…"
ok=""
for i in $(seq 1 60); do
  code="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4000/api/me || true)"
  if [ "$code" = "401" ] || [ "$code" = "200" ]; then echo "✔ API отвечает ($code)"; ok=1; break; fi
  sleep 2
done
[ -z "$ok" ] && { echo "❌ API не поднялся. Логи: docker compose logs api"; exit 1; }

# ---------- seed (однократно) ----------
if [ ! -f .seeded ]; then
  echo "▶ Загружаю демо-данные (seed)"
  docker compose run --rm api npm run seed && touch .seeded
else
  echo "✔ seed уже выполнялся (.seeded есть) — пропускаю"
fi

# ---------- сборка фронтенда ----------
echo "▶ Сборка фронтенда (VITE_API_URL=https://$DOMAIN)"
if command -v npm >/dev/null; then
  ( cd apps/web && npm install && VITE_API_URL="https://$DOMAIN" npm run build )
else
  echo "  npm не найден → офлайн-пайплайн (fetch-vendor + build.mjs)"
  node tools/fetch-vendor.mjs
  VITE_API_URL="https://$DOMAIN" node tools/build.mjs local
fi

echo "▶ Публикую статику в /var/www/aet"
sudo mkdir -p /var/www/aet
sudo cp -r apps/web/dist/* /var/www/aet/

# ---------- nginx ----------
echo "▶ Настраиваю nginx"
command -v nginx >/dev/null || sudo apt -y install nginx
sudo tee /etc/nginx/sites-available/aet >/dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    root /var/www/aet;
    index index.html;
    location / { try_files \$uri \$uri/ /index.html; }
    location /assets/ { expires 30d; add_header Cache-Control "public, immutable"; }
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    client_max_body_size 12m;
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
}
EOF
sudo ln -sf /etc/nginx/sites-available/aet /etc/nginx/sites-enabled/aet
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
echo "✔ HTTP: http://$DOMAIN"

# ---------- HTTPS ----------
echo "▶ HTTPS (Let's Encrypt)"
command -v certbot >/dev/null || sudo apt -y install certbot python3-certbot-nginx
if sudo certbot --nginx -d "$DOMAIN" --redirect -m "$ADMIN_EMAIL" --agree-tos -n; then
  echo "🎉 Готово: https://$DOMAIN  (админ: $ADMIN_EMAIL, пароль в .env)"
else
  echo "⚠ certbot не завершился автоматически. Проверьте, что DNS ($DOMAIN → IP сервера) уже применился, затем:"
  echo "   sudo certbot --nginx -d $DOMAIN --redirect -m $ADMIN_EMAIL --agree-tos -n"
fi
