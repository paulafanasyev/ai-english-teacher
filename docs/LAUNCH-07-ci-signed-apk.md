В проекте уже есть готовый workflow **`.github/workflows/mobile-build.yml`**. Он собирает Android на ubuntu-раннере GitHub (npm там доступен) и, если добавить секреты подписи, отдаёт **подписанный `app-release.apk` + `app-release.aab`** как артефакт. Ниже — весь путь от репозитория до скачанного APK. Отмечайте шаги галочками — прогресс сохраняется в браузере.

> Понадобится: аккаунт GitHub, установленный `git`, и JDK (для команды `keytool` — входит в JDK 17; альтернатива — Android Studio). Архив проекта `ai-english-teacher-src.zip`. Время ~20–30 минут (первый прогон CI ~10–15 мин).

## Шаг 1 — Создать репозиторий и залить проект
Создайте пустой репозиторий на github.com (можно private). Затем локально распакуйте `ai-english-teacher-src.zip` и запушьте:
```bash
cd ai-english-teacher
git init
git add .
git commit -m "AI English & Math Teacher"
git branch -M main
git remote add origin https://github.com/ВАШ_ЛОГИН/ВАШ_РЕПО.git
git push -u origin main
```
> Важно: убедитесь, что папка `.github/` попала в коммит (в ней и лежит сборщик). Проверка: `git ls-files .github` должна показать `.github/workflows/mobile-build.yml`. Если пусто — проверьте `.gitignore`.

## Шаг 2 — Создать ключ подписи (keystore)
Ключ создаётся один раз. Через `keytool` (идёт с JDK):
```bash
keytool -genkey -v -keystore aet-release.keystore -alias aet \
  -keyalg RSA -keysize 2048 -validity 10000
```
Команда спросит пароль хранилища, данные владельца и пароль ключа. Запомните: **пароль хранилища**, **alias** (`aet`) и **пароль ключа**.
> 🔒 Критично: сохраните файл `aet-release.keystore` и пароли в надёжном месте и сделайте бэкап. Потеря ключа = невозможность выпускать обновления приложения в Google Play. Не коммитьте keystore в репозиторий.

## Шаг 3 — Закодировать keystore в base64
Секреты GitHub — это текст, поэтому keystore кодируем в base64 (одной строкой, без переносов):
```bash
# macOS
base64 -i aet-release.keystore | tr -d '\n' | pbcopy      # уже в буфере обмена

# Linux
base64 -w0 aet-release.keystore                            # скопируйте вывод

# Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("aet-release.keystore")) | Set-Clipboard
```

## Шаг 4 — Добавить секреты в GitHub
Репозиторий → **Settings → Secrets and variables → Actions → New repository secret**. Создайте четыре секрета:

| Имя секрета | Значение |
|-------------|----------|
| `ANDROID_KEYSTORE_BASE64` | строка base64 из Шага 3 |
| `ANDROID_KEYSTORE_PASSWORD` | пароль хранилища |
| `ANDROID_KEY_ALIAS` | `aet` |
| `ANDROID_KEY_PASSWORD` | пароль ключа |

> Пока этих секретов нет, workflow всё равно зелёный, но соберёт только debug-APK. Как только `ANDROID_KEYSTORE_BASE64` появился — автоматически включается сборка подписанного релиза.

## Шаг 5 — Запустить сборку
Способ А — вручную: вкладка **Actions** → workflow **«Mobile Build (Android APK + iOS Archive)»** → **Run workflow** → ветка `main` → **Run workflow**.

Способ Б — по тегу релиза:
```bash
git tag v1.0.0
git push --tags
```
Джоб **android** выполнит: `npm install` → сборка веба → `npx cap add/sync android` → `gradlew assembleRelease bundleRelease` → подпись через `apksigner` (APK) и `jarsigner` (AAB) вашим keystore.

## Шаг 6 — Скачать артефакт
Actions → откройте нужный запуск → прокрутите вниз до раздела **Artifacts**:
- **`android-release`** — `app-release.apk` (подписанный, для установки/раздачи) + `app-release.aab` (для Google Play);
- `android-debug-apk` — `app-debug.apk` (тестовый, есть всегда).

Нажмите на артефакт — GitHub отдаст `.zip`; распакуйте — внутри ваш `.apk`.

## Шаг 7 — Установить или опубликовать
- **На телефон напрямую:** перекиньте `app-release.apk`, разрешите «Установка из неизвестных источников», откройте. Или по кабелю: `adb install app-release.apk`.
- **Google Play:** загрузите `app-release.aab` в Play Console (**Production → Create release**). Рекомендуется включить **Play App Signing**.
- Проверить подпись APK (опционально): `apksigner verify --print-certs app-release.apk`.

## Как это устроено (кратко)
Подпись сделана **после сборки** (`zipalign` → `apksigner` для APK, `jarsigner` для AAB) — поэтому нативную папку `android/` и `build.gradle` править не нужно, всё делает workflow. Полное описание секретов (в т.ч. iOS) — в файле `ci/README-CI.md` в репозитории.

## Диагностика
| Симптом | Причина / решение |
|---------|-------------------|
| Workflow не виден во вкладке Actions | Папка `.github/workflows` не закоммичена или не в ветке `main` — проверьте `git ls-files .github` |
| Собрался только `android-debug-apk` | Не задан секрет `ANDROID_KEYSTORE_BASE64` — добавьте 4 секрета (Шаг 4) и перезапустите |
| `keystore was tampered with, or password was incorrect` | Неверный пароль/alias или base64 с переносами строк — перекодируйте (`-w0` / `tr -d '\n'`) |
| Артефакт скачался как `.zip` | Это нормально — GitHub всегда упаковывает артефакты; распакуйте и возьмите `.apk` |
| Джоб android падает на Gradle | Откройте лог шага сборки; чаще всего — не хватило секрета подписи или опечатка в значении |

Для iOS (подписанный IPA / TestFlight) — отдельный джоб `ios` в том же workflow; секреты App Store Connect API key описаны в `ci/README-CI.md`. Настройка CI — Pavel Afanasev · Sergei Mikhailov.
