// Student speech recognition (микрофон).
// В НАТИВНОМ приложении (Capacitor APK/IPA) Web Speech API недоступен
// (в iOS WKWebView SpeechRecognition отсутствует, в Android WebView нестабилен),
// поэтому используем плагин @capacitor-community/speech-recognition через
// РАНТАЙМ-МОСТ window.Capacitor.Plugins — без npm-импорта, чтобы не ломать
// офлайн-сборку веба. В браузере — обычный Web Speech API (Chrome).
// В любом случае UI всегда даёт текстовый ввод-фолбэк.

const webSR = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

// Доступ к нативному плагину ПО ИМЕНИ. window.Capacitor.registerPlugin
// инъектируется нативным слоем ДО загрузки страницы, поэтому плагин доступен
// без npm-импорта. Раньше читали только Capacitor.Plugins.SpeechRecognition —
// а он НЕ populated, пока никто не вызвал registerPlugin; из-за этого микрофон
// на устройстве не запускался (nativeSR() возвращал null).
function nativePlugin(name) {
  const C = typeof window !== 'undefined' ? window.Capacitor : null;
  if (!C || typeof C.isNativePlatform !== 'function' || !C.isNativePlatform()) return null;
  try {
    if (C.Plugins && C.Plugins[name]) return C.Plugins[name];
    if (typeof C.registerPlugin === 'function') {
      const p = C.registerPlugin(name);
      if (p) { if (C.Plugins) C.Plugins[name] = p; return p; }
    }
  } catch { /* ignore */ }
  return null;
}
function nativeSR() { return nativePlugin('SpeechRecognition'); }

// --- Web Speech API (браузер, Chrome) ---
function listenWeb(SR, { lang, onPartial, onFinal, onError }) {
  const r = new SR();
  r.lang = lang; r.interimResults = true; r.continuous = false; r.maxAlternatives = 3;
  let finalText = '', done = false;
  r.onresult = (e) => {
    let interim = '';
    for (const res of e.results) {
      if (res.isFinal) finalText += res[0].transcript + ' ';
      else interim += res[0].transcript;
    }
    onPartial?.((finalText + interim).trim());
  };
  r.onend = () => { if (!done) { done = true; onFinal?.(finalText.trim()); } };
  r.onerror = (e) => { if (!done) { done = true; onError?.(e.error || 'error'); } };
  try { r.start(); } catch { onError?.('busy'); }
  return { stop() { try { r.stop(); } catch {} } };
}

// --- Native plugin (@capacitor-community/speech-recognition) via bridge ---
function listenNative(SR, { lang, onPartial, onFinal, onError }) {
  let last = '', stopped = false, sub = null;
  (async () => {
    try {
      if (SR.requestPermissions) { await SR.requestPermissions().catch(() => {}); }
      if (SR.addListener) {
        sub = await SR.addListener('partialResults', (d) => {
          const m = (d && d.matches) || [];
          if (m[0]) { last = m[0]; onPartial?.(last); }
        });
      }
      const res = await SR.start({ language: lang, maxResults: 3, partialResults: true, popup: false });
      // iOS возвращает финальные matches из start(); Android — через слушатель.
      if (res && res.matches && res.matches[0]) { last = res.matches[0]; onPartial?.(last); }
    } catch (e) { if (!stopped) onError?.((e && e.message) || 'error'); }
  })();
  return {
    stop() {
      stopped = true;
      try { SR.stop && SR.stop(); } catch {}
      try { sub && sub.remove && sub.remove(); } catch {}
      try { SR.removeAllListeners && SR.removeAllListeners(); } catch {}
      onFinal?.(last.trim());
    },
  };
}

export const stt = {
  // true, если доступен нативный плагин ИЛИ Web Speech API
  get supported() { return !!(nativeSR() || webSR); },
  get isNative() { return !!nativeSR(); },
  listen({ lang = 'en-US', onPartial, onFinal, onError } = {}) {
    const nat = nativeSR();
    if (nat) return listenNative(nat, { lang, onPartial, onFinal, onError });
    if (webSR) return listenWeb(webSR, { lang, onPartial, onFinal, onError });
    onError?.('unsupported');
    return { stop() {} };
  },
};
