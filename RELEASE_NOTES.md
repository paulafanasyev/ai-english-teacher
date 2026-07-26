# Release v1.0 — AI English & Math Teacher

Первый релиз: полнофункциональное веб-приложение с трёхъязычным интерфейсом (RU/EN/VI), нативная мобильная сборка (Android/iOS через Capacitor) с рабочим микрофоном, бизнес-материалы и деплой-инструменты.

> First release: full trilingual web app (RU/EN/VI), native mobile builds (Android/iOS via Capacitor) with a working microphone, business materials and deployment tooling.

## ✨ Highlights
- 🌐 Полная локализация RU / EN / VI (345 ключей × 3, паритет; курсы полностью трёхъязычны).
- 🧑‍🏫 6 ИИ-учителей-аватаров, живой голосовой разговор (микрофон), уроки A1–C1.
- 📝 IELTS / TOEFL — практика по разделам + пробный тест (оценка CEFR).
- 📚 Курсы: испанский / немецкий / французский (юниты слова/фразы/квиз), математика (демо).
- 📔 Электронный дневник, кабинеты учителя и родителя (RBAC, покрыто vitest-тестами).
- 🎮 Геймификация: XP, монеты, стрики, 4 мини-игры.
- 📱 Нативный микрофон в APK/IPA (Capacitor-плагин + авто-патч разрешений в CI).
- ⚙️ CI: автосборка APK/AAB и iOS-архива; тесты API.

## 📦 Артефакты релиза / Assets
- `ai-english-teacher-src.zip` — полный исходный код.
- `ai-english-teacher-RUNNABLE.zip` — исходники + готовые сборки (`dist/`, `dist-demo/`) — запуск без сборки.
- PDF бизнес-материалов (deck / бизнес-план / рынок, RU/EN/VI) — при наличии.
- APK / AAB / IPA — из GitHub Actions (`mobile-build.yml`) после добавления секретов подписи.

## ▶️ Демо / Demo
https://hyperagent.com/s/VS1PzpQ__L-IazxT_gUHEA — демо-аккаунты: `student@demo / demo123`, `teacher@demo / teacher123`, `parent@demo / parent123`, `admin@demo / admin123`.

## 🛠 Запуск / Run
См. `README.md` и `START-HERE.md`. Прод-деплой — `DEPLOY.md` + `scripts/deploy.sh`.

Разработка: **Pavel Afanasev** · **Sergei Mikhailov**.
