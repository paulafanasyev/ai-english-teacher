import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './app/App.jsx';
import { useApp } from './core/store.js';
import { initAnalytics } from './core/analytics.js';
import './styles.css'; // processed by Vite (or externalized by the no-npm esbuild pipeline)

// Apply saved theme before first paint (guarded: sandboxed iframes may block storage)
let savedTheme = 'candy';
try { savedTheme = (JSON.parse(window.localStorage.getItem('aet_prefs') || 'null') || {}).theme || 'candy'; } catch { /* noop */ }
document.documentElement.setAttribute('data-theme', savedTheme);

// Crash safety net: show the error instead of a silent white screen.
// Developers see the stack; children and parents see a short message with a reload button.
const DEV = !!import.meta.env.DEV;
function showFatal(msg) {
  let el = document.getElementById('aet-fatal');
  if (!el) {
    el = document.createElement('div');
    el.id = 'aet-fatal';
    el.style.cssText = 'position:fixed;inset:12px;z-index:99999;background:#fff;border:3px solid #f43f5e;border-radius:16px;padding:20px;overflow:auto;color:#111;' +
      (DEV ? 'font:14px/1.5 monospace;white-space:pre-wrap' : 'font:600 16px/1.5 Nunito,system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:14px');
    document.body.appendChild(el);
    if (!DEV) {
      const ru = (navigator.language || '').toLowerCase().startsWith('ru');
      const text = document.createElement('div');
      text.textContent = ru ? '😕 Что-то пошло не так. Перезагрузите страницу — прогресс сохранён.' : '😕 Something went wrong. Reload the page — your progress is saved.';
      const btn = document.createElement('button');
      btn.textContent = ru ? '🔄 Перезагрузить' : '🔄 Reload';
      btn.style.cssText = 'background:#7c3aed;color:#fff;border:none;border-radius:999px;padding:12px 22px;font:800 15px/1 Nunito,system-ui,sans-serif;cursor:pointer';
      btn.onclick = () => location.reload();
      el.append(text, btn);
    }
  }
  if (DEV) el.textContent += msg + '\n\n';
  else console.error(msg);
}
window.addEventListener('error', (e) => showFatal('[error] ' + (e.error?.stack || e.message)));
// A rejected promise is usually not fatal (network, optional features): only developers get the overlay.
window.addEventListener('unhandledrejection', (e) => {
  const msg = '[promise] ' + (e.reason?.stack || String(e.reason));
  if (DEV) showFatal(msg); else console.error(msg);
});

useApp.getState().boot();
initAnalytics(); // GA4 — no-op пока не задан VITE_GA_ID / window.__AET_GA_ID__

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);

// --- PWA: service worker + install prompt (works on a real HTTPS deploy) ---
// Guarded: in a sandboxed iframe (no allow-same-origin) even reading navigator.serviceWorker throws.
try {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      try { navigator.serviceWorker.register('sw.js').catch(() => {}); } catch { /* ignore */ }
    });
  }
} catch { /* sandboxed context — service worker unavailable, ignore */ }

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (document.getElementById('aet-install')) return;
  const btn = document.createElement('button');
  btn.id = 'aet-install';
  btn.textContent = '⬇️  Установить приложение';
  btn.style.cssText =
    'position:fixed;left:50%;transform:translateX(-50%);bottom:18px;z-index:99998;' +
    'background:linear-gradient(135deg,#7c3aed,#d946ef);color:#fff;border:none;border-radius:999px;' +
    'padding:13px 22px;font:800 15px/1 Nunito,system-ui,sans-serif;box-shadow:0 12px 34px rgba(124,58,237,.5);cursor:pointer';
  btn.onclick = async () => {
    btn.remove();
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice.catch(() => {});
    deferredPrompt = null;
  };
  document.body.appendChild(btn);
  setTimeout(() => btn.remove(), 14000);
});
window.addEventListener('appinstalled', () => { deferredPrompt = null; });
