# 🎓 AI English Teacher

**AI English Teacher** — local-first приложение для изучения английского с голосовыми преподавателями, уроками, играми и приватным ИИ прямо в браузере.

🌐 **Сайт:** https://paulafanasyev.github.io/ai-english-teacher/  ·  **Приложение:** https://paulafanasyev.github.io/ai-english-teacher/app/

## Что внутри

- голосовая практика с анимированными SVG-учителями (lip-sync по виземам, моргание, эмоции);
- озвучка на EN/RU/VI через браузерный или нативный TTS, с понятными ошибками и fallback;
- уроки A1–B2, XP, серии занятий и мини-игры;
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

Для production-сборки: `npm run build && npm run preview`.

Голосовой ввод зависит от разрешений браузера/ОС. Для локальной AI-модели нужен современный Chrome или Edge с WebGPU; первый запуск скачивает модель (~300–1100 МБ), дальше она берётся из кэша браузера. Без WebGPU всё работает в базовом режиме.

## GitHub Pages

> ⚠️ Один ручной шаг: файлы `ci/workflows/pages.yml` и `ci/workflows/web-ci.yml` нужно перенести в `.github/workflows/` (токен интеграции не имеет права `workflow` и не может создавать workflow-файлы сам). Это делается прямо на GitHub: открыть файл → ✏️ → поменять путь на `.github/workflows/pages.yml` → Commit.

Workflow `pages.yml` на push в `main` собирает React-приложение в `/app/`, копирует статический лендинг из `site/` в корень и публикует Pages. Один раз откройте **Settings → Pages → Source → GitHub Actions**. `web-ci.yml` проверяет сборку на каждом push и PR.

## Мобильная версия

Capacitor-конфигурация и Android/iOS workflow остаются в репозитории. APK, когда опубликован, доступен на https://github.com/paulafanasyev/ai-english-teacher/releases/latest

## Структура

```text
apps/web        — React 18 + Vite SPA, HashRouter, PWA, local-first API
apps/web/src/ai — WebLLM-движок, каталог моделей и реестр задач ИИ
apps/web/src/avatar — SVG-учителя с lip-sync
apps/api        — необязательный Express API
site/           — статический маркетинговый сайт (RU/EN/VI) + privacy policy
ci/workflows/   — Pages deploy и web CI (перенести в .github/workflows)
```

## English (short)

Local-first React/Vite SPA for GitHub Pages. Progress lives in browser `localStorage`; an optional in-browser LLM (WebLLM over WebGPU) powers tutoring, corrections and writing feedback, with rule-based fallbacks everywhere. Run `cd apps/web && npm install && npm run dev`. To deploy: move `ci/workflows/*.yml` to `.github/workflows/`, then set **Settings → Pages → Source → GitHub Actions**.

## Разработка / Developers

**Pavel Afanasev** · **Sergei Mikhailov**

## Лицензия / License

Proprietary © 2026. Все права защищены.
