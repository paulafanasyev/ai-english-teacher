// Shared WebAudio context + buses. Everything is synthesized in the browser —
// no audio files, no API keys.
let ctx = null, master = null, musicBus = null, sfxBus = null;

export function audioCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.2; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.5; sfxBus.connect(master);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
export const buses = { get music() { audioCtx(); return musicBus; }, get sfx() { audioCtx(); return sfxBus; } };

export const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

let noiseBuf = null;
export function noiseBuffer() {
  const c = audioCtx();
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

export function tone({ t, dur, freq, type = 'sine', gain = 0.1, attack = 0.01, release = 0.12, detune = 0, filterFreq = 0, dest }) {
  const c = audioCtx();
  const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t); o.detune.value = detune;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.setValueAtTime(gain, Math.max(t + attack, t + dur - 0.02));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + release);
  let head = o;
  if (filterFreq) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filterFreq; o.connect(f); head = f; }
  head.connect(g); g.connect(dest);
  o.start(t); o.stop(t + dur + release + 0.05);
}

export function slideTone({ t, dur, from, to, type = 'sine', gain = 0.2, dest }) {
  const c = audioCtx();
  const o = c.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(from, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest);
  o.start(t); o.stop(t + dur + 0.05);
}

export function noiseHit({ t, dur, gain = 0.1, filterType = 'highpass', filterFreq = 6000, q = 0.7, dest }) {
  const c = audioCtx();
  const src = c.createBufferSource(); src.buffer = noiseBuffer(); src.loop = true;
  const f = c.createBiquadFilter(); f.type = filterType; f.frequency.value = filterFreq; f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(dest);
  src.start(t); src.stop(t + dur + 0.05);
}
