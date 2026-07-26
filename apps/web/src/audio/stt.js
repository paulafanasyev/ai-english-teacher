// Student speech recognition (микрофон).
// В НАТИВНОМ приложении (Capacitor APK/IPA) Web Speech API недоступен
// (в iOS WKWebView SpeechRecognition отсутствует, в Android WebView нестабилен),
// поэтому используем плагин @capacitor-community/speech-recognition через
// РАНТАЙМ-МОСТ window.Capacitor.Plugins — без npm-импорта, чтобы не ломать
// офлайн-сборку веба. В браузере — обычный Web Speech API (Chrome).
// В любом случае UI всегда даёт текстовый ввод-фолбэк.

const webSR = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

function nativeSR() {
  const c = typeof window !== 'undefined' ? window.Capacitor : null;
  if (c && typeof c.isNativePlatform === 'function' && c.isNativePlatform()
      && c.Plugins && c.Plugins.SpeechRecognition) {
    return c.Plugins.SpeechRecognition;
  }
  return null;
}

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
