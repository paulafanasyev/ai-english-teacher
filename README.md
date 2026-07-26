# 🎓 AI English & Math Teacher

Образовательная платформа с ИИ-преподавателями в виде ультрареалистичных говорящих аватаров.
Живой голосовой разговор, уроки по уровням, геймификация, подготовка к IELTS/TOEFL, курсы других языков и предметов, электронный дневник и кабинеты учителя/родителя. Интерфейс на **русском, английском и вьетнамском**.

> An educational platform where lifelike AI teacher avatars teach via live voice conversation — leveled lessons, gamification, IELTS/TOEFL prep, multi-language courses, an electronic diary and teacher/parent dashboards. UI in **Russian, English and Vietnamese**.

**Демо / Live demo:** https://hyperagent.com/s/VS1PzpQ__L-IazxT_gUHEA
Демо-аккаунты (кнопки на входе): `student@demo / demo123`, `teacher@demo / teacher123`, `parent@demo / parent123`, `admin@demo / admin123`.

---

## ✨ Возможности / Features
- 🧑‍🏫 6 ИИ-учителей-аватаров с голосом (Web Speech в браузере / нативный плагин на устройстве).
- 🎤 Разговорный клуб: голосовой диалог с учителем (микрофон).
- 📖 Уроки A1–C1 с реакцией учителя, XP, монетами, стриками.
- 🎮 Мини-игры: WordBattle, GrammarShooter, Quest, Memory.
- 📝 IELTS / TOEFL: практика по разделам + пробный тест с оценкой CEFR.
- 📚 Курсы: испанский, немецкий, французский (юниты: слова/фразы/квиз, полностью RU/EN/VI), математика (демо).
- 📔 Электронный дневник, кабинет учителя и родителя (RBAC).
- 🌐 Полная локализация RU / EN / VI. PWA + нативные обёртки (Android/iOS через Capacitor).

## 🚀 Быстрый старт / Quick start
```bash
# 1) Мгновенно, без установки — открыть в браузере:
apps/web/dist-demo/index.html            # однофайловое демо

# 2) Продакшн-веб без сборки (полностью офлайн):
npx serve apps/web/dist                  # → http://localhost:3000 (Chrome; микрофон и голос работают)

# 3) Полный стек (сервер + БД):
docker compose up                        # Postgres + API + web (см. DEPLOY.md)
```
Подробности — в `START-HERE.md`. Прод-деплой (VPS+домен+HTTPS) — `DEPLOY.md` и `scripts/deploy.sh`.

## 🏗 Архитектура / Stack
- **Веб:** React 18 + Tailwind (SPA), `apps/web` (демо-режим на localStorage / HTTP-режим при заданном `VITE_API_URL`).
- **API:** Node.js / Express / Prisma / PostgreSQL, `apps/api` (JWT с ротацией, RBAC, zod, helmet, rate-limit).
- **Мобайл:** Capacitor (Android/iOS), нативный микрофон через плагин + `scripts/patch-native.mjs`.
- **CI:** GitHub Actions — `.github/workflows/mobile-build.yml` (APK/IPA), `api-tests.yml` (vitest).
- **Без внешних API-ключей:** речь — SpeechSynthesis, слух — Web Speech API / нативный плагин, музыка — WebAudio.

## 📂 Структура / Structure
```
apps/web        — фронтенд (React+Tailwind); сборки dist/ и dist-demo/
apps/api        — бэкенд (Express+Prisma); тесты (vitest, фейковая Prisma)
scripts/        — deploy.sh, make-keystore.sh, patch-native.mjs, backup.sh, restore.sh
tools/          — офлайн-сборщик (fetch-vendor.mjs, build.mjs)
docs/           — гайды (APK/iOS/деплой/CI), маркетинг, деплой- и демо-чеклисты
.github/        — CI workflows
```

## 📱 Сборка мобильных приложений / Mobile builds
APK (Android) и IPA (iOS) собираются через GitHub Actions (`.github/workflows/mobile-build.yml`) или локально (Capacitor). Микрофон работает в нативной версии. Пошагово — `docs/APK-build-guide.html`, `docs/iOS-build-guide.html`, `docs/ci-signed-apk.html`.

## 🧪 Тесты / Tests
```bash
cd apps/api && npm install && npm test    # vitest: RBAC кабинетов/журнала и др.
```

## 👥 Разработка / Developers
**Pavel Afanasev** · **Sergei Mikhailov**

## 📄 Лицензия / License
Proprietary © 2026. Все права защищены.
