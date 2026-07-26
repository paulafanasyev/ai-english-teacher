# 🚀 Развёртывание AI English Teacher на своём сервере (VPS + домен + HTTPS)

Полная серверная версия: **nginx** (статика фронтенда + HTTPS) → **API** (Node.js/Express в Docker) → **PostgreSQL** (Docker). Время: ~30–40 минут.

**Что понадобится**
- VPS с Ubuntu 22.04/24.04, от 1 ГБ RAM (2 ГБ комфортнее) — Hetzner/DigitalOcean/Timeweb и т.п. (~5–7 $/мес)
- Домен (далее в примерах — `app.example.com`)
- Архив исходников `ai-english-teacher-src.zip`

> Все команды выполняются на сервере от пользователя с sudo, если не указано иное. Значения `app.example.com`, пароли и секреты замените на свои.

---

## Шаг 1. DNS

У регистратора домена создайте A-запись:

| Тип | Имя | Значение |
|---|---|---|
| A | `app` (или `@` для корня) | IP вашего VPS |

Проверка (с любой машины): `ping app.example.com` → должен отвечать IP сервера. DNS может обновляться до часа.

## Шаг 2. Подготовка сервера

```bash
ssh root@ВАШ_IP

# обновления + базовые пакеты
apt update && apt -y upgrade
apt -y install ufw unzip curl git

# отдельный пользователь для деплоя
adduser deploy && usermod -aG sudo deploy

# файрвол: только SSH и веб
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# автоматические обновления безопасности
apt -y install unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

Дальше работайте под `deploy`: `su - deploy`.

## Шаг 3. Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker          # применить группу без перелогина
docker --version && docker compose version
```

## Шаг 4. Код на сервер

С **локальной машины**:

```bash
scp ai-english-teacher-src.zip deploy@app.example.com:~
```

На **сервере**:

```bash
sudo mkdir -p /opt && cd /opt
sudo unzip ~/ai-english-teacher-src.zip
sudo chown -R $USER:$USER ai-english-teacher
cd ai-english-teacher
```

## Шаг 5. Секреты (.env)

Docker Compose читает `.env` из корня проекта:

```bash
cat > .env <<'EOF'
# --- PostgreSQL ---
POSTGRES_USER=app_user
POSTGRES_PASSWORD=ЗАМЕНИТЕ_НА_ДЛИННЫЙ_ПАРОЛЬ
POSTGRES_DB=ai_english_teacher

# --- API ---
PORT=4000
JWT_SECRET=ЗАМЕНИТЕ_НА_СЕКРЕТ
CORS_ORIGINS=https://app.example.com

# --- Первый администратор (создаётся сидом) ---
SEED_ADMIN_EMAIL=admin@app.example.com
SEED_ADMIN_PASSWORD=ЗАМЕНИТЕ_НА_ПАРОЛЬ_АДМИНА
EOF

# сгенерировать секреты:
sed -i "s|ЗАМЕНИТЕ_НА_ДЛИННЫЙ_ПАРОЛЬ|$(openssl rand -hex 24)|" .env
sed -i "s|ЗАМЕНИТЕ_НА_СЕКРЕТ|$(openssl rand -hex 64)|" .env
nano .env   # задайте SEED_ADMIN_PASSWORD вручную и проверьте домен в CORS_ORIGINS
chmod 600 .env
```

⚠️ `SEED_ADMIN_PASSWORD` задайте сильным сразу — смены пароля в UI пока нет.

## Шаг 6. Запуск БД и API

```bash
docker compose up -d --build        # postgres + api; миграции применяются автоматически
docker compose logs -f api          # ждём "listening" (Ctrl+C для выхода)

# однократно: сид (админ + 12 демо-учеников с историей для аналитики)
docker compose run --rm api npm run seed

# smoke-тест: 401 = API жив и защищён
curl -i http://127.0.0.1:4000/api/me
```

Порты `4000` (API) и `5432` (Postgres) привязаны к `127.0.0.1` — из интернета их не видно, наружу смотрит только nginx.

## Шаг 7. Сборка фронтенда

Вариант А — стандартный (нужен Node 20+):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt -y install nodejs

