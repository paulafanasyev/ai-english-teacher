// A deliberately small, dependency-free event bus for speech/Avatar sync.
const listeners = new Map();

export const speechBus = {
  on(event, fn) {
    if (typeof fn !== 'function') return () => {};
    let set = listeners.get(event);
    if (!set) { set = new Set(); listeners.set(event, set); }
    set.add(fn);
    return () => { set.delete(fn); if (!set.size) listeners.delete(event); };
  },
  emit(event, payload) {
    const set = listeners.get(event);
    if (!set) return;
    // Copy first: an observer may unsubscribe itself while handling an event.
    [...set].forEach((fn) => { try { fn(payload); } catch { /* observers are isolated */ } });
  },
};
