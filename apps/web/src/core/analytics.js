// Лёгкая обёртка аналитики (GA4). Пока не задан Measurement ID — полностью no-op.
// Задать ID можно двумя способами:
//   1) при сборке:  VITE_GA_ID=G-XXXXXXXXXX npm run build
//   2) в рантайме:  <script>window.__AET_GA_ID__='G-XXXXXXXXXX'</script> в index.html до app.js
function gaId() {
  try {
    if (import.meta && import.meta.env && import.meta.env.VITE_GA_ID) return import.meta.env.VITE_GA_ID;
  } catch { /* import.meta.env недоступен в офлайн-сборке — идём дальше */ }
  if (typeof window !== 'undefined' && window.__AET_GA_ID__) return window.__AET_GA_ID__;
  return '';
}

let ready = false;

export function initAnalytics() {
  if (ready || typeof window === 'undefined' || typeof document === 'undefined') return;
  const id = gaId();
  if (!id) return; // аналитика не сконфигурирована — тихо выключена
  ready = true;
  try {
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id, { send_page_view: false });
    const pageview = () => track('page_view', { page_path: (location.hash || '#/').replace(/^#/, '') || '/' });
    pageview();
    window.addEventListener('hashchange', pageview); // hash-роутинг SPA
  } catch { /* не ломаем приложение из-за аналитики */ }
}

// Универсальный трекер события. Безопасен, если аналитика не подключена.
export function track(event, params = {}) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', event, params);
    }
  } catch { /* ignore */ }
}
