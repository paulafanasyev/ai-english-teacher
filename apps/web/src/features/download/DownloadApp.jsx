// AI English Teacher — блок «Скачать приложение» для лендинга.
// Самодостаточный React-компонент на Tailwind: определяет ОС пользователя,
// подсвечивает нужный магазин, поддерживает авто-редирект и установку PWA.
// Ссылки на магазины и прямой APK передаются пропсами (значения по умолчанию ниже).
import { useEffect, useMemo, useState } from 'react';

export const STORE_LINKS = {
  // Замените на реальные ссылки после публикации:
  android: 'https://play.google.com/store/apps/details?id=com.aiteacher.app',
  ios: 'https://apps.apple.com/app/ai-english-teacher/id0000000000',
  // Прямая загрузка APK вне Google Play — эндпоинт бэкенда (apps/api/src/routes/download.js):
  apk: '/api/download/android',
};

/** Определяет мобильную ОС по userAgent (с учётом iPadOS, который маскируется под Mac). */
export function detectOS() {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent || navigator.vendor || '';
  if (/android/i.test(ua)) return 'android';
  const iOSLike = /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS 13+
  if (iOSLike) return 'ios';
  return 'other';
}

function useInstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setDeferred(e); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);
  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice.catch(() => {});
    setDeferred(null);
  };
  return { canInstall: !!deferred, install };
}

function StoreBadge({ href, kind, recommended, onClick }) {
  const isAndroid = kind === 'android';
  return (
    <a
      href={href}
      onClick={onClick}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={isAndroid ? 'Скачать в Google Play' : 'Скачать в App Store'}
      className={[
        'group relative flex items-center gap-3 rounded-2xl px-5 py-3.5 min-w-[210px]',
        'bg-black text-white transition-all hover:-translate-y-0.5 hover:shadow-xl',
        recommended ? 'ring-2 ring-offset-2 ring-fuchsia-500 shadow-lg' : 'opacity-95',
      ].join(' ')}
    >
      <span className="text-3xl leading-none">{isAndroid ? '🤖' : '🍎'}</span>
      <span className="text-left leading-tight">
        <span className="block text-[11px] font-semibold text-white/70">
          {isAndroid ? 'Загрузите в' : 'Загрузите в'}
        </span>
        <span className="block text-lg font-black tracking-tight">
          {isAndroid ? 'Google Play' : 'App Store'}
        </span>
      </span>
      {recommended && (
        <span className="absolute -top-2 -right-2 rounded-full bg-fuchsia-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide">
          Ваше устройство
        </span>
      )}
    </a>
  );
}

/**
 * Блок загрузки приложения.
 * @param {object}  props.links        ссылки на магазины/APK (по умолчанию STORE_LINKS)
 * @param {boolean} props.autoRedirect авто-переход в магазин по detected ОС (по умолчанию false)
 */
export default function DownloadApp({ links = STORE_LINKS, autoRedirect = false }) {
  const os = useMemo(detectOS, []);
  const { canInstall, install } = useInstallPrompt();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!autoRedirect) return;
    const target = os === 'android' ? links.android : os === 'ios' ? links.ios : null;
    if (target) { setRedirecting(true); window.location.href = target; }
  }, [autoRedirect, os, links]);

  const track = (platform) => () => {
    // Хук аналитики — подставьте свой (GA4 / Яндекс.Метрика / Amplitude):
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'app_download_click', { platform });
    }
  };

  return (
    <section
      className="relative overflow-hidden rounded-[28px] px-6 py-10 sm:px-10 sm:py-14
                 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white"
      aria-labelledby="download-title"
    >
      {/* декоративная сетка */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.6) 1px,transparent 1px)', backgroundSize: '22px 22px' }}
      />
      <div className="relative mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
          🎓 AI English &amp; Math Teacher
        </span>
        <h2 id="download-title" className="mt-5 text-3xl font-black leading-tight sm:text-5xl">
          Твой ИИ-учитель — <br className="hidden sm:block" />всегда в кармане
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base font-medium text-white/85 sm:text-lg">
          Живые аватары-преподаватели, подготовка к IELTS/TOEFL и геймификация.
          Скачай на своё устройство или установи как приложение прямо из браузера.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <StoreBadge href={links.android} kind="android" recommended={os === 'android'} onClick={track('android')} />
          <StoreBadge href={links.ios} kind="ios" recommended={os === 'ios'} onClick={track('ios')} />
        </div>

        {/* PWA + прямой APK */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-sm">
          {canInstall && (
            <button
              onClick={install}
              className="rounded-full bg-white px-5 py-2.5 font-bold text-violet-700 shadow hover:bg-white/90"
            >
              ⬇️ Установить как приложение (PWA)
            </button>
          )}
          <a
            href={links.apk}
            onClick={track('apk')}
            className="rounded-full border border-white/40 px-5 py-2.5 font-semibold text-white/90 hover:bg-white/10"
          >
            📦 Скачать APK напрямую
          </a>
        </div>

        {redirecting && (
          <p className="mt-4 text-sm font-semibold text-white/80" role="status">
            Открываем магазин приложений…{' '}
            <a className="underline" href={os === 'android' ? links.android : links.ios}>
              Не открылось? Нажмите здесь
            </a>
          </p>
        )}

        <p className="mt-6 text-xs font-medium text-white/60">
          Доступно на Android и iOS · Работает офлайн после установки · Русский · English · Tiếng Việt
        </p>
      </div>
    </section>
  );
}
