// Student speech recognition. The browser API is used where available; the
// Capacitor plugin is resolved through the runtime bridge for native shells.
//
// v3: asks for microphone permission explicitly (getUserMedia) before starting
// recognition, retries once on "no-speech", and always tells the student what
// went wrong (blocked mic, no internet for Chrome's recogniser, unsupported).
import { showNotice, uiLang } from './notice.js';

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
  const code = String(error?.error || error?.code || error?.name || error?.message || '').toLowerCase();
  if (code.includes('not-allowed') || code.includes('notallowed') || code.includes('permission') || code.includes('denied') || code.includes('service-not-allowed')) return 'not-allowed';
  if (code.includes('no-speech') || code.includes('nospeech')) return 'no-speech';
  if (code.includes('audio-capture') || code.includes('notfound') || code.includes('notreadable')) return 'audio-capture';
  if (code.includes('network')) return 'network';
  if (code.includes('aborted')) return 'aborted';
  if (code.includes('unsupported') || code.includes('unavailable') || code.includes('language-not-supported')) return 'unsupported';
  if (code.includes('insecure')) return 'insecure';
  return code || 'error';
}

const MESSAGES = {
  ru: {
    'not-allowed': '🎤 Доступ к микрофону запрещён. Нажмите на значок замка в адресной строке → Микрофон → Разрешить, и попробуйте снова.',
    'audio-capture': '🎤 Микрофон не найден или занят другим приложением.',
    network: '🌐 Распознавание речи в Chrome работает через интернет. Проверьте подключение или ответьте текстом.',
    'no-speech': '🤫 Не расслышала. Нажмите на микрофон и говорите чуть громче.',
    unsupported: '🎤 Этот браузер не умеет распознавать речь. Откройте сайт в Chrome или Edge, или ответьте текстом.',
    insecure: '🔒 Микрофон работает только по https или на localhost.',
    error: '🎤 Не получилось распознать речь. Попробуйте ещё раз или ответьте текстом.',
  },
  en: {
    'not-allowed': '🎤 Microphone access is blocked. Click the lock icon in the address bar → Microphone → Allow, then try again.',
    'audio-capture': '🎤 No microphone found, or it is used by another app.',
    network: '🌐 Chrome speech recognition needs the internet. Check the connection or type your answer.',
    'no-speech': '🤫 I didn\u2019t hear you. Tap the mic and speak a bit louder.',
    unsupported: '🎤 This browser can\u2019t recognise speech. Use Chrome or Edge, or type your answer.',
    insecure: '🔒 The microphone only works over https or on localhost.',
    error: '🎤 Speech recognition failed. Try again or type your answer.',
  },
  vi: {
    'not-allowed': '🎤 Micro đang bị chặn. Bấm biểu tượng ổ khóa trên thanh địa chỉ → Micro → Cho phép, rồi thử lại.',
    'audio-capture': '🎤 Không tìm thấy micro hoặc micro đang được ứng dụng khác dùng.',
    network: '🌐 Nhận dạng giọng nói của Chrome cần Internet. Hãy kiểm tra kết nối hoặc nhập câu trả lời.',
    'no-speech': '🤫 Mình chưa nghe rõ. Bấm micro và nói to hơn một chút nhé.',
    unsupported: '🎤 Trình duyệt này không nhận dạng giọng nói. Hãy dùng Chrome hoặc Edge, hoặc nhập câu trả lời.',
    insecure: '🔒 Micro chỉ hoạt động qua https hoặc localhost.',
    error: '🎤 Không nhận dạng được. Hãy thử lại hoặc nhập câu trả lời.',
  },
};
export function sttMessage(code, locale = uiLang()) {
  const dict = MESSAGES[locale] || MESSAGES.en;
  return dict[code] || dict.error;
}
function makeError(code, message) { return { code, message: message || code }; }
function report(options, code, message) {
  const e = makeError(code, message);
  stt.lastError = e;
  if (code !== 'aborted' && options.notify !== false) showNotice(sttMessage(code), { timeout: code === 'not-allowed' ? 9000 : 5000 });
  try { options.onError?.(e.code, sttMessage(code)); } catch {}
}

// --- microphone permission -------------------------------------------------
let micGranted = false;
async function ensureMicrophone() {
  if (micGranted) return 'ok';
  if (root && root.isSecureContext === false) return 'insecure';
  const media = root?.navigator?.mediaDevices;
  if (!media || typeof media.getUserMedia !== 'function') return 'ok'; // let the recogniser ask
  try {
    const status = await root.navigator.permissions?.query?.({ name: 'microphone' });
    if (status?.state === 'granted') { micGranted = true; return 'ok'; }
  } catch { /* Firefox/Safari may not know "microphone" */ }
  try {
    const stream = await media.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    stream.getTracks().forEach((track) => track.stop());
    micGranted = true;
    // Give the OS a moment to release the device before the recogniser opens it.
    await new Promise((resolve) => setTimeout(resolve, 160));
    return 'ok';
  } catch (error) {
    const code = errorCode(error);
    return code === 'not-allowed' || code === 'audio-capture' ? code : 'ok';
  }
}

