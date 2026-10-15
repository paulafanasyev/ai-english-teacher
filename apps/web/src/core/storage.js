// Safe storage: falls back to in-memory when localStorage is unavailable
// (e.g. sandboxed iframes with an opaque origin) or full (quota exceeded).
// A value that could not be persisted stays readable from memory for this session.
const mem = new Map();
let ls = null;
try {
  window.localStorage.setItem('__aet_test', '1');
  window.localStorage.removeItem('__aet_test');
  ls = window.localStorage;
} catch { ls = null; }

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = mem.has(key) ? mem.get(key) : ls ? ls.getItem(key) : null;
      return raw == null ? fallback : JSON.parse(raw);
    } catch { return fallback; }
  },
  // Returns true when the value was saved persistently.
  set(key, value) {
    let raw;
    try { raw = JSON.stringify(value); } catch { storage.lastError = 'serialize'; return false; }
    if (ls) {
      try { ls.setItem(key, raw); mem.delete(key); return true; } catch { storage.lastError = 'quota'; }
    }
    mem.set(key, raw);
    return false;
  },
  del(key) {
    mem.delete(key);
    try { ls?.removeItem(key); } catch { /* ignore */ }
  },
  persistent: !!ls,
  lastError: null,
};
