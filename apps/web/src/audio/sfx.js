// Synthesized UI sound effects — no files.
import { audioCtx, buses, tone, slideTone, noiseHit } from './engine.js';

let enabled = true;
export const setSfxEnabled = (v) => { enabled = v; };

function go(fn) {
  if (!enabled) return;
  try { const c = audioCtx(); fn(c.currentTime + 0.01, buses.sfx); } catch { /* audio unavailable */ }
}

export const sfx = {
  click: () => go((t, b) => tone({ t, dur: 0.035, freq: 660, type: 'square', gain: 0.03, attack: 0.002, release: 0.03, filterFreq: 2200, dest: b })),
  correct: () => go((t, b) => {
    tone({ t, dur: 0.09, freq: 523, type: 'sine', gain: 0.12, attack: 0.005, release: 0.08, dest: b });
    tone({ t: t + 0.09, dur: 0.14, freq: 784, type: 'sine', gain: 0.12, attack: 0.005, release: 0.12, dest: b });
    tone({ t: t + 0.16, dur: 0.18, freq: 1046, type: 'triangle', gain: 0.06, attack: 0.005, release: 0.2, dest: b });
  }),
  wrong: () => go((t, b) => {
    slideTone({ t, dur: 0.22, from: 220, to: 150, type: 'sawtooth', gain: 0.05, dest: b });
    tone({ t, dur: 0.2, freq: 110, type: 'sine', gain: 0.06, attack: 0.01, release: 0.1, filterFreq: 420, dest: b });
  }),
  levelUp: () => go((t, b) => {
    [523, 659, 784, 1046].forEach((f, i) => tone({ t: t + i * 0.085, dur: 0.16, freq: f, type: 'triangle', gain: 0.11, attack: 0.005, release: 0.15, dest: b }));
    [1046, 1318, 1568].forEach((f) => tone({ t: t + 0.36, dur: 0.5, freq: f, type: 'triangle', gain: 0.055, attack: 0.01, release: 0.5, dest: b }));
    noiseHit({ t: t + 0.36, dur: 0.25, gain: 0.02, filterFreq: 9000, dest: b });
  }),
  coin: () => go((t, b) => {
    tone({ t, dur: 0.05, freq: 1318, type: 'square', gain: 0.05, attack: 0.003, release: 0.04, dest: b });
    tone({ t: t + 0.05, dur: 0.14, freq: 1760, type: 'square', gain: 0.05, attack: 0.003, release: 0.14, dest: b });
  }),
  match: () => go((t, b) => slideTone({ t, dur: 0.12, from: 620, to: 930, type: 'sine', gain: 0.07, dest: b })),
  pop: () => go((t, b) => slideTone({ t, dur: 0.07, from: 320, to: 480, type: 'sine', gain: 0.05, dest: b })),
  shot: () => go((t, b) => {
    slideTone({ t, dur: 0.08, from: 900, to: 260, type: 'square', gain: 0.04, dest: b });
    noiseHit({ t, dur: 0.05, gain: 0.03, filterType: 'bandpass', filterFreq: 2600, q: 1.5, dest: b });
  }),
};
