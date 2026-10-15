// Natural neural voices (Piper TTS, MIT) running fully in the browser.
// The library and each voice model (~60 MB) are downloaded on first use and
// cached in the browser (OPFS). Until a voice is cached, speech uses the
// browser's built-in voice and the model downloads in the background.

const KEY = 'aet_voice_engine'; // 'piper' (default) | 'browser'

// Teacher id -> Piper voice for each language.
export const PIPER_VOICES = {
  emma:  { en: 'en_US-hfc_female-medium', ru: 'ru_RU-irina-medium' },   // Светлана
  james: { en: 'en_US-ryan-medium',       ru: 'ru_RU-dmitri-medium' },  // Дмитрий
  sofia: { en: 'en_US-amy-medium',        ru: 'ru_RU-irina-medium' },   // Ольга
  alex:  { en: 'en_US-hfc_male-medium',   ru: 'ru_RU-denis-medium' },   // Алексей
};

const root = typeof window !== 'undefined' ? window : null;
const storageOk = () => { try { return !!(root && root.localStorage); } catch { return false; } };
const opfsOk = () => !!(root && root.navigator && root.navigator.storage && typeof root.navigator.storage.getDirectory === 'function');
export const piperSupported = () => !!(root && typeof root.WebAssembly === 'object' && opfsOk() && typeof root.Worker === 'function');

export function piperEnabled() {
  if (!piperSupported()) return false;
  if (!storageOk()) return true;
  return root.localStorage.getItem(KEY) !== 'browser';
}
export function setPiperEnabled(on) {
  if (storageOk()) root.localStorage.setItem(KEY, on ? 'piper' : 'browser');
  emit();
}

export function voiceIdFor(teacher, lang) {
  const key = String(lang || 'en').toLowerCase().startsWith('ru') ? 'ru' : 'en';
  const map = PIPER_VOICES[teacher?.id] || (teacher?.gender === 'm' ? PIPER_VOICES.james : PIPER_VOICES.emma);
  return map[key];
}

let libPromise = null;
function lib() {
  if (!libPromise) libPromise = import('@mintplex-labs/piper-tts-web').catch((error) => { libPromise = null; throw error; });
  return libPromise;
}

const stored = new Set();
const downloading = new Map(); // voiceId -> { loaded, total, promise }
const listeners = new Set();
function emit() { listeners.forEach((fn) => { try { fn(); } catch {} }); }
export function onPiperChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

let storedChecked = null;
export function refreshStored() {
  if (!piperSupported()) return Promise.resolve(stored);
  storedChecked = lib()
    .then((m) => m.stored())
    .then((ids) => { stored.clear(); (ids || []).forEach((id) => stored.add(id)); emit(); return stored; })
    .catch(() => stored);
  return storedChecked;
}
export const isStored = (voiceId) => stored.has(voiceId);
export const downloadState = (voiceId) => downloading.get(voiceId) || null;

function slowNetwork() {
  const c = root?.navigator?.connection;
  return !!(c && (c.saveData || /(^|-)2g$|^3g$/.test(String(c.effectiveType || ''))));
}

export function downloadVoice(voiceId) {
  if (!voiceId || !piperSupported()) return Promise.resolve(false);
  if (stored.has(voiceId)) return Promise.resolve(true);
  if (downloading.has(voiceId)) return downloading.get(voiceId).promise;
  const state = { loaded: 0, total: 0, promise: null };
  downloading.set(voiceId, state);
  emit();
  state.promise = lib()
    .then((m) => m.download(voiceId, (p) => {
      if (p && p.total) { state.loaded = p.loaded; state.total = p.total; emit(); }
    }))
    .then(() => { stored.add(voiceId); return true; })
    .catch(() => false)
    .finally(() => { downloading.delete(voiceId); emit(); });
  return state.promise;
}

// Background download for the voice we just fell back from (not on metered/slow links).
export function prefetchVoice(voiceId) {
  if (!piperEnabled() || slowNetwork()) return;
  const start = () => { if (!stored.has(voiceId)) downloadVoice(voiceId); };
  if (storedChecked) storedChecked.then(start); else refreshStored().then(start);
}

export async function removeVoices() {
  try { const m = await lib(); await m.flush(); } catch {}
  sessions.clear();
  stored.clear();
  emit();
}

// One loaded session per voice (the library's own predict() keeps a single
// global session, which would mix up teachers). Keep at most two in memory.
const sessions = new Map();
function sessionFor(voiceId) {
  if (sessions.has(voiceId)) {
    const s = sessions.get(voiceId); sessions.delete(voiceId); sessions.set(voiceId, s); return s;
  }
  const promise = lib().then(async (m) => {
    const s = new m.TtsSession({ voiceId });
    if (s.waitReady && typeof s.waitReady.then === 'function') await s.waitReady;
    if (!s.ready) await s.init();
    return s;
  });
  promise.catch(() => sessions.delete(voiceId));
  sessions.set(voiceId, promise);
  while (sessions.size > 2) sessions.delete(sessions.keys().next().value);
  return promise;
}

// Returns a WAV Blob for the text (the voice must already be cached).
export async function synth(text, voiceId) {
  const session = await sessionFor(voiceId);
  return session.predict(text);
}

if (piperSupported()) {
  // Learn which voices are cached without blocking the first paint.
  const kick = () => { if (piperEnabled()) refreshStored(); };
  if (root.requestIdleCallback) root.requestIdleCallback(kick, { timeout: 4000 }); else setTimeout(kick, 1500);
}
