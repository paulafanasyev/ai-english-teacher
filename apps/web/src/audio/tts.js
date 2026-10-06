// Local teacher speech. Browser SpeechSynthesis is preferred; Capacitor's
// TextToSpeech plugin is used in native WebViews where SpeechSynthesis is absent.
//
// Chrome pitfalls handled here (they made teachers silent in v2):
//  * speak() right after cancel() is dropped -> cancel only when busy, then wait.
//  * an empty/zero-width "unlock" utterance can wedge the queue -> never queued.
//  * remote "Google" voices sometimes never start -> watchdog retries with a
//    local voice, then with the browser default voice.
//  * speech before the first user gesture fails with "not-allowed" -> the job is
//    kept and replayed on the next tap, with a visible "tap to enable sound" hint.
import { speechBus } from './speechBus.js';
import { showNotice, hideNotice, uiLang } from './notice.js';

const root = typeof window !== 'undefined' ? window : null;
const synthesis = root && 'speechSynthesis' in root ? root.speechSynthesis : null;
const webSpeech = !!synthesis && typeof root.SpeechSynthesisUtterance === 'function';
export const supported = webSpeech || !!(root && root.Capacitor && typeof root.Capacitor.isNativePlatform === 'function');

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
  } catch { /* a missing optional plugin is normal on the web */ }
  return null;
}
function nativeTTS() { return nativePlugin('TextToSpeech'); }

const LANGS = { en: 'en-US', ru: 'ru-RU', vi: 'vi-VN' };
const F_HINTS = {
  en: ['female', 'samantha', 'aria', 'jenny', 'zira', 'victoria', 'karen', 'moira', 'tessa', 'sonia', 'libby', 'ava', 'allison', 'susan', 'google us english'],
  ru: ['milena', 'irina', 'svetlana', 'female', 'жен', 'google русский'],
  vi: ['linh', 'hoaimy', 'hoai my', 'hoa my', 'google tiếng việt', 'female'],
};
const M_HINTS = {
  en: ['male', 'david', 'mark', 'daniel', 'guy', 'ryan', 'alex', 'fred', 'arthur', 'george', 'thomas', 'oliver', 'aaron', 'christopher'],
  ru: ['pavel', 'dmitry', 'male', 'муж'],
  vi: ['namminh', 'nam minh', 'hoang', 'male'],
};
const NOTICE = {
  ru: { tap: '🔊 Нажмите, чтобы включить звук', none: '🔇 В браузере нет голоса для этого языка. Установите голос в настройках системы или откройте сайт в Chrome/Edge.', fail: '🔇 Не удалось воспроизвести речь. Проверьте громкость и попробуйте ещё раз.' },
  en: { tap: '🔊 Tap to enable sound', none: '🔇 No voice for this language in your browser. Install one in system settings or use Chrome/Edge.', fail: '🔇 Speech could not play. Check the volume and try again.' },
  vi: { tap: '🔊 Chạm để bật âm thanh', none: '🔇 Trình duyệt chưa có giọng đọc cho ngôn ngữ này. Hãy cài giọng trong cài đặt hệ thống hoặc dùng Chrome/Edge.', fail: '🔇 Không phát được giọng nói. Hãy kiểm tra âm lượng và thử lại.' },
};
const notice = (key) => (NOTICE[uiLang()] || NOTICE.en)[key];

const voices = [];
const badVoices = new Set(); // voices that never started in this session
function refreshVoices() {
  if (!synthesis || typeof synthesis.getVoices !== 'function') return;
  try { voices.splice(0, voices.length, ...synthesis.getVoices()); } catch { /* some WebViews throw */ }
}
refreshVoices();
if (synthesis) {
  const onChange = () => refreshVoices();
  try { synthesis.addEventListener('voiceschanged', onChange); } catch { synthesis.onvoiceschanged = onChange; }
}

const languageKey = (lang) => {
  const value = String(lang || 'en-US').toLowerCase();
  if (value === 'ru' || value.startsWith('ru-')) return 'ru';
  if (value === 'vi' || value.startsWith('vi-')) return 'vi';
  return 'en';
};
const normalizeLang = (lang) => LANGS[languageKey(lang)] || 'en-US';

