# 🚀 Запуск AI English & Math Teacher

Этот архив — **полностью рабочий проект**: готовые сборки уже внутри, ничего собирать не нужно.
Три способа запуска — от «моментально» до «полный стек».

## 1. Моментально, без установки (демо)
Открой в браузере файл:
```
apps/web/dist-demo/index.html
```
Однофайловое демо со всеми функциями (данные — в браузере, localStorage; демо-аккаунты в один клик).
Примечание: в этом файле аватары/интро-видео подгружаются из сети (нужен интернет для картинок); вся логика работает и офлайн.

## 2. Продакшн-веб без сборки — полностью офлайн ✅
Готовая статическая сборка со **всеми локальными ассетами** лежит в `apps/web/dist/`. Раздай любым статическим сервером:
```
npx serve apps/web/dist
# или без Node:
python3 -m http.server 8080 --directory apps/web/dist
```
Открой http://localhost:8080 — приложение работает в демо-режиме (localStorage) без бэкенда.
Аватары и интро-видео локальные → работает без интернета.

## 3. Полный стек (сервер + БД + онлайн-кабинеты)
Нужен Node 18+ и PostgreSQL (или Docker).
```
# Docker — проще всего:
docker-compose up                     # Postgres + API + web

# Вручную:
cd apps/api && npm install && npx prisma migrate deploy && npm run seed && npm start
cd apps/web && VITE_API_URL=http://localhost:4000 npm install && npm run build && npx serve dist
```
Подробности и прод-развёртывание (домен, HTTPS) — в `DEPLOY.md`.

## 4. Пересобрать веб офлайн (без npm-реестра)
```
node tools/fetch-vendor.mjs           # один раз скачает esbuild+tailwind (нужен интернет)
node tools/build.mjs local            # → apps/web/dist
node tools/build.mjs demo             # → apps/web/dist-demo
```

## Тесты бэкенда
```
cd apps/api && npm install && npm test # vitest: RBAC-кабинеты (18 кейсов) и др.
```

## Мобильные приложения
PWA работает сразу (manifest + service worker). Сборка APK/iOS — см. `docs/APK-build-guide.html`, `docs/iOS-build-guide.html`, автосборка — `.github/workflows/`.

---
Демо-аккаунты на экране входа: **Ученик · Учитель · Родитель · Админ** (вход в один клик).
Разработка: **Pavel Afanasev · Sergei Mikhailov**.
