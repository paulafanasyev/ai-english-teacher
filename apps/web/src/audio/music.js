// Generative background music engine — composes endless music in real time
// in 4 styles. Pure WebAudio synthesis, zero audio files.
import { audioCtx, buses, mtof, tone, slideTone, noiseHit } from './engine.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const STYLES = {
  lofi: {
    bpm: 74,
    prog: [[65, 69, 72, 76], [64, 67, 71, 74], [62, 65, 69, 72], [60, 64, 67, 71]], // Fmaj7 Em7 Dm7 Cmaj7
    step(s, t, spb, bus) {
      const bar = Math.floor(s / 16), st = s % 16;
      const chord = this.prog[bar % this.prog.length];
      const swing = st % 4 === 2 ? spb * 0.09 : 0;
      if (st === 0 || st === 8) {
        slideTone({ t, dur: 0.12, from: 110, to: 45, gain: 0.2, dest: bus });
        chord.forEach((m, i) => tone({ t: t + 0.01 * i, dur: spb * 1.7, freq: mtof(m), type: 'triangle', gain: st === 0 ? 0.045 : 0.03, attack: 0.03, release: 0.4, filterFreq: 1600, dest: bus }));
        tone({ t, dur: spb * 1.9, freq: mtof(chord[0] - 24), type: 'sine', gain: 0.11, attack: 0.02, release: 0.3, dest: bus });
      }
      if (st === 4 || st === 12) noiseHit({ t, dur: 0.09, gain: 0.05, filterType: 'bandpass', filterFreq: 1900, q: 1.2, dest: bus });
      if (st % 4 === 2) noiseHit({ t: t + swing, dur: 0.03, gain: 0.03, filterFreq: 7500, dest: bus });
      if ([0, 3, 6, 8, 11, 14].includes(st) && Math.random() < 0.42) {
        const scale = [0, 2, 4, 7, 9];
        tone({ t, dur: spb * 0.6, freq: mtof(chord[0] + 12 + pick(scale)), type: 'triangle', gain: 0.05, attack: 0.02, release: 0.25, filterFreq: 1400, detune: rnd(-6, 6), dest: bus });
      }
      if (Math.random() < 0.3) noiseHit({ t: t + rnd(0, spb / 4), dur: 0.02, gain: 0.008, filterType: 'lowpass', filterFreq: 3200, dest: bus }); // vinyl dust
    },
  },
  classical: {
    bpm: 92,
    prog: [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]], // C G Am F
    mel: 72,
    step(s, t, spb, bus) {
      const bar = Math.floor(s / 16), st = s % 16;
      const chord = this.prog[bar % this.prog.length];
      if (st % 2 === 0) { // alberti bass, 8ths
        const pat = [0, 2, 1, 2];
        const n = chord[pat[(st / 2) % 4]] - 12;
        tone({ t, dur: spb * 0.42, freq: mtof(n), type: 'triangle', gain: 0.055, attack: 0.008, release: 0.12, filterFreq: 2400, dest: bus });
      }
      if (st % 4 === 0) { // melody, quarter notes — gentle random walk on C major
        const scale = [0, 2, 4, 5, 7, 9, 11];
        this.mel += pick([-2, -1, -1, 1, 1, 2, 0]);
        if (this.mel < 67) this.mel = 72; if (this.mel > 84) this.mel = 76;
        const snapped = this.mel - ((this.mel % 12) === 1 || (this.mel % 12) === 3 || (this.mel % 12) === 6 || (this.mel % 12) === 8 || (this.mel % 12) === 10 ? 1 : 0);
        if (Math.random() < 0.85) tone({ t, dur: spb * 0.92, freq: mtof(snapped), type: 'sine', gain: 0.07, attack: 0.015, release: 0.2, dest: bus });
      }
      if (st === 0) chord.forEach((m) => tone({ t, dur: spb * 3.6, freq: mtof(m), type: 'sawtooth', gain: 0.012, attack: 0.4, release: 0.6, filterFreq: 850, detune: rnd(-7, 7), dest: bus }));
    },
  },
  electronic: {
    bpm: 112,
    prog: [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]], // Am F C G
    step(s, t, spb, bus) {
      const bar = Math.floor(s / 16), st = s % 16;
      const chord = this.prog[bar % this.prog.length];
      if (st % 4 === 0) slideTone({ t, dur: 0.11, from: 160, to: 44, gain: 0.24, dest: bus });
      if (st % 4 === 2) noiseHit({ t, dur: 0.04, gain: 0.04, filterFreq: 8000, dest: bus });
      if (st % 2 === 1 && Math.random() < 0.35) noiseHit({ t, dur: 0.02, gain: 0.015, filterFreq: 9000, dest: bus });
      if (st % 2 === 0) tone({ t, dur: spb * 0.22, freq: mtof(chord[0] - 24), type: 'sawtooth', gain: 0.1, attack: 0.005, release: 0.06, filterFreq: 320, dest: bus });
      const arpPat = [0, 1, 2, 1];
      const wob = 700 + 520 * Math.sin(s * 0.42);
      tone({ t, dur: spb * 0.18, freq: mtof(chord[arpPat[st % 4]] + 12), type: 'sawtooth', gain: 0.038, attack: 0.004, release: 0.07, filterFreq: wob, dest: bus });
      if (st === 0) chord.forEach((m) => tone({ t, dur: spb * 3.5, freq: mtof(m + 12), type: 'triangle', gain: 0.015, attack: 0.6, release: 0.8, filterFreq: 1200, detune: rnd(-5, 5), dest: bus }));
    },
  },
  ambient: {
    bpm: 60,
    prog: [[48, 60, 64, 67, 71], [41, 57, 60, 65, 72], [45, 57, 64, 67, 71], [43, 55, 62, 67, 74]],
    step(s, t, spb, bus) {
      const bar = Math.floor(s / 16), st = s % 16;
      if (st === 0 && bar % 2 === 0) {
        const chord = this.prog[(bar / 2) % this.prog.length];
        chord.forEach((m) => {
          tone({ t, dur: spb * 7, freq: mtof(m), type: 'sine', gain: 0.028, attack: 1.6, release: 2.2, dest: bus });
          tone({ t, dur: spb * 7, freq: mtof(m), type: 'triangle', gain: 0.012, attack: 2.0, release: 2.4, detune: rnd(4, 9), filterFreq: 900, dest: bus });
        });
        noiseHit({ t, dur: spb * 6, gain: 0.006, filterType: 'lowpass', filterFreq: 420, dest: bus });
      }
      if (Math.random() < 0.09) {
        const penta = [0, 2, 4, 7, 9];
        tone({ t: t + rnd(0, spb / 4), dur: 0.5, freq: mtof(84 + pick(penta)), type: 'sine', gain: 0.028, attack: 0.01, release: 0.9, dest: bus });
      }
    },
  },
};

let playing = false, styleId = 'lofi', step = 0, nextT = 0, timer = null;

function loop() {
  const c = audioCtx();
  const style = STYLES[styleId];
  const spb = 60 / style.bpm;
  const stepLen = spb / 4;
  if (c.currentTime > nextT + 0.5) nextT = c.currentTime + 0.05; // resync after suspended ctx resumes
  while (nextT < c.currentTime + 0.3) {
    style.step(step, Math.max(nextT, c.currentTime + 0.02), spb, buses.music);
    nextT += stepLen;
    step++;
  }
}

export const music = {
  styles: Object.keys(STYLES),
  get playing() { return playing; },
  get style() { return styleId; },
  start(id) {
    if (id) styleId = id;
    const c = audioCtx();
    if (playing) return;
    playing = true; step = 0; nextT = c.currentTime + 0.06;
    timer = setInterval(loop, 60);
    loop();
  },
  stop() { playing = false; if (timer) clearInterval(timer); timer = null; },
  setStyle(id) {
    if (!STYLES[id]) return;
    const was = playing;
    this.stop(); styleId = id;
    if (was) this.start();
  },
  setVolume(v) { buses.music.gain.value = Math.pow(Math.max(0, Math.min(1, v)), 1.6) * 0.5; },
};
