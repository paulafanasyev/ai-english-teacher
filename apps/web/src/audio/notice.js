// Tiny framework-free toast used by the speech engines, so sound/mic problems
// are never silent (works on every screen without touching React components).
const root = typeof window !== 'undefined' ? window : null;

export function uiLang() {
  if (!root) return 'en';
  let value = '';
  try {
    const prefs = JSON.parse(root.localStorage.getItem('aet_prefs') || '{}');
    value = prefs.locale || root.localStorage.getItem('aet_locale') || '';
  } catch { /* storage may be blocked */ }
  value = String(value || root.document?.documentElement?.lang || root.navigator?.language || 'ru').toLowerCase();
  if (value.startsWith('vi')) return 'vi';
  if (value.startsWith('en')) return 'en';
  return 'ru';
}

let box = null;
let hideTimer = null;
function ensureBox() {
  if (box || !root?.document?.body) return box;
  box = root.document.createElement('div');
  box.setAttribute('role', 'status');
  box.setAttribute('aria-live', 'polite');
  box.style.cssText = [
    'position:fixed', 'left:50%', 'bottom:calc(18px + env(safe-area-inset-bottom,0px))', 'transform:translate(-50%,20px)',
    'z-index:2147483000', 'max-width:min(92vw,460px)', 'padding:12px 16px', 'border-radius:16px',
    'background:rgba(17,24,39,.94)', 'color:#fff', 'font:700 14px/1.35 system-ui,-apple-system,Segoe UI,Roboto,sans-serif',
    'box-shadow:0 12px 40px rgba(0,0,0,.28)', 'display:flex', 'gap:10px', 'align-items:center',
    'opacity:0', 'pointer-events:none', 'transition:opacity .2s ease, transform .2s ease', 'cursor:pointer',
  ].join(';');
  root.document.body.appendChild(box);
  return box;
}

export function hideNotice() {
  if (!box) return;
  box.style.opacity = '0';
  box.style.transform = 'translate(-50%,20px)';
  box.style.pointerEvents = 'none';
  box.onclick = null;
}

export function showNotice(text, { timeout = 4500, onClick } = {}) {
  const el = ensureBox();
  if (!el) return;
  clearTimeout(hideTimer);
  el.textContent = text;
  el.onclick = () => { try { onClick?.(); } finally { hideNotice(); } };
  el.style.pointerEvents = 'auto';
  el.style.opacity = '1';
  el.style.transform = 'translate(-50%,0)';
  if (timeout) hideTimer = setTimeout(hideNotice, timeout);
}
