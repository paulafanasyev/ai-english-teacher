# CI: автосборка мобильных версий (GitHub Actions)

Workflow: [`.github/workflows/mobile-build.yml`](../.github/workflows/mobile-build.yml)
Собирает **Android** (ubuntu) и **iOS** (macOS) параллельно.

## Что собирается

| Условие | Android (ubuntu-latest) | iOS (macos-14) |
|---|---|---|
| **Без секретов** (работает сразу) | `app-debug.apk` | Неподписанный `.xcarchive` (проверка компиляции) |
| **С секретами подписи** | `app-release.apk` + `app-release.aab` (подписаны) | Подписанный IPA (+ опционально загрузка в TestFlight) |

Артефакты доступны во вкладке **Actions → выбранный запуск → Artifacts**.

## Когда запускается
- **Вручную:** Actions → *Mobile Build* → **Run workflow**.
- **На теге релиза:** `git tag v1.0.0 && git push --tags`.
- Сборка на каждый push в `main` отключена по умолчанию (macOS-минуты дороже ~в 10×). Включается раскомментированием `branches: [main]` в workflow.

Ключевая деталь: нативные папки `android/` и `ios/` **не хранятся в репозитории** — они создаются на каждом запуске (`npx cap add` + `cap sync`), поэтому сборка полностью воспроизводима и не «тухнет».

---

## Секреты для Android (Settings → Secrets and variables → Actions)

| Секрет | Что это |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | keystore в base64 |
| `ANDROID_KEYSTORE_PASSWORD` | пароль хранилища |
| `ANDROID_KEY_ALIAS` | alias ключа (напр. `aet`) |
| `ANDROID_KEY_PASSWORD` | пароль ключа |

Создать keystore и получить base64:
```bash
keytool -genkey -v -keystore aet-release.keystore -alias aet \
  -keyalg RSA -keysize 2048 -validity 10000
base64 -i aet-release.keystore | tr -d '\n' | pbcopy   # macOS (в буфер)
# base64 -w0 aet-release.keystore                        # Linux
```
> keystore подписывает и APK (через `apksigner`), и AAB (через `jarsigner`). Резервную копию файла и паролей храните отдельно — потеря ключа = невозможность обновлять приложение.

---

## Секреты для iOS

Используется **App Store Connect API key** — самый чистый способ для CI: Xcode сам создаёт/обновляет сертификаты и профили (`-allowProvisioningUpdates`), ручной p12 не нужен.

| Секрет | Что это | Где взять |
|---|---|---|
| `ASC_API_KEY_P8` | приватный ключ `.p8` в base64 | App Store Connect → Users and Access → **Integrations / Keys** → создать ключ (роль App Manager+). Скачивается один раз. |
| `ASC_KEY_ID` | Key ID (10 символов) | там же, рядом с ключом |
| `ASC_ISSUER_ID` | Issuer ID | там же, вверху страницы Keys |
| `APPLE_TEAM_ID` | Team ID (10 символов) | [developer.apple.com/account](https://developer.apple.com/account) → Membership |

Получить base64 ключа `.p8`:
```bash
base64 -i AuthKey_XXXXXXXXXX.p8 | tr -d '\n' | pbcopy    # macOS
# base64 -w0 AuthKey_XXXXXXXXXX.p8                         # Linux
```

Предварительно **один раз** создайте запись приложения в App Store Connect с Bundle ID `com.aiteacher.app` (My Apps → New App), иначе экспорт/загрузка не пройдут.

### Авто-загрузка в TestFlight (необязательно)
Добавьте **переменную** (не секрет): Settings → Variables → `UPLOAD_TO_TESTFLIGHT = true`.
Тогда после экспорта IPA автоматически заливается в TestFlight тем же API-ключом.

---

## Локальная сборка
Полные пошаговые инструкции для сборки на своей машине — в HTML-гайдах проекта и в `MOBILE.md`:
- Android APK/AAB — гайд «Сборка APK через Capacitor».
- iOS — гайд «Сборка iOS через Capacitor».

## Частые вопросы
- **Сборка iOS падает на подписи, хотя секреты заданы** — проверьте, что запись приложения в App Store Connect создана и Bundle ID = `com.aiteacher.app`, а у API-ключа роль ≥ App Manager.
- **Хочу собрать IPA для раздачи по устройствам (не App Store)** — в `ci/ExportOptions.plist` замените `method` на `ad-hoc` (устройства должны быть в профиле) или `development`.
- **Нужен npm-кэш для ускорения** — добавьте `apps/web/package-lock.json` в репозиторий и раскомментируйте `cache: npm` в шагах Setup Node.
