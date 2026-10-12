# 🎓 Светлана Репетитор

![Pavel Afanasev logo](pavel-afanasev-logo.svg)

**Светлана Репетитор** — бесплатный помощник школьника и учителя: английский с озвученными учителями и математика 5–9 класса в режиме «Подумай сам», local-first, прямо в браузере.

Создан на базе проекта **«Светлана» АНО ЦПС «Мир Самозанятых»**. Разработчик: **Афанасьев Павел**.

🌐 **Сайт:** https://paulafanasyev.github.io/ai-english-teacher/  ·  **Приложение:** https://paulafanasyev.github.io/ai-english-teacher/app/

## Что внутри

- голосовая практика с анимированными SVG-учителями (lip-sync по виземам, моргание, эмоции);
- озвучка на EN/RU/VI через браузерный или нативный TTS, с понятными ошибками и fallback;
- уроки A1–B2, XP, серии занятий и мини-игры;
- математика 5–9 класс в режиме «Подумай сам»: подсказки по шагам, решение только после попыток, точная проверка ответов без ИИ (`apps/web/src/features/math`, тесты: `npm test`);
- демо-кабинет учителя и родителя: слабые темы, домашка по математике, журнал (в публичной сборке данные в одном браузере);
- тренировка IELTS / TOEFL: reading, listening, writing (с оценкой от локального ИИ), speaking;
- интерфейс на русском, английском и вьетнамском;
- local-first режим: прогресс хранится в `localStorage`, отдельный API не нужен;
- встроенный in-browser LLM (WebLLM, Qwen2.5 0.5B по умолчанию) включается в Настройках и работает на устройстве через WebGPU. Его «должностная инструкция» — реестр задач в `apps/web/src/ai/tasks.js` (tutor_reply, correct_sentence, explain_grammar, grade_writing, speaking_feedback, translate_hint, generate_exercise, placement_estimate, safety_filter); у каждой задачи есть валидация и rule-based fallback, поэтому приложение работает и без модели.

Публичная GitHub Pages-сборка по умолчанию **не подключается к Express API**. Серверный режим включается только через `VITE_API_URL`. Локальные демо-данные предназначены для обучения и прототипирования, это не серверная авторизация.

## Быстрый старт

```bash
cd apps/web
npm install
npm run dev
```

Для production-сборки: `npm run build && npm run preview`. Тесты математики: `npm test`.

Голосовой ввод зависит от разрешений браузера/ОС. Для локальной AI-модели нужен современный Chrome или Edge с WebGPU; первый запуск скачивает модель (~300–1100 МБ), дальше она берётся из кэша браузера. Без WebGPU всё работает в базовом режиме.

## GitHub Pages и Vercel

Workflow `pages.yml` находится в `.github/workflows/` и на push в `main` собирает React-приложение в `/app/`, копирует статический лендинг из `site/` в корень и публикует Pages. Включите один раз **Settings → Pages → Source → GitHub Actions**. `web-ci.yml` проверяет web-сборку на каждом push и PR. Та же сборка для Vercel описана в `vercel.json`.

## Мобильная версия

Capacitor-конфигурация и Android/iOS workflow остаются в репозитории. APK, когда опубликован, доступен на https://github.com/paulafanasyev/ai-english-teacher/releases/latest

## Структура

```text
apps/web        — React 18 + Vite SPA, HashRouter, PWA, local-first API
apps/web/src/ai — WebLLM-движок, каталог моделей и реестр задач ИИ
apps/web/src/avatar — SVG-учителя с lip-sync
apps/web/src/features/math — математика «Подумай сам» с точной проверкой
apps/api        — необязательный Express API
site/           — статический маркетинговый сайт (RU/EN/VI) + privacy policy
.github/workflows — GitHub Pages deploy и web CI
```

## English (short)

**Svetlana Tutor** is a free helper for students and teachers, based on the “Svetlana” project of the non-profit “Mir Samozanyatykh” (АНО ЦПС «Мир Самозанятых»), developed by Pavel Afanasyev. Local-first React/Vite SPA: progress lives in browser `localStorage`; an optional in-browser LLM (WebLLM over WebGPU) powers tutoring, corrections and writing feedback, with rule-based fallbacks everywhere. Includes English with voice-enabled teachers, a grade 5–9 math tutor with step-by-step hints and exact answer checking, and demo teacher/parent dashboards. Run `cd apps/web && npm install && npm run dev`.

## Разработка / Developers

**Афанасьев Павел (Pavel Afanasev)**, разработчик и руководитель проекта. На базе проекта «Светлана» АНО ЦПС «Мир Самозанятых».

## Правообладатель и связь

**Правообладатель:** Pavel Afanasev

- Email: [Pavel.afanasyev@inbox.ru](mailto:Pavel.afanasyev@inbox.ru)
- WhatsApp: [+79148289964](https://wa.me/79148289964)
- Telegram: [@PaulPavel_it_dev](https://t.me/PaulPavel_it_dev)

Коммерческие лицензии, разрешения на распространение и другие вопросы об использовании материалов: свяжитесь с правообладателем письменно.

## Лицензия / License

Материалы, принадлежащие правообладателю, распространяются на условиях проприетарной лицензии [LICENSE](LICENSE). Коммерческое использование, перепродажа и распространение копий без предварительного письменного разрешения запрещены. Сторонние компоненты регулируются собственными лицензиями. См. [реестр сторонних компонентов и контрольный список релиза](THIRD_PARTY_NOTICES.md).
