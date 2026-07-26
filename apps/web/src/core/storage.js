// Safe storage: falls back to in-memory when localStorage is unavailable
// (e.g. sandboxed iframes with an opaque origin).
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
      const raw = ls ? ls.getItem(key) : mem.get(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch { return fallback; }
  },
  set(key, value) {
    const raw = JSON.stringify(value);
    try { ls ? ls.setItem(key, raw) : mem.set(key, raw); } catch { mem.set(key, raw); }
  },
  del(key) {
    try { ls ? ls.removeItem(key) : mem.delete(key); } catch { mem.delete(key); }
  },
  persistent: !!ls,
};