// attempt 0: best voice (any), 1: best local voice, 2: browser default.
function pickVoice(lang, gender, attempt = 0) {
  if (attempt >= 2) return null;
  const key = languageKey(lang);
  let candidates = voices.filter((v) => !badVoices.has(v.name) && String(v.lang || '').toLowerCase().replace('_', '-').startsWith(key));
  if (attempt === 1) candidates = candidates.filter((v) => v.localService !== false);
  if (!candidates.length) return null;
  const wanted = (gender === 'm' ? M_HINTS : F_HINTS)[key] || [];
  const unwanted = (gender === 'm' ? F_HINTS : M_HINTS)[key] || [];
  let best = candidates[0]; let bestScore = -Infinity;
  candidates.forEach((voice) => {
    const name = String(voice.name || '').toLowerCase();
    const voiceLang = String(voice.lang || '').toLowerCase().replace('_', '-');
    let score = 0;
    wanted.forEach((hint) => { if (name.includes(hint)) score += 4; });
    unwanted.forEach((hint) => { if (name.includes(hint)) score -= 3; });
    if (voiceLang === normalizeLang(lang).toLowerCase()) score += 2;
    if (/natural|neural|premium|enhanced/.test(name)) score += 2;
    if (voice.default) score += 0.5;
    if (voice.localService === false) score += 0.25;
    if (score > bestScore) { best = voice; bestScore = score; }
  });
  return best;
}
const hasVoiceFor = (lang) => voices.some((v) => languageKey(v.lang) === languageKey(lang) && String(v.lang || '').toLowerCase().startsWith(languageKey(lang)));

