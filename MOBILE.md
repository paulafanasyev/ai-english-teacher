# 📱 Мобильные версии: PWA, Android (APK) и iOS

Приложение доступно на телефоне тремя способами. Самый быстрый — **PWA** (работает сразу после деплоя, без магазинов). Для публикации в **Google Play** и **App Store** используется обёртка **Capacitor** — она упаковывает уже собранный веб-билд (`apps/web/dist`) в нативное приложение (работает офлайн, без внешнего сервера).

> Почему в проекте нет готового `.apk`/`.ipa`: сборка Android APK требует JDK + Android SDK + Gradle, а iOS — **только macOS + Xcode**. Их нельзя собрать в общем окружении — только на вашей машине командами ниже. Проект и конфиги для этого уже подготовлены.

---

## 1. PWA (Progressive Web App) — устанавливается прямо из браузера

Что уже сделано в коде:
- `apps/web/public/manifest.webmanifest` — имя, иконки (192/512 + maskable), `display: standalone`, тема `#7c3aed`.
- `apps/web/public/sw.js` — сервис-воркер: кэширует оболочку и ассеты, приложение работает **офлайн** после первого визита.
- Регистрация SW и кнопка «Установить приложение» — в `apps/web/src/main.jsx`.
- Сборка (`tools/build.mjs` и Vite) кладёт `manifest.webmanifest`, `sw.js`, `icons/` рядом с `index.html`.

Требование: PWA работает **только по HTTPS** (или `localhost`). См. `DEPLOY.md` (nginx + Let's Encrypt).

Установка для пользователя:
- **Android/Chrome:** меню ⋮ → «Установить приложение» (или всплывающая кнопка в приложении).
- **iPhone/Safari:** «Поделиться» → «На экран „Домой“».
- После установки — иконка на рабочем столе, полноэкранный режим, офлайн-доступ.

Проверить локально: `cd apps/web && npm run build && npx serve dist` (или любой статический сервер по HTTPS).

---

## 2. Android — APK через Capacitor

### Требования (на вашей машине)
- Node.js 18+
- **JDK 17** (Temurin/OpenJDK)
- **Android Studio** (ставит Android SDK, build-tools, platform-tools). Один раз откройте Studio и примите лицензии SDK.

### Шаги
```bash
cd apps/web
npm install                 # включая @capacitor/core, @capacitor/cli, @capacitor/android
npm run build               # собирает веб-приложение в apps/web/dist
npx cap add android         # создаёт папку android/ (один раз)
npx cap sync                # копирует dist/ в нативный проект + плагины
```
Конфиг уже есть: `apps/web/capacitor.config.json` (`appId: com.aiteacher.app`, `webDir: dist`).

Сборка **debug-APK** (для теста/сайдлоада):
```bash
cd android
./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```
Установка на телефон: включите «Установка из неизвестных источников» и откройте APK, либо `adb install app-debug.apk`.

Иконки: `npx cap sync` не генерирует иконки автоматически — используйте `@capacitor/assets`:
```bash
npm i -D @capacitor/assets
npx capacitor-assets generate --iconBackgroundColor '#7c3aed' --iconBackgroundColorDark '#4c1d95'
# положите исходную иконку 1024×1024 в apps/web/resources/icon.png
```

### Релиз в Google Play
```bash
# 1. Ключ подписи (один раз):
keytool -genkey -v -keystore aet-release.keystore -alias aet -keyalg RSA -keysize 2048 -validity 10000
# 2. Пропишите подпись в android/app/build.gradle (signingConfigs) или android/keystore.properties
# 3. Сборка подписанного AAB (формат Google Play):
cd android && ./gradlew bundleRelease
# AAB: android/app/build/outputs/bundle/release/app-release.aab
```
Загрузите `.aab` в **Google Play Console** (нужен аккаунт разработчика, разовый взнос $25).

---

## 3. iOS — проект Xcode через Capacitor

### Требования
- **macOS** + **Xcode** (обязательно — iOS нельзя собрать на Windows/Linux).
- **Apple Developer Program** ($99/год) — для публикации и запуска на устройстве.
- CocoaPods (`sudo gem install cocoapods`).

### Шаги
```bash
cd apps/web
npm install
npm run build
npx cap add ios             # создаёт папку ios/ (один раз)
npx cap sync
npx cap open ios            # открывает проект в Xcode
```
В Xcode:
1. Выберите таргет **App** → вкладка **Signing & Capabilities** → ваш **Team**, задайте **Bundle Identifier** (напр. `com.aiteacher.app`).
2. Подключите iPhone или выберите симулятор → **Run** (▶) для теста.
3. Публикация: **Product → Archive** → **Distribute App** → App Store Connect / **TestFlight**.

---

## 4. Серверный режим в мобильной обёртке (опционально)
По умолчанию Capacitor упаковывает **офлайн-демо** (данные в устройстве). Чтобы приложение работало с вашим сервером (Node + PostgreSQL, кабинеты/дневник онлайн):
```bash
cd apps/web
VITE_API_URL=https://app.example.com npm run build
npx cap sync
```
Так фронтенд соберётся в серверном режиме (JWT-API вместо демо), и обёртка будет ходить на ваш backend.

---

## Итого
| Канал | Что нужно | Результат |
|---|---|---|
| PWA | HTTPS-деплой (DEPLOY.md) | Установка из браузера, офлайн — **готово в коде** |
| Android | JDK 17 + Android Studio | `app-debug.apk` для теста, `.aab` для Google Play |
| iOS | macOS + Xcode + Apple Developer | Запуск на устройстве, TestFlight, App Store |
