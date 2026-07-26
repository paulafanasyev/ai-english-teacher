// Прямая раздача бинарников приложения вне магазинов (Launch pack).
// Монтируется в app.js:  app.use('/api/download', downloadRouter);
// Публичный роутер (без requireAuth) — это дистрибутив, а не приватные данные.
//
// ENV:
//   RELEASES_DIR   каталог с собранными файлами (по умолчанию <cwd>/releases)
//   PLAY_URL       ссылка на Google Play (для редиректа при PREFER_STORE=1)
//   APPSTORE_URL   ссылка на App Store
//   PREFER_STORE   '1' → /android редиректит в Google Play вместо отдачи файла
import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';

const router = Router();

const RELEASES_DIR = path.resolve(process.env.RELEASES_DIR || path.join(process.cwd(), 'releases'));
const STORE_URLS = {
  android: process.env.PLAY_URL || 'https://play.google.com/store/apps/details?id=com.aiteacher.app',
  ios: process.env.APPSTORE_URL || 'https://apps.apple.com/app/ai-english-teacher/id0000000000',
};

/** Определение ОС по User-Agent — для авто-редиректа с лендинга. */
router.get('/detect', (req, res) => {
  const ua = req.get('user-agent') || '';
  let os = 'other';
  if (/android/i.test(ua)) os = 'android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'ios';
  res.json({ os, store: STORE_URLS[os] || null });
});

/** Находит самый свежий файл нужного расширения в каталоге релизов и стримит его. */
function streamLatest(res, next, { ext, contentType, downloadName }) {
  try {
    if (!fs.existsSync(RELEASES_DIR)) {
      return res.status(404).json({ error: 'Releases directory not found' });
    }
    const candidates = fs
      .readdirSync(RELEASES_DIR)
      .filter((f) => f.toLowerCase().endsWith(ext))
      .map((f) => ({ f, t: fs.statSync(path.join(RELEASES_DIR, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t);

    if (!candidates.length) return res.status(404).json({ error: `No ${ext} build available` });

    const full = path.join(RELEASES_DIR, candidates[0].f);
    // Защита от path traversal: файл обязан лежать внутри RELEASES_DIR.
    if (!full.startsWith(RELEASES_DIR + path.sep)) return res.status(400).json({ error: 'Bad path' });

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    res.setHeader('Content-Length', fs.statSync(full).size);
    res.setHeader('Cache-Control', 'public, max-age=300');

    const stream = fs.createReadStream(full);
    stream.on('error', next);
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
}

// GET /api/download/android → отдаёт свежий подписанный APK (или редиректит в Play).
router.get('/android', (req, res, next) => {
  if (process.env.PREFER_STORE === '1') return res.redirect(302, STORE_URLS.android);
  streamLatest(res, next, {
    ext: '.apk',
    contentType: 'application/vnd.android.package-archive',
    downloadName: 'AI-English-Teacher.apk',
  });
});

// iOS: веб-сайдлоад запрещён Apple → отправляем в App Store.
// (Ad-hoc установка возможна только через itms-services + manifest.plist для enterprise/UDID.)
router.get('/ios', (req, res) => res.redirect(302, STORE_URLS.ios));

export default router;