function chunksFor(text) {
  const source = String(text || '').trim();
  if (!source) return [];
  const sentences = source.match(/[^.!?。！？]+[.!?。！？]+|[^.!?。！？]+$/g) || [source];
  const chunks = [];
  sentences.forEach((sentence) => {
    let rest = sentence.trim();
    while (rest.length >= 180) {
      let cut = rest.slice(0, 176).lastIndexOf(' ');
      if (cut < 40) cut = 176;
      chunks.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
    if (rest && /[\p{L}\p{N}]/u.test(rest)) chunks.push(rest);
  });
  return chunks;
}

function visemeFor(value) {
  const s = String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (!s) return 'rest';
  if (/^(oo|ou|ow|w|q)/.test(s)) return 'W';
  const ch = s[0];
  if ('aаăâя'.includes(ch)) return 'A';
  if ('eёеэê'.includes(ch)) return 'E';
  if ('iіїйыy'.includes(ch)) return 'I';
  if ('oоơô'.includes(ch)) return 'O';
  if ('uуưю'.includes(ch)) return 'U';
  if ('mbpмбп'.includes(ch)) return 'M';
  if ('fvфв'.includes(ch)) return 'F';
  if ('lntdлнтдđ'.includes(ch)) return 'L';
  return 'E';
}
function visemeUnits(value) {
  const chars = [...String(value || '')];
  const units = [];
  for (let i = 0; i < chars.length; i += 1) {
    const rest = chars.slice(i, i + 2).join('').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (/^(oo|ou|ow)/.test(rest)) { units.push(chars.slice(i, i + 2).join('')); i += 1; }
    else if (/\p{L}/u.test(chars[i])) units.push(chars[i]);
  }
  return units;
}

let voiceEnabled = true;
export function setVoiceEnabled(value) {
  voiceEnabled = !!value;
  if (!voiceEnabled) tts.stop();
}

let current = null;
let sequence = null;
let blockedJob = null;   // job waiting for a user gesture
let gestureSeen = false;

function now() { return typeof performance !== 'undefined' ? performance.now() : Date.now(); }
function clearTimers(job) {
  (job?.timers || []).forEach((timer) => clearTimeout(timer));
  if (job) job.timers.length = 0;
  if (job?.keepAlive) { clearInterval(job.keepAlive); job.keepAlive = null; }
}
function isCurrent(job) { return current === job && !job.ended; }
function emitViseme(job, v, t = now() - job.startedAt) {
  if (isCurrent(job)) speechBus.emit('viseme', { v, t, teacherId: job.teacherId });
}
function scheduleEstimated(job, text, rate, offset = 0, duration = 0, initialDelay = 60) {
  if (!isCurrent(job)) return;
  const letters = visemeUnits(text);
  if (!letters.length) return;
  const total = duration > 0 ? duration : (letters.length / (13 * Math.max(0.25, rate || 1))) * 1000;
  const step = total / letters.length;
  letters.forEach((letter, i) => {
    job.timers.push(setTimeout(() => emitViseme(job, visemeFor(letter), offset + i * step), Math.max(0, initialDelay + i * step)));
  });
}
function scheduleWordVisemes(job, word, startAt) {
  visemeUnits(word).forEach((letter, i) => {
    job.timers.push(setTimeout(() => emitViseme(job, visemeFor(letter), startAt + i * 45), i * 45));
  });
}
function wordAt(text, charIndex) {
  const before = String(text).slice(0, Math.max(0, charIndex));
  const match = String(text).slice(Math.max(0, charIndex)).match(/^[^\s]+/);
  return { index: (before.match(/\S+/g) || []).length, word: match ? match[0] : '' };
}

function begin(job) {
  if (job.started) return;
  job.started = true;
  job.startedAt = now();
  tts.speaking = true;
  speechBus.emit('start', { teacherId: job.teacherId, text: job.text });
  try { job.onStart?.(); } catch { /* caller callback must not break speech */ }
}
function reportError(job, code, message) {
  const error = { code: code || 'error', message: message || code || 'Speech failed' };
  tts.lastError = error;
  speechBus.emit('error', error);
}
function endJob(job) {
  if (!job || job.ended) return;
  job.ended = true;
  clearTimers(job);
  if (current === job) current = null;
  if (blockedJob === job) blockedJob = null;
  tts.speaking = false;
  speechBus.emit('viseme', { v: 'rest', t: now() - (job.startedAt || now()), teacherId: job.teacherId });
  speechBus.emit('end', { teacherId: job.teacherId });
  try { job.onEnd?.(); } catch { /* caller callback must not break cleanup */ }
}
function endSequence(seq) {
  if (!seq || seq.ended) return;
  seq.ended = true;
  if (seq.timer) clearTimeout(seq.timer);
  if (sequence === seq) sequence = null;
  try { seq.onEnd?.(); } catch {}
}
function cancelEngine() {
  if (!synthesis) return;
  try { if (synthesis.speaking || synthesis.pending || synthesis.paused) synthesis.cancel(); } catch {}
}
function stopJob(job) {
  if (!job) return;
  clearTimers(job);
  try { job.audio?.pause?.(); } catch {}
  cancelEngine();
  try { nativeTTS()?.stop?.(); } catch {}
  endJob(job);
}

function codeFromError(error) {
  const code = String(error?.error || error?.code || '').toLowerCase();
  if (code === 'interrupted' || code === 'canceled' || code === 'cancelled') return 'cancelled';
  return code || 'error';
}
function fallbackAudio(job) {
  if (!job.fallbackUrl || !root || typeof root.Audio !== 'function') return false;
  let audio;
  try { audio = new root.Audio(job.fallbackUrl); } catch { return false; }
  job.audio = audio;
  const startAudio = () => {
    if (!isCurrent(job) || job.audioStarted) return;
    job.audioStarted = true;
    const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration * 1000 : 0;
    begin(job);
    scheduleEstimated(job, job.text, job.rate, 0, duration, 0);
    const result = audio.play?.();
    if (result && typeof result.catch === 'function') result.catch((error) => { reportError(job, 'playback', error?.message || 'Audio playback failed'); endJob(job); });
  };
  audio.preload = 'auto';
  audio.oncanplay = startAudio;
  audio.onended = () => endJob(job);
  audio.onerror = () => { reportError(job, 'playback', 'Fallback audio could not be loaded'); endJob(job); };
  if (audio.readyState >= 2) startAudio();
  return true;
}
function failOrFallback(job, code, message) {
  if (!isCurrent(job)) return;
  reportError(job, code, message);
  clearTimers(job);
  if (fallbackAudio(job)) return;
  if (code !== 'cancelled') showNotice(code === 'no-voice' ? notice('none') : notice('fail'));
  endJob(job);
}
function waitForGesture(job) {
  // Chrome refuses speech before the first interaction: keep the job and replay it.
  clearTimers(job);
  cancelEngine();
  blockedJob = job;
  job.part = 0;
  showNotice(notice('tap'), { timeout: 0, onClick: () => tts.unlock() });
}

function runWeb(job) {
  if (!webSpeech || !isCurrent(job)) return false;
  const parts = chunksFor(job.text);
  if (!parts.length) { endJob(job); return true; }
  job.part = job.part || 0;
  job.attempt = job.attempt || 0;
  let wordIndex = 0;

  const speakPart = () => {
    if (!isCurrent(job) || blockedJob === job) return;
    if (job.part >= parts.length) { endJob(job); return; }
    const part = parts[job.part];
    let utterance;
    try { utterance = new root.SpeechSynthesisUtterance(part); } catch (error) { failOrFallback(job, 'unsupported', error?.message); return; }
    let started = false; let boundarySeen = false; let settled = false;
    utterance.lang = job.lang;
    const voice = pickVoice(job.lang, job.gender, job.attempt);
    if (voice) utterance.voice = voice;
    utterance.pitch = job.pitch;
    utterance.rate = job.rate;
    utterance.volume = 1;
    job.utterance = utterance; // keep a reference: Chrome GC can drop events otherwise
    const retry = (reason) => {
      if (settled || !isCurrent(job)) return;
      settled = true;
      cancelEngine();
      if (voice && (reason === 'timeout' || reason === 'silent' || reason === 'voice-unavailable' || reason === 'synthesis-failed')) badVoices.add(voice.name);
      if (job.attempt < 2) {
        job.attempt += 1;
        job.timers.push(setTimeout(speakPart, 120));
      } else if (!gestureSeen && !(root.navigator?.userActivation?.hasBeenActive)) {
        waitForGesture(job);
      } else {
        failOrFallback(job, voices.length && !hasVoiceFor(job.lang) ? 'no-voice' : reason, 'Speech did not start');
      }
    };
    utterance.onstart = () => {
      if (!isCurrent(job)) return;
      started = true;
      hideNotice();
      begin(job);
      job.timers.push(setTimeout(() => { if (!boundarySeen) scheduleEstimated(job, part, job.rate); }, 140));
    };
    utterance.onboundary = (event) => {
      if (!isCurrent(job) || event.name === 'sentence') return;
      boundarySeen = true;
      const charIndex = Number.isFinite(event.charIndex) ? event.charIndex : 0;
      const found = wordAt(part, charIndex);
      speechBus.emit('word', { index: wordIndex++, charIndex });
      scheduleWordVisemes(job, found.word, now() - (job.startedAt || now()));
    };
    utterance.onend = () => {
      if (settled || !isCurrent(job)) return;
      if (!started) { retry('silent'); return; } // ended without ever starting
      settled = true;
      job.part += 1;
      job.timers.push(setTimeout(speakPart, 0));
    };
    utterance.onerror = (event) => {
      if (settled || !isCurrent(job)) return;
      const code = codeFromError(event);
      if (code === 'cancelled') { settled = true; return; }
      if (code === 'not-allowed') { settled = true; waitForGesture(job); return; }
      retry(code);
    };
    // Watchdog: some voices never fire onstart (offline remote voice, wedged queue).
    job.timers.push(setTimeout(() => { if (!started && !settled) retry('timeout'); }, 2800));
    const go = () => {
      if (!isCurrent(job) || settled) return;
      try { synthesis.resume?.(); synthesis.speak(utterance); } catch (error) { retry(error?.message || 'error'); }
    };
    if (synthesis.speaking || synthesis.pending) { cancelEngine(); job.timers.push(setTimeout(go, 90)); } else go();
  };

  // Chrome pauses long utterances after ~15 s; nudge it while we are talking.
  job.keepAlive = setInterval(() => {
    if (isCurrent(job) && synthesis.speaking && !synthesis.paused) { try { synthesis.pause(); synthesis.resume(); } catch {} }
  }, 9000);
  if (!voices.length) { tts.ready().then(() => { if (isCurrent(job)) speakPart(); }); } else speakPart();
  return true;
}
function runNative(job, plugin) {
  if (!plugin || typeof plugin.speak !== 'function' || !isCurrent(job)) return false;
  begin(job);
  scheduleEstimated(job, job.text, job.rate, 0, 0, 0);
  try {
    Promise.resolve(plugin.speak({ text: job.text, lang: job.lang, rate: job.rate, pitch: job.pitch, volume: 1, category: 'playback' }))
      .then(() => { if (isCurrent(job)) endJob(job); })
      .catch((error) => {
        if (!isCurrent(job)) return;
        if (webSpeech) { clearTimers(job); runWeb(job); } else failOrFallback(job, codeFromError(error), error?.message || 'Native speech failed');
      });
    return true;
  } catch (error) { failOrFallback(job, codeFromError(error), error?.message || 'Native speech failed'); return true; }
}

function onGesture() {
  gestureSeen = true;
  tts.unlock();
}
if (root) {
  try {
    root.addEventListener('pointerdown', onGesture, { capture: true, passive: true });
    root.addEventListener('keydown', onGesture, { capture: true, passive: true });
    root.addEventListener('touchend', onGesture, { capture: true, passive: true });
  } catch { /* old WebViews */ }
}

export const tts = {
  get supported() { return webSpeech || !!nativeTTS(); },
  speaking: false,
  lastError: null,
  ready() {
    refreshVoices();
    if (!synthesis || voices.length) return Promise.resolve(voices);
    return new Promise((resolve) => {
      let settled = false;
      const finish = () => { if (!settled) { settled = true; refreshVoices(); resolve(voices); } };
      try { synthesis.addEventListener('voiceschanged', finish, { once: true }); } catch {}
      setTimeout(finish, 1200);
    });
  },
  // Called from user gestures. Never queues a dummy utterance (that wedged Chrome).
  unlock() {
    if (nativeTTS()) return true;
    if (!webSpeech) return false;
    gestureSeen = true;
    try { if (synthesis.paused) synthesis.resume(); } catch {}
    refreshVoices();
    const job = blockedJob;
    if (job && isCurrent(job)) {
      blockedJob = null;
      hideNotice();
      job.attempt = 0;
      runWeb(job);
    }
    return true;
  },
  speak(text, teacher, options = {}) {
    const opts = options || {};
    const source = String(text || '').trim();
    if (!source || (!voiceEnabled && !opts.force)) { try { opts.onEnd?.(); } catch {} return false; }
    if (sequence && sequence !== opts._sequence) { sequence.cancelled = true; endSequence(sequence); }
    if (current) { clearTimers(current); try { current.audio?.pause?.(); } catch {} endJob(current); }
    blockedJob = null;
    this.lastError = null;
    const job = {
      text: source,
      teacherId: teacher?.id,
      gender: teacher?.gender || 'f',
      lang: normalizeLang(opts.lang || 'en-US'),
      rate: Number(teacher?.voice?.rate) || 1,
      pitch: Number(teacher?.voice?.pitch) || 1,
      fallbackUrl: opts.fallbackUrl,
      onStart: opts.onStart,
      onEnd: opts.onEnd,
      started: false,
      ended: false,
      timers: [],
      audio: null,
      audioStarted: false,
      part: 0,
      attempt: 0,
    };
    current = job;
    const native = nativeTTS();
    if (native && runNative(job, native)) return true;
    if (runWeb(job)) return true;
    failOrFallback(job, 'unsupported', 'Speech is not available in this browser or WebView');
    return false;
  },
  speakSeq(items, options = {}) {
    const list = Array.isArray(items) ? items : [];
    const opts = options || {};
    if (!list.length || (!voiceEnabled && !list.some((item) => item?.force))) { try { opts.onEnd?.(); } catch {} return; }
    if (sequence) { sequence.cancelled = true; endSequence(sequence); }
    const seq = { index: 0, cancelled: false, ended: false, onEnd: opts.onEnd };
    sequence = seq;
    const next = () => {
      if (seq.cancelled || seq.ended) return;
      if (seq.index >= list.length) { endSequence(seq); return; }
      const index = seq.index;
      const item = list[index] || {};
      try { opts.onItem?.(index); } catch {}
      this.speak(item.text, item.teacher, {
        force: item.force,
        fallbackUrl: item.fallbackUrl,
        lang: item.lang,
        _sequence: seq,
        onEnd: () => {
          if (seq.cancelled || seq.ended) return;
          seq.index += 1;
          seq.timer = setTimeout(next, 240);
        },
      });
    };
    next();
  },
  stop() {
    if (sequence) { sequence.cancelled = true; endSequence(sequence); }
    blockedJob = null;
    if (current) stopJob(current);
    else {
      try { nativeTTS()?.stop?.(); } catch {}
      cancelEngine();
      this.speaking = false;
    }
  },
  diagnose() {
    const by = (key) => voices.filter((v) => languageKey(v.lang) === key && String(v.lang || '').toLowerCase().startsWith(key)).map((v) => ({
      name: v.name, lang: v.lang, default: !!v.default, localService: v.localService !== false,
    }));
    return { webSpeech, native: !!nativeTTS(), gestureSeen, lastError: tts.lastError, voicesByLang: { en: by('en'), ru: by('ru'), vi: by('vi') } };
  },
};
