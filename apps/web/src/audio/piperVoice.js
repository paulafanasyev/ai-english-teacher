// Natural neural voices (Piper TTS, @mintplex-labs/piper-tts-web) running in the browser.
// Each voice model (~63 MB) is downloaded once and cached in the browser (OPFS).
// Until a voice is cached the regular browser voice speaks.
//
// Only voices with a clear commercial-friendly license are used (see MODEL_CARD on
// huggingface.co/rhasspy/piper-voices). There is no cleanly licensed female Russian
// Piper voice, so Светлана and Ольга speak Russian with the browser voice.

const KEY = 'aet_voice_engine';       // 'piper' (default) | 'browser'
const STORED_KEY = 'aet_piper_stored'; // JSON array of voice ids verified in OPFS

// Teacher id -> Piper voice per language (null = use the browser voice).
export const PIPER_VOICES = {
  emma:  { en: 'en_US-kristin-medium', ru: null },                    // Светлана · public domain
  james: { en: 'en_US-joe-medium',     ru: 'ru_RU-dmitri-medium' },    // Дмитрий · CC0 / CC0
  sofia: { en: 'en_GB-cori-medium',    ru: null },                     // Ольга · public domain
  alex:  { en: 'en_GB-northern_english_male-medium', ru: 'ru_RU-denis-medium' }, // Алексей · CC BY-SA 4.0 / CC0
};
export const VOICE_CREDITS = {
  'en_US-kristin-medium': 'Kristin (LibriVox), public domain',
  'en_US-joe-medium': 'Joe, CC0',
  'en_GB-cori-medium': 'Cori (LibriVox), public domain',
  'en_GB-northern_english_male-medium': 'Northern English Male, CC BY-SA 4.0',
  'ru_RU-dmitri-medium': 'Dmitri, CC0',
  'ru_RU-denis-medium': 'Denis, CC0',
};

const root = typeof window !== 'undefined' ? window : null;
const ls = {
  get(key) { try { return root?.localStorage?.getItem(key) ?? null; } catch { return null; } },
  set(key, value) { try { root?.localStorage?.setItem(key, value); } catch {} },
  del(key) { try { root?.localStorage?.removeItem(key); } catch {} },
};

export const piperSupported = () => !!(
  root && root.isSecureContext !== false && typeof root.WebAssembly === 'object' && typeof root.Worker === 'function'
  && typeof root.navigator?.storage?.getDirectory === 'function'
);
let noCache = false; // this session could not persist a model (e.g. iOS WebView size limit)
let removing = null; // promise while "delete all" runs
export function piperEnabled() { return piperSupported() && ls.get(KEY) !== 'browser'; }
export function setPiperEnabled(on) { ls.set(KEY, on ? 'piper' : 'browser'); emit(); }

// Which language the text really is: the app sometimes says Russian explanations with lang 'en-US'.
export function textLang(text, requested) {
  const cyr = (String(text).match(/[\u0400-\u04FF]/g) || []).length;
  const lat = (String(text).match(/[A-Za-z]/g) || []).length;
  if (cyr > lat) return 'ru';
  if (lat > cyr * 3) return 'en';
  return String(requested || 'en').toLowerCase().startsWith('ru') ? 'ru' : 'en';
}
export function voiceIdFor(teacher, lang) {
  const key = String(lang || 'en').toLowerCase().startsWith('ru') ? 'ru' : 'en';
  const map = PIPER_VOICES[teacher?.id] || (teacher?.gender === 'm' ? PIPER_VOICES.james : PIPER_VOICES.emma);
  return map[key] || null;
}

// The library (and onnxruntime) is only loaded when a natural voice is actually used.
let libPromise = null;
function lib() {
  if (!libPromise) libPromise = import('@mintplex-labs/piper-tts-web').catch((error) => { libPromise = null; throw error; });
  return libPromise;
}

