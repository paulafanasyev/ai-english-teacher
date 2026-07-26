// Teacher speech — browser SpeechSynthesis with a per-teacher voice profile.
// Works offline, no API keys. Each teacher gets a distinct pitch/rate and a
// preferred male/female system voice.
const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

// Нативный TTS (Capacitor) через рантайм-мост, если плагин установлен; иначе null.
// В нативном WebView SpeechSynthesis обычно работает, но плагин надёжнее на устройстве.
function nativeTTS() {
  const c = typeof window !== 'undefined' ? window.Capacitor : null;
  if (c && typeof c.isNativePlatform === 'function' && c.isNativePlatform()
      && c.Plugins && c.Plugins.TextToSpeech) return c.Plugins.TextToSpeech;
  return null;
}

let voices = [];
const refresh = () => { voices = supported ? window.speechSynthesis.getVoices() : []; };
if (supported) { refresh(); window.speechSynthesis.onvoiceschanged = refresh; }

const F_HINTS = ['female', 'samantha', 'aria', 'jenny', 'zira', 'victoria', 'karen', 'moira', 'tessa', 'sonia', 'libby', 'ava', 'allison', 'susan', 'google us english'];
const M_HINTS = ['male', 'david', 'mark', 'daniel', 'guy', 'ryan', 'alex', 'fred', 'arthur', 'george', 'thomas', 'oliver', 'aaron', 'christopher'];

function pickVoice(gender) {
  const en = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
  if (!en.length) return null;
  const hints = gender === 'm' ? M_HINTS : F_HINTS;
  const anti = gender === 'm' ? F_HINTS : M_HINTS;
  let best = null, bestScore = -99;
  for (const v of en) {
    const n = v.name.toLowerCase();
    let score = 0;
    if (hints.some((h) => n.includes(h))) score += 3;
    if (anti.some((h) => n.includes(h))) score -= 3;
    if (v.lang.toLowerCase() === 'en-us') score += 1.5;
    if (n.includes('natural') || n.includes('neural') || n.includes('online')) score += 1;
    if (v.default) score += 0.5;
    if (score > bestScore) { bestScore = score; best = v; }
  }
  return best;
}

let voiceEnabled = true;
export const setVoiceEnabled = (v) => { voiceEnabled = v; if (!v) tts.stop(); };

export const tts = {
  supported,
  speaking: false,
  speak(text, teacher, { onStart, onEnd, force = false } = {}) {
    if (!text || (!voiceEnabled && !force)) { onEnd?.(); return false; }
    const nat = nativeTTS();
    if (nat) {
      try {
        this.speaking = true; onStart?.();
        nat.speak({ text, lang: 'en-US', rate: teacher?.voice?.rate ?? 1, pitch: teacher?.voice?.pitch ?? 1, volume: 1 })
          .then(() => { this.speaking = false; onEnd?.(); })
          .catch(() => { this.speaking = false; onEnd?.(); });
        return true;
      } catch { /* fall back to Web Speech ниже */ }
    }
    if (!supported) { onEnd?.(); return false; }
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      const v = pickVoice(teacher?.gender || 'f');
      if (v) u.voice = v;
      u.pitch = teacher?.voice?.pitch ?? 1;
      u.rate = teacher?.voice?.rate ?? 1;
      u.onstart = () => { this.speaking = true; onStart?.(); };
      const end = () => { this.speaking = false; onEnd?.(); };
      u.onend = end; u.onerror = end;
      window.speechSynthesis.speak(u);
      return true;
    } catch { onEnd?.(); return false; }
  },
  // Speak a sequence (e.g. a dialogue with two speakers using different profiles)
  speakSeq(items, { onItem, onEnd } = {}) {
    if ((!supported && !nativeTTS()) || !voiceEnabled || !items.length) { onEnd?.(); return; }
    let i = 0;
    const next = () => {
      if (i >= items.length) { onEnd?.(); return; }
      const item = items[i];
      onItem?.(i);
      const ok = this.speak(item.text, item.teacher, { onEnd: () => { i++; setTimeout(next, 240); }, force: item.force });
      if (!ok) { i++; setTimeout(next, 200); }
    };
    next();
  },
  stop() {
    const nat = nativeTTS();
    try { nat && nat.stop && nat.stop(); } catch {}
    if (supported) { try { window.speechSynthesis.cancel(); } catch {} }
    this.speaking = false;
  },
};
