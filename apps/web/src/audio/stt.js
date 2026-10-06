// Student speech recognition. The browser API is used where available; the
// Capacitor plugin is resolved through the runtime bridge for native shells.
const root = typeof window !== 'undefined' ? window : null;
const webSR = root && (root.SpeechRecognition || root.webkitSpeechRecognition);

function nativePlugin(name) {
  const C = root && root.Capacitor;
  if (!C || typeof C.isNativePlatform !== 'function' || !C.isNativePlatform()) return null;
  try {
    if (C.Plugins && C.Plugins[name]) return C.Plugins[name];
    if (typeof C.registerPlugin === 'function') {
      const plugin = C.registerPlugin(name);
      if (plugin && C.Plugins) C.Plugins[name] = plugin;
      return plugin || null;
    }
  } catch { /* optional plugin */ }
  return null;
}
function nativeSR() { return nativePlugin('SpeechRecognition'); }
function normalizeLang(lang) {
  const value = String(lang || 'en-US').toLowerCase();
  if (value === 'ru' || value.startsWith('ru-')) return 'ru-RU';
  if (value === 'vi' || value.startsWith('vi-')) return 'vi-VN';
  return 'en-US';
}
function errorCode(error) {
  const code = String(error?.error || error?.code || error?.message || '').toLowerCase();
  if (code.includes('not-allowed') || code.includes('permission') || code.includes('denied')) return 'not-allowed';
  if (code.includes('no-speech') || code.includes('nospeech')) return 'no-speech';
  if (code.includes('network')) return 'network';
  if (code.includes('unsupported') || code.includes('unavailable')) return 'unsupported';
  return code || 'error';
}
function makeError(code, message) { return { code, message: message || code }; }

function listenWeb(SR, options) {
  let recognition;
  try { recognition = new SR(); } catch (error) {
    const e = makeError('unsupported', error?.message || 'Speech recognition unavailable');
    stt.lastError = e; options.onError?.(e.code, e.message);
    return { stop() {} };
  }
  const interimResults = options.interimResults !== false;
  recognition.lang = options.lang;
  recognition.interimResults = interimResults;
  recognition.continuous = options.continuous === true;
  recognition.maxAlternatives = 3;
  let finalText = '';
  let done = false;
  const fail = (raw) => {
    if (done) return;
    done = true;
    const code = errorCode(raw);
    const e = makeError(code, raw?.message || code);
    stt.lastError = e;
    options.onError?.(e.code, e.message);
  };
  recognition.onresult = (event) => {
    if (done) return;
    let interim = '';
    for (let i = event.resultIndex || 0; i < event.results.length; i += 1) {
      const result = event.results[i];
      const transcript = result?.[0]?.transcript || '';
      if (result.isFinal) finalText += `${transcript} `;
      else interim += transcript;
    }
    const combined = `${finalText}${interim}`.trim();
    if (interimResults) options.onPartial?.(combined);
    options.onInterim?.(interim.trim());
  };
  recognition.onend = () => {
    if (done) return;
    done = true;
    options.onFinal?.(finalText.trim());
  };
  recognition.onerror = fail;
  try { recognition.start(); } catch (error) {
    const e = makeError(errorCode(error) === 'error' ? 'busy' : errorCode(error), error?.message || 'Recognition could not start');
    stt.lastError = e;
    done = true;
    options.onError?.(e.code, e.message);
  }
  return {
    stop() {
      if (done) return;
      try { recognition.stop(); } catch { /* onend normally follows */ }
    },
  };
}

function permissionGranted(result) {
  if (!result || typeof result !== 'object') return true;
  const value = result.speechRecognition ?? result.microphone ?? result.permission;
  return value == null || value === 'granted' || value === true;
}
function listenNative(SR, options) {
  let last = '';
  let stopped = false;
  let finished = false;
  let sub = null;
  const cleanup = () => {
    try { sub?.remove?.(); } catch {}
    try { SR.removeAllListeners?.(); } catch {}
  };
  const fail = (raw) => {
    if (stopped || finished) return;
    finished = true;
    cleanup();
    const e = makeError(errorCode(raw), raw?.message || errorCode(raw));
    stt.lastError = e;
    options.onError?.(e.code, e.message);
  };
  const finish = () => {
    if (finished) return;
    finished = true;
    cleanup();
    options.onFinal?.(last.trim());
  };
  (async () => {
    try {
      if (SR.requestPermissions) {
        const permission = await SR.requestPermissions();
        if (!permissionGranted(permission)) { fail({ code: 'not-allowed', message: 'Microphone permission was denied' }); return; }
      }
      if (SR.addListener) {
        sub = await SR.addListener('partialResults', (data) => {
          if (stopped || finished) return;
          const matches = data?.matches || [];
          if (matches[0]) {
            last = matches[0];
            if (options.interimResults !== false) options.onPartial?.(last);
            options.onInterim?.(last);
          }
        });
      }
      if (stopped || finished) return;
      const result = await SR.start({ language: options.lang, maxResults: 3, partialResults: options.interimResults !== false, popup: false });
      if (result?.matches?.[0]) {
        last = result.matches[0];
        if (options.interimResults !== false) options.onPartial?.(last);
        options.onInterim?.(last);
      }
    } catch (error) { fail(error); }
  })();
  return {
    stop() {
      if (stopped || finished) return;
      stopped = true;
      try { SR.stop?.(); } catch {}
      finish();
    },
  };
}

export const stt = {
  get supported() { return !!(nativeSR() || webSR); },
  get isNative() { return !!nativeSR(); },
  lastError: null,
  listen({ lang = 'en-US', interimResults = true, continuous = false, onPartial, onInterim, onFinal, onError } = {}) {
    const options = { lang: normalizeLang(lang), interimResults, continuous, onPartial, onInterim, onFinal, onError };
    stt.lastError = null;
    const native = nativeSR();
    if (native) return listenNative(native, options);
    if (webSR) return listenWeb(webSR, options);
    const e = makeError('unsupported', 'Speech recognition is not available in this browser or WebView');
    stt.lastError = e;
    onError?.(e.code, e.message);
    return { stop() {} };
  },
};