function listenWeb(SR, options) {
  const state = { stopped: false, done: false, recognition: null, restarts: 0, finalText: '' };
  const interimResults = options.interimResults !== false;
  const finish = (text) => {
    if (state.done) return;
    state.done = true;
    clearTimeout(state.timer);
    options.onFinal?.(String(text || '').trim());
  };
  const fail = (code, message) => {
    if (state.done) return;
    state.done = true;
    clearTimeout(state.timer);
    report(options, code, message);
  };
  const start = () => {
    if (state.stopped || state.done) return;
    let recognition;
    try { recognition = new SR(); } catch (error) { fail('unsupported', error?.message); return; }
    state.recognition = recognition;
    recognition.lang = options.lang;
    recognition.interimResults = interimResults;
    recognition.continuous = options.continuous === true;
    recognition.maxAlternatives = 3;
    let gotSpeech = false;
    let lastError = null;
    recognition.onresult = (event) => {
      if (state.done) return;
      gotSpeech = true;
      let interim = '';
      for (let i = event.resultIndex || 0; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result?.[0]?.transcript || '';
        if (result.isFinal) state.finalText += `${transcript} `;
        else interim += transcript;
      }
      state.interim = interim;
      const combined = `${state.finalText}${interim}`.trim();
      if (interimResults) options.onPartial?.(combined);
      options.onInterim?.(interim.trim());
    };
    recognition.onerror = (event) => { lastError = errorCode(event); };
    recognition.onend = () => {
      if (state.done) return;
      const text = `${state.finalText}${state.interim || ''}`.trim();
      if (text) { finish(text); return; }
      if (state.stopped) { finish(''); return; }
      if ((lastError === 'no-speech' || (!lastError && !gotSpeech)) && state.restarts < 1) {
        state.restarts += 1;
        setTimeout(start, 120);
        return;
      }
      if (lastError && lastError !== 'aborted') fail(lastError, lastError);
      else fail('no-speech', 'no-speech');
    };
    try { recognition.start(); } catch (error) {
      const code = errorCode(error);
      fail(code === 'error' ? 'busy' : code, error?.message || 'Recognition could not start');
    }
  };
  (async () => {
    if (root?.navigator && root.navigator.onLine === false) { fail('network', 'offline'); return; }
    const mic = await ensureMicrophone();
    if (state.stopped) { finish(''); return; }
    if (mic !== 'ok') { fail(mic, mic); return; }
    try { options.onStart?.(); } catch {}
    start();
    // Safety net: never leave the mic button stuck in "listening".
    state.timer = setTimeout(() => { try { state.recognition?.stop(); } catch {} }, options.maxMs || 15000);
  })();
  return {
    stop() {
      if (state.done || state.stopped) return;
      state.stopped = true;
      try { state.recognition?.stop(); } catch { finish(state.finalText); }
      setTimeout(() => finish(`${state.finalText}${state.interim || ''}`), 1500);
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
    const code = errorCode(raw);
    report(options, code, raw?.message || code);
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
      try { options.onStart?.(); } catch {}
      const result = await SR.start({ language: options.lang, maxResults: 3, partialResults: options.interimResults !== false, popup: false });
      if (result?.matches?.[0]) {
        last = result.matches[0];
        if (options.interimResults !== false) options.onPartial?.(last);
        options.onInterim?.(last);
        finish();
      }
    } catch (error) { fail(error); }
  })();
  return {
    stop() {
      if (stopped || finished) return;
      stopped = true;
      try { SR.stop?.(); } catch {}
      setTimeout(finish, 400);
    },
  };
}

export const stt = {
  get supported() { return !!(nativeSR() || webSR); },
  get isNative() { return !!nativeSR(); },
  lastError: null,
  message: sttMessage,
  // Ask for the microphone ahead of time (e.g. on a "Start speaking" screen).
  async prepare() { return ensureMicrophone(); },
  listen({ lang = 'en-US', interimResults = true, continuous = false, onPartial, onInterim, onFinal, onError, onStart, notify, maxMs } = {}) {
    const options = { lang: normalizeLang(lang), interimResults, continuous, onPartial, onInterim, onFinal, onError, onStart, notify, maxMs };
    stt.lastError = null;
    const native = nativeSR();
    if (native) return listenNative(native, options);
    if (webSR) return listenWeb(webSR, options);
    report(options, 'unsupported', 'Speech recognition is not available in this browser or WebView');
    return { stop() {} };
  },
};
