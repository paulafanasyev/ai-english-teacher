# 🚀 Запуск AI English & Math Teacher

В репозитории лежат исходники. Готовые сборки (`apps/web/dist`, `apps/web/dist-demo`) **не коммитятся**: их собирает CI (артефакт `web-dist-<sha>` в Actions) или ты сам командами ниже. Нужен Node 20+.

## 1. Веб в демо-режиме (без сервера)
```
cd apps/web
npm install
npm run dev            # http://localhost:5173 — разработка
npm run build          # → apps/web/dist (статика)
npx serve dist         # или: python3 -m http.server 8080 --directory dist
npm run build:demo     # → apps/web/dist-demo/index.html, однофайловое демо
```
В демо-режиме все данные хранятся в браузере (localStorage). Это песочница на одно устройство: для настоящей школы с учителями и родителями нужен сервер (п.2).

Интернет нужен только для необязательных вещей: локальная ИИ-модель (WebLLM, качается один раз) и «естественные голоса» Piper (~63 МБ на голос, автоматически только по Wi‑Fi, иначе кнопкой в Настройках). Без них работают базовый режим ИИ и голос браузера.

## 2. Полный стек (сервер + БД + онлайн-кабинеты)
`docker compose` поднимает **Postgres + API** (фронт собирается отдельно). Сначала создай `.env` в корне:
```
POSTGRES_PASSWORD=$(openssl rand -hex 24)
JWT_SECRET=$(openssl rand -hex 64)
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=<длинный пароль, 12+ символов>
CORS_ORIGINS=http://localhost:5173
```
Затем:
```
docker compose up -d --build                 # схема БД создаётся автоматически
docker compose run --rm api npm run seed     # админ + настройки
docker compose run --rm -e SEED_DEMO=1 api npm run seed   # + демо-ученики (только для тестов!)
cd apps/web && npm install && VITE_API_URL=http://localhost:4000 npm run dev
```
В продакшене сервер не запустится со слабым `JWT_SECRET` (короче 32 символов или заглушка), а демо-аккаунты с публичными паролями создаются только с `SEED_DEMO=1`.

Развёртывание на сервер с доменом и HTTPS одной командой: `./scripts/deploy.sh app.example.com` (подробности — `DEPLOY.md`). Пароль админа скрипт не печатает: он в `.env` (`sudo grep SEED_ADMIN_PASSWORD .env`).

## 3. Пересобрать веб без npm-реестра
```
node tools/fetch-vendor.mjs           # один раз скачает esbuild+tailwind (нужен интернет)
node tools/build.mjs local            # → apps/web/dist
node tools/build.mjs demo             # → apps/web/dist-demo
```

## Тесты
```
cd apps/api && npm install && npm test   # vitest: авторизация, роли, экономика, журнал (идут в CI)
cd apps/web && npm test                  # node --test: математика, домашние задания, грамматика (пока не в CI)
```

## Мобильные приложения
PWA работает сразу (manifest + service worker). Сборка APK/iOS — см. `MOBILE.md`, `docs/APK-build-guide.html`, `docs/iOS-build-guide.html`; автосборка — `.github/workflows/mobile-build.yml`.

## Лицензии
Код проекта — `LICENSE`. Сторонние компоненты, ИИ-модели и голоса — `THIRD_PARTY_NOTICES.md` (в том числе открытый вопрос про GPL-фонемайзер Piper).

---
Демо-аккаунты на экране входа (демо-режим): **Ученик · Учитель · Родитель · Админ** (вход в один клик).
Учителя: Светлана, Дмитрий, Ольга, Алексей.
Разработка: **Pavel Afanasev · Sergei Mikhailov**.
