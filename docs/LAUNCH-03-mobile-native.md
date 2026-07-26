Полные пошаговые гайды по сборке уже готовы отдельными страницами («Сборка APK через Capacitor» и «Сборка iOS через Capacitor»), а автосборка настроена в `.github/workflows/mobile-build.yml`. Здесь — конкретные изменения конфигов и готовый код нативных плагинов: **push-уведомления, офлайн-режим, share**.

## Установка плагинов
```bash
cd apps/web
npm i @capacitor/push-notifications @capacitor/share @capacitor/network \
      @capacitor/preferences @capacitor/haptics @capacitor/splash-screen
npx cap sync
```

## capacitor.config.json — дополнения
Добавьте блок `plugins` к существующему конфигу (appId / appName / webDir не меняем):
```json
{
  "appId": "com.aiteacher.app",
  "appName": "AI English Teacher",
  "webDir": "dist",
  "backgroundColor": "#7c3aedff",
  "server": { "androidScheme": "https" },
  "ios": { "contentInset": "always" },
  "plugins": {
    "PushNotifications": { "presentationOptions": ["badge", "sound", "alert"] },
    "SplashScreen": {
      "launchShowDuration": 1200,
      "backgroundColor": "#7c3aed",
      "showSpinner": false
    }
  }
}
```

## Android — apps/web/android/app/src/main/AndroidManifest.xml
`INTERNET` подключается Capacitor автоматически. Добавьте разрешение на уведомления (Android 13+) и, при необходимости, deep-link:
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>

<!-- внутри <activity> основной MainActivity: диплинки aiteacher:// и https -->
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW"/>
  <category android:name="android.intent.category.DEFAULT"/>
  <category android:name="android.intent.category.BROWSABLE"/>
  <data android:scheme="aiteacher"/>
  <data android:scheme="https" android:host="app.aiteacher.app"/>
</intent-filter>
```
Push через FCM: положите `google-services.json` в `android/app/` — плагин `@capacitor/push-notifications` сам зарегистрирует `FirebaseMessagingService`.

## iOS — apps/web/ios/App/App/Info.plist
```xml
<key>UIBackgroundModes</key>
<array>
  <string>remote-notification</string>
</array>
<key>CFBundleDisplayName</key>
<string>AI Teacher</string>
```
В Xcode → таргет **App** → **Signing & Capabilities** добавьте capability **Push Notifications** и **Background Modes → Remote notifications**. APNs-ключ загрузите в Firebase (если push идёт через FCM) или используйте APNs напрямую.

## Плагин 1 — Push-уведомления
```js
// apps/web/src/native/push.js
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export async function initPush(onToken) {
  if (!Capacitor.isNativePlatform()) return; // веб / PWA — пропускаем

  let perm = await PushNotifications.checkPermissions();
  if (perm.receive === 'prompt') perm = await PushNotifications.requestPermissions();
  if (perm.receive !== 'granted') return;

  await PushNotifications.register();

  PushNotifications.addListener('registration', (token) => {
    onToken?.(token.value);          // отправьте token на бэкенд для адресных пушей
  });
  PushNotifications.addListener('registrationError', (e) => console.warn('push error', e));
  PushNotifications.addListener('pushNotificationReceived', (n) => {
    console.log('push received while open', n);
  });
  PushNotifications.addListener('pushNotificationActionPerformed', (a) => {
    const route = a.notification?.data?.route; // навигация по тапу
    if (route) window.location.hash = route;
  });
}
```

## Плагин 2 — Офлайн-режим
PWA уже кэширует оболочку через service worker (`apps/web/public/sw.js`). Для нативной обёртки добавьте контроль сети и локальный кэш данных:
```js
// apps/web/src/native/offline.js
import { Network } from '@capacitor/network';
import { Preferences } from '@capacitor/preferences';

export async function isOnline() {
  return (await Network.getStatus()).connected;
}

export function watchNetwork(onChange) {
  return Network.addListener('networkStatusChange', (s) => onChange(s.connected));
}

// Кэш-обёртка: пробуем сеть, при офлайне отдаём последнее сохранённое.
export async function cachedJson(key, fetcher) {
  try {
    if (await isOnline()) {
      const data = await fetcher();
      await Preferences.set({ key, value: JSON.stringify(data) });
      return data;
    }
  } catch { /* падаем в кэш ниже */ }
  const cached = await Preferences.get({ key });
  return cached.value ? JSON.parse(cached.value) : null;
}
```

## Плагин 3 — Share intent (поделиться прогрессом)
```js
// apps/web/src/native/share.js
import { Share } from '@capacitor/share';

export async function shareProgress({ level, streak }) {
  await Share.share({
    title: 'AI English Teacher',
    text: `Мой уровень ${level}, стрик ${streak} дней 🔥 Учусь с ИИ-учителем!`,
    url: 'https://app.aiteacher.app',
    dialogTitle: 'Поделиться прогрессом',
  });
}
```

## Автосборка (GitHub Actions)
Готовый workflow — `.github/workflows/mobile-build.yml`: два job'а (Android на ubuntu, iOS на macOS), запуск вручную или по тегу `v*`. Без секретов собирает debug-APK и неподписанный iOS-архив; при добавлении секретов подписи — подписанные APK/AAB и IPA, плюс опциональная загрузка в TestFlight. Список секретов и инструкция — `ci/README-CI.md`.

> Пошаговые инструкции по подписи и публикации (Google Play, App Store, TestFlight) — в отдельных страницах-гайдах «Сборка APK» и «Сборка iOS», созданных ранее в этом треде.
