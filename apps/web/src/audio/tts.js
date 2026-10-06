// Local teacher speech. Browser SpeechSynthesis is preferred; Capacitor's
// TextToSpeech plugin is used in native WebViews where SpeechSynthesis is absent.
import { speechBus } from './speechBus.js';

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
  vi: ['linh', 'an', 'hoaịmy', 'hoa my', 'hoaị', 'hoaithanh', 'hoaimy', 'google tiếng việt', 'female'],
};
const M_HINTS = {
  en: ['male', 'david', 'mark', 'daniel', 'guy', 'ryan', 'alex', 'fred', 'arthur', 'george', 'thomas', 'oliver', 'aaron', 'christopher'],
  ru: ['pavel', 'dmitry', 'male', 'муж', 'google русский'],
  vi: ['namminh', 'nam minh', 'hoàng', 'hoang', 'male', 'google tiếng việt'],
};
const voices = [];
function refreshVoices() {
  if (!synthesis || typeof synthesis.getVoices !== 'function') return;
  try {
    voices.splice(0, voices.length, ...synthesis.getVoices());
  } catch { /* some WebViews expose getVoices but throw */ }
}
refreshVoices();
if (synthesis) {
  const oldChanged = synthesis.onvoiceschanged;
  synthesis.onvoiceschanged = (...args) => {
    refreshVoices();
    if (typeof oldChanged === 'function') { try { oldChanged.apply(synthesis, args); } catch {} }
  };
}

const languageKey = (lang) => {
  const value = String(lang || 'en-US').toLowerCase();
  if (value === 'en' || value.startsWith('en-')) return 'en';
  if (value === 'ru' || value.startsWith('ru-')) return 'ru';
  if (value === 'vi' || value.startsWith('vi-')) return 'vi';
  return 'en';
};
const normalizeLang = (lang) => LANGS[languageKey(lang)] || 'en-US';

function pickVoice(lang, gender) {
  const key = languageKey(lang);
  const prefix = key + '-';
  const same = voices.filter((v) => String(v.lang || '').toLowerCase().startsWith(prefix));
  const candidates = same.length ? same : voices.filter((v) => String(v.lang || '').toLowerCase().startsWith(key));
  if (!candidates.length) return null;
  const wanted = (gender === 'm' ? M_HINTS : F_HINTS)[key] || [];
  const unwanted = (gender === 'm' ? F_HINTS : M_HINTS)[key] || [];
  let best = candidates[0], bestScore = -Infinity;
  candidates.forEach((voice) => {
    const name = String(voice.name || '').toLowerCase();
    const voiceLang = String(voice.lang || '').toLowerCase();
    let score = 0;
    wanted.forEach((hint) => { if (name.includes(hint)) score += 4; });
    unwanted.forEach((hint) => { if (name.includes(hint)) score -= 3; });
    if (voiceLang === normalizeLang(lang).toLowerCase()) score += 2;
    if (/natural|neural|online|premium|enhanced/.test(name)) score += 2;
    if (voice.default) score += 0.5;
    if (voice.localService === false) score += 0.75;
    if (score > bestScore) { best = voice; bestScore = score; }
  });
  return best;
}

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
    if (rest) chunks.push(rest);
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
  if ('fvvфв'.includes(ch)) return 'F';
  if ('lntdлнтдđ'.includes(ch)) return 'L';
  return 'E';
}

