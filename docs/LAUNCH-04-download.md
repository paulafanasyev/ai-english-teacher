Готовый блок «Скачать приложение» для лендинга: React-компонент с определением ОС и авто-редиректом в нужный магазин, плюс бэкенд-эндпоинт для раздачи APK вне Google Play. Дизайн — в фирменном градиенте (#7c3aed → #d946ef), совпадает с обновлённым UI из раздела 2.

## Логика определения устройства и редиректа
`detectOS()` читает `navigator.userAgent`: Android → Google Play, iPhone/iPad → App Store (учитывается iPadOS, который маскируется под Mac — ловим по `maxTouchPoints`). При `autoRedirect=true` сразу перенаправляем; иначе показываем обе кнопки с подсветкой «Ваше устройство». Есть кнопка установки PWA (`beforeinstallprompt`) и прямой APK.

## React-компонент (JSX)
Файл: `apps/web/src/features/download/DownloadApp.jsx`
```jsx
{{FILE:apps/web/src/features/download/DownloadApp.jsx}}
```

## Использование на лендинге
```jsx
import DownloadApp from './features/download/DownloadApp.jsx';

export default function Landing() {
  return (
    <main>
      {/* ...герой, фичи... */}
      <DownloadApp />               {/* обе кнопки + PWA + прямой APK */}
      {/* или авто-редирект на магазин по устройству: */}
      {/* <DownloadApp autoRedirect /> */}
    </main>
  );
}
```

## Бэкенд-эндпоинт (Express)
Файл: `apps/api/src/routes/download.js`. Монтируется в `apps/api/src/app.js`:
```js
import downloadRouter from './routes/download.js';
// ...
app.use('/api/download', downloadRouter);
```
Код роутера:
```js
{{FILE:apps/api/src/routes/download.js}}
```
Положите собранные бинарники в каталог `releases/` (или задайте `RELEASES_DIR`). `GET /api/download/android` отдаёт свежий APK, `/api/download/ios` редиректит в App Store (веб-сайдлоад iOS запрещён Apple), `/api/download/detect` возвращает ОС по User-Agent для серверного редиректа.

## Дизайн-заметки
Компонент использует те же токены, что и обновлённый UI: фиолетово-фуксиевый градиент, крупные бейджи магазинов, состояние «Ваше устройство», доступные `aria-label`, hit-target ≥ 44px. Хук аналитики `app_download_click` готов под GA4 / Яндекс.Метрику. Компонент самодостаточен (нужен только Tailwind) и вставляется в любой React-лендинг.