cd /opt/ai-english-teacher/apps/web
npm install
VITE_API_URL=https://app.example.com npm run build      # → dist/
```

Вариант Б — офлайн-пайплайн (если npm-реестр недоступен; качает зависимости с unpkg/GitHub):

```bash
cd /opt/ai-english-teacher
node tools/fetch-vendor.mjs
VITE_API_URL=https://app.example.com node tools/build.mjs local   # → apps/web/dist/
```

Публикация статики:

```bash
sudo mkdir -p /var/www/aet
sudo cp -r apps/web/dist/* /var/www/aet/
```

`VITE_API_URL` — origin вашего сайта **без** завершающего слэша. Фронтенд, собранный с этой переменной, автоматически работает через JWT-API вместо демо-режима.

## Шаг 8. Nginx

```bash
sudo apt -y install nginx
sudo tee /etc/nginx/sites-available/aet <<'EOF'
server {
    listen 80;
    server_name app.example.com;

    root /var/www/aet;
    index index.html;

    # статика SPA (hash-роутинг — фолбэк не обязателен, но не мешает)
    location / {
        try_files $uri $uri/ /index.html;
    }
    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # API → docker-контейнер
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 12m;   # загрузка PDF/DOCX до 10 МБ
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
}
EOF
sudo ln -s /etc/nginx/sites-available/aet /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Проверка: `http://app.example.com` уже должен открывать приложение.

## Шаг 9. HTTPS (Let's Encrypt)

```bash
sudo apt -y install certbot python3-certbot-nginx
sudo certbot --nginx -d app.example.com --redirect -m admin@app.example.com --agree-tos -n
sudo systemctl status certbot.timer     # автопродление уже включено
```

Готово: `https://app.example.com` 🎉 (HTTPS обязателен для микрофона — говорение и разговорный клуб заработают сразу).

## Шаг 10. Первый вход

- **Админ:** email/пароль из `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` → вкладка «Админ»: аналитика, пользователи, тумблеры, материалы.
- **Ученики:** регистрируются сами (тумблер «Открытая регистрация» это контролирует).

## Шаг 11. Бэкапы

```bash
cd /opt/ai-english-teacher
chmod +x scripts/backup.sh scripts/restore.sh
./scripts/backup.sh                      # тест: появится backups/*.sql.gz

# ежедневно в 03:00, хранится 14 копий (ротация встроена)
(crontab -l 2>/dev/null; echo "0 3 * * * cd /opt/ai-english-teacher && ./scripts/backup.sh >> backups/backup.log 2>&1") | crontab -
```

Восстановление: `./scripts/restore.sh backups/ФАЙЛ.sql.gz`. Раз в неделю копируйте `backups/` за пределы сервера (rclone/S3/локально через `scp`).

## Шаг 12. Обновления

```bash
cd /opt/ai-english-teacher
# заливаете новые исходники (scp/rsync/git), затем:
docker compose build api && docker compose up -d      # миграции применятся сами
cd apps/web && VITE_API_URL=https://app.example.com npm run build
sudo cp -r dist/* /var/www/aet/
```

## Чек-лист безопасности

- [x] `JWT_SECRET` — 64+ случайных байта; `.env` с правами `600`, не попадает в git
- [x] Postgres и API слушают только `127.0.0.1`; наружу — только nginx c HTTPS
- [x] UFW: открыты лишь 22/80/443; автообновления безопасности включены
- [ ] Adminer запускайте только при необходимости: `docker compose --profile tools up -d adminer` + доступ через SSH-туннель (`ssh -L 8080:127.0.0.1:8080 …`), после работы — `docker compose stop adminer`
- [ ] `fail2ban` для SSH: `sudo apt install fail2ban`
- [ ] Прочитайте `SECURITY_AUDIT.md` — карта защит по OWASP Top 10 и остаточные риски
- [ ] Периодически: `cd apps/api && npm audit`

## Диагностика

| Симптом | Причина / решение |
|---|---|
| `JWT_SECRET must be set` при старте | Нет `.env` в корне или пропущена переменная |
| 502 на `/api/...` | API не поднялся: `docker compose logs api` |
| `P1001: Can't reach database` | Postgres ещё стартует — подождите healthcheck, `docker compose ps` |
| CORS-ошибки в консоли | `CORS_ORIGINS` должен точно совпадать с origin сайта (https, без слэша) |
| Микрофон не работает | Только HTTPS + Chrome; проверьте разрешение микрофона для сайта |
| Демо-режим вместо сервера | Фронт собран без `VITE_API_URL` — пересоберите (Шаг 7) |

**Логи:** `docker compose logs -f api` · `sudo tail -f /var/log/nginx/access.log`