// Keep digraphs together: the Avatar should not show two O shapes for "book".
function visemeUnits(value) {
  const chars = [...String(value || '')];
  const units = [];
  for (let i = 0; i < chars.length; i += 1) {
    const rest = chars.slice(i).join('').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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

function now() { return typeof performance !== 'undefined' ? performance.now() : Date.now(); }
function clearTimers(job) {
  (job?.timers || []).forEach((timer) => clearTimeout(timer));
  if (job) job.timers.length = 0;
  if (job?.keepAlive) clearInterval(job.keepAlive);
}
function isCurrent(job) { return current === job && !job.ended; }
function emitViseme(job, v, t = now() - job.startedAt) {
  if (isCurrent(job)) speechBus.emit('viseme', { v, t, teacherId: job.teacherId });
}
function scheduleEstimated(job, text, rate, offset = 0, duration = 0, initialDelay = 100) {
  if (!isCurrent(job)) return;
  const letters = visemeUnits(text);
  if (!letters.length) return;
  const total = duration > 0 ? duration : (letters.length / (13 * Math.max(0.25, rate || 1))) * 1000;
  const step = total / letters.length;
  letters.forEach((letter, i) => {
    const timer = setTimeout(() => emitViseme(job, visemeFor(letter), offset + i * step), Math.max(0, initialDelay + i * step));
    job.timers.push(timer);
  });
}
function scheduleWordVisemes(job, word, startAt) {
  const letters = visemeUnits(word);
  letters.forEach((letter, i) => {
    const timer = setTimeout(() => emitViseme(job, visemeFor(letter), startAt + i * 45), i * 45);
    job.timers.push(timer);
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
  if (!isCurrent(job)) return;
  const error = { code: code || 'error', message: message || code || 'Speech failed' };
  tts.lastError = error;
  speechBus.emit('error', error);
}
function endJob(job) {
  if (!job || job.ended) return;
  job.ended = true;
  clearTimers(job);
  if (current === job) current = null;
  if (tts.speaking) tts.speaking = false;
  speechBus.emit('viseme', { v: 'rest', t: now() - (job.startedAt || now()), teacherId: job.teacherId });
  speechBus.emit('end', { teacherId: job.teacherId });
  try { job.onEnd?.(); } catch { /* caller callback must not break cleanup */ }
}
function endSequence(seq) {
  if (!seq || seq.ended) return;
  seq.ended = true;
  if (sequence === seq) sequence = null;
  try { seq.onEnd?.(); } catch {}
}
function stopJob(job) {
  if (!job) return;
  clearTimers(job);
  try { job.audio?.pause?.(); } catch {}
  if (synthesis) { try { synthesis.cancel(); } catch {} }
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
    scheduleEstimated(job, job.text, job.rate, 0, duration, 0);
    begin(job);
    const result = audio.play?.();
    if (result && typeof result.catch === 'function') result.catch((error) => { reportError(job, 'playback', error?.message || 'Audio playback failed'); endJob(job); });
  };
  audio.preload = 'auto';
  audio.onloadedmetadata = startAudio;
  audio.oncanplay = () => startAudio();
  audio.onended = () => endJob(job);
  audio.onerror = () => { reportError(job, 'playback', 'Fallback audio could not be loaded'); endJob(job); };
  // Some browsers have metadata synchronously for a cached data URL.
  if (audio.readyState >= 1) startAudio();
  return true;
}

function failOrFallback(job, code, message) {
  if (!isCurrent(job)) return;
  reportError(job, code, message);
  clearTimers(job);
  if (fallbackAudio(job)) return;
  endJob(job);
}
function runWeb(job) {
  if (!webSpeech || !isCurrent(job)) return false;
  const parts = chunksFor(job.text);
  let partIndex = 0;
  let wordIndex = 0;
  let boundarySeen = false;
  const next = () => {
    if (!isCurrent(job)) return;
    if (partIndex >= parts.length) { endJob(job); return; }
    const part = parts[partIndex++];
    boundarySeen = false;
    let utterance;
    try { utterance = new root.SpeechSynthesisUtterance(part); } catch (error) { failOrFallback(job, 'unsupported', error?.message || 'Speech utterance unavailable'); return; }
    utterance.lang = job.lang;
    utterance.voice = pickVoice(job.lang, job.gender) || null;
    utterance.pitch = job.pitch;
    utterance.rate = job.rate;
    utterance.volume = 1;
    utterance.onstart = () => {
      begin(job);
      // A few engines never dispatch boundary events. Wait briefly for a
      // boundary before committing to the timer-based mouth animation.
      const timer = setTimeout(() => { if (!boundarySeen) scheduleEstimated(job, part, job.rate); }, 100);
      job.timers.push(timer);
    };
    utterance.onboundary = (event) => {
      if (!isCurrent(job)) return;
      boundarySeen = true;
      const charIndex = Number.isFinite(event.charIndex) ? event.charIndex : 0;
      const found = wordAt(part, charIndex);
      speechBus.emit('word', { index: wordIndex++, charIndex });
      scheduleWordVisemes(job, found.word, now() - job.startedAt);
    };
    utterance.onend = () => { if (isCurrent(job)) setTimeout(next, 0); };
    utterance.onerror = (event) => {
      if (!isCurrent(job)) return;
      const code = codeFromError(event);
      if (code === 'cancelled') endJob(job);
      else failOrFallback(job, code, event?.message || 'Speech synthesis failed');
    };
    try { synthesis.speak(utterance); } catch (error) { failOrFallback(job, 'error', error?.message || 'Speech synthesis failed'); }
  };
  begin(job);
  job.keepAlive = setInterval(() => { if (isCurrent(job)) { try { synthesis.resume?.(); } catch {} } }, 10000);
  next();
  return true;
}
function runNative(job, plugin) {
  if (!plugin || typeof plugin.speak !== 'function' || !isCurrent(job)) return false;
  begin(job);
  scheduleEstimated(job, job.text, job.rate, 0, 0, 0);
  try {
    Promise.resolve(plugin.speak({ text: job.text, lang: job.lang, rate: job.rate, pitch: job.pitch, volume: 1 }))
      .then(() => { if (isCurrent(job)) endJob(job); })
      .catch((error) => {
        if (!isCurrent(job)) return;
        // If a native bridge is present but unusable, a browser engine may
        // still work (useful in iOS shells and test harnesses).
        if (webSpeech) { clearTimers(job); runWeb(job); }
        else failOrFallback(job, codeFromError(error), error?.message || 'Native speech failed');
      });
    return true;
  } catch (error) { failOrFallback(job, codeFromError(error), error?.message || 'Native speech failed'); return true; }
}

let unlockInstalled = false;
function installUnlock() {
  if (!root || unlockInstalled) return;
  unlockInstalled = true;
  const handler = () => { tts.unlock(); };
  try {
    root.addEventListener('pointerdown', handler, { once: true, passive: true });
    root.addEventListener('keydown', handler, { once: true, passive: true });
  } catch { /* old WebViews may not support event options */ }
}
installUnlock();

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
      const old = synthesis.onvoiceschanged;
      synthesis.onvoiceschanged = (...args) => {
        refreshVoices();
        if (typeof old === 'function') { try { old.apply(synthesis, args); } catch {} }
        finish();
      };
      setTimeout(finish, 1500);
    });
  },
  unlock() {
    if (nativeTTS()) return true;
    if (!webSpeech) return false;
    try {
      synthesis.resume?.();
      const u = new root.SpeechSynthesisUtterance('\u200b');
      u.volume = 0; u.rate = 10; u.onend = () => {};
      synthesis.speak(u);
      return true;
    } catch (error) {
      this.lastError = { code: 'unlock', message: error?.message || 'Speech unlock failed' };
      return false;
    }
  },
  speak(text, teacher, options = {}) {
    const opts = options || {};
    const source = String(text || '').trim();
    if (!source || (!voiceEnabled && !opts.force)) { try { opts.onEnd?.(); } catch {} return false; }
    if (sequence && sequence !== opts._sequence) { sequence.cancelled = true; endSequence(sequence); }
    if (current) stopJob(current);
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
      const ok = this.speak(item.text, item.teacher, {
        force: item.force,
        fallbackUrl: item.fallbackUrl,
        lang: item.lang,
        _sequence: seq,
        onEnd: () => {
          if (seq.cancelled || seq.ended) return;
          seq.index += 1;
          const timer = setTimeout(next, 240);
          seq.timer = timer;
        },
      });
    };
    next();
  },
  stop() {
    if (sequence) { sequence.cancelled = true; if (sequence.timer) clearTimeout(sequence.timer); endSequence(sequence); }
    if (current) stopJob(current);
    else {
      try { nativeTTS()?.stop?.(); } catch {}
      if (synthesis) { try { synthesis.cancel(); } catch {} }
      this.speaking = false;
    }
  },
  diagnose() {
    const by = (key) => voices.filter((v) => languageKey(v.lang) === key).map((v) => ({
      name: v.name, lang: v.lang, default: !!v.default, localService: v.localService !== false,
    }));
    return { webSpeech, native: !!nativeTTS(), voicesByLang: { en: by('en'), ru: by('ru'), vi: by('vi') } };
  },
};