const stored = new Set((() => { try { return JSON.parse(ls.get(STORED_KEY) || '[]'); } catch { return []; } })());
const saveStored = () => ls.set(STORED_KEY, JSON.stringify([...stored]));
const downloading = new Map(); // voiceId -> { loaded, total }
const failed = new Map();      // voiceId -> 'network' | 'nocache'
const listeners = new Set();
function emit() { listeners.forEach((fn) => { try { fn(); } catch {} }); }
export function onPiperChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export const isStored = (voiceId) => !!voiceId && stored.has(voiceId);
export const hasAnyStored = () => stored.size > 0;
export const downloadState = (voiceId) => downloading.get(voiceId) || null;
export const downloadError = (voiceId) => failed.get(voiceId) || null;
export function forgetVoice(voiceId) { if (stored.delete(voiceId)) { saveStored(); emit(); } }

const pending = new Map(); // voiceId -> promise
export function downloadVoice(voiceId) {
  if (!voiceId || !piperSupported()) return Promise.resolve(false);
  if (removing) return removing.then(() => downloadVoice(voiceId));
  if (stored.has(voiceId)) return Promise.resolve(true);
  if (pending.has(voiceId)) return pending.get(voiceId);
  const state = { loaded: 0, total: 0 };
  downloading.set(voiceId, state);
  failed.delete(voiceId);
  emit();
  const promise = lib()
    .then(async (m) => {
      await m.download(voiceId, (p) => { if (p) { state.loaded = p.loaded || 0; state.total = p.total || 0; emit(); } });
      // The library swallows OPFS write errors (e.g. iOS WebView file-size limits): verify.
      const ids = await m.stored();
      if (!(ids || []).includes(voiceId)) {
        noCache = true;
        failed.set(voiceId, 'nocache');
        return false;
      }
      stored.add(voiceId); saveStored();
      return true;
    })
    .catch(() => { failed.set(voiceId, 'network'); return false; })
    .finally(() => { downloading.delete(voiceId); pending.delete(voiceId); emit(); });
  pending.set(voiceId, promise);
  return promise;
}

// Background download only on unmetered connections; elsewhere the user taps "Download" in Settings.
function unmetered() {
  const c = root?.navigator?.connection;
  if (c) {
    if (c.saveData) return false;
    if (c.type) return c.type === 'wifi' || c.type === 'ethernet';
    return false;
  }
  return !/Android|iPhone|iPad|iPod|Mobile/i.test(root?.navigator?.userAgent || '');
}
export function prefetchVoice(voiceId) {
  if (!voiceId || noCache || removing || !piperEnabled() || stored.has(voiceId) || pending.has(voiceId) || failed.has(voiceId) || !unmetered()) return;
  downloadVoice(voiceId);
}

// TtsSession in the library is a singleton: one voice is loaded at a time and inference
// is serialized, so switching voices replaces the session instead of mixing them up.
let active = null; // { voiceId, ready: Promise<session> }
let queue = Promise.resolve();
export const isWarm = (voiceId) => !!active && active.voiceId === voiceId && active.loaded;
function sessionFor(m, voiceId) {
  if (active && active.voiceId === voiceId) return active.ready;
  m.TtsSession._instance = null;
  const entry = { voiceId, loaded: false, ready: null };
  entry.ready = (async () => {
    const s = new m.TtsSession({ voiceId });
    await s.waitReady;
    entry.loaded = true;
    return s;
  })();
  entry.ready.catch(() => { if (active === entry) active = null; });
  active = entry;
  return entry.ready;
}

// Returns a WAV Blob, or null when the request became stale before its turn.
// onTurn fires when this request actually reaches the (serialized) engine.
export function synth(text, voiceId, isStale = () => false, onTurn = null) {
  const run = queue.then(async () => {
    if (isStale()) return null;
    try { onTurn?.(); } catch {}
    const m = await lib();
    if (!isWarm(voiceId)) {
      // The browser may have evicted the model: never let playback silently re-download 63 MB.
      const ids = await m.stored();
      if (!(ids || []).includes(voiceId)) { forgetVoice(voiceId); throw new Error('not-cached'); }
    }
    const session = await sessionFor(m, voiceId);
    if (isStale()) return null;
    return session.predict(text);
  });
  queue = run.catch(() => {});
  return run;
}

export function removeVoices() {
  if (removing) return removing;
  removing = (async () => {
    try {
      await Promise.all([...pending.values()]);
      const m = await lib();
      await queue;
      m.TtsSession._instance = null;
      await m.flush();
    } catch {}
    active = null;
    stored.clear(); saveStored();
    failed.clear();
  })().finally(() => { removing = null; emit(); });
  emit();
  return removing;
}
