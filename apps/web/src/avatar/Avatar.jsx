import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { speechBus } from '../audio/speechBus.js';
import { faceFor } from './faces.js';
import {
  FRAME_CLS,
  emotionMouth,
  getVisemeShape,
  interpolateViseme,
  mouthPathsFromShape,
  renderAvatarSVG,
} from './svg.js';

function setMouth(root, shape, viseme) {
  if (!root) return;
  const mouth = root.querySelector('#avatar-mouth');
  if (!mouth) return;
  const paths = mouthPathsFromShape(shape);
  const set = (name, value) => mouth.querySelector(name)?.setAttribute('d', value);
  set('#avatar-mouth-outer', paths.outer);
  set('#avatar-mouth-inner', paths.inner);
  set('#avatar-mouth-teeth', paths.toothTop);
  set('#avatar-mouth-tongue', paths.tonguePath);
  const highlight = mouth.querySelector('#avatar-mouth-highlight');
  if (highlight) highlight.setAttribute('d', `M ${Math.max(140, shape.left + 8).toFixed(1)} ${(shape.top + 4).toFixed(1)} Q160 ${(shape.top + 1).toFixed(1)} ${Math.min(180, shape.right - 8).toFixed(1)} ${(shape.top + 4).toFixed(1)}`);
  mouth.querySelector('#avatar-mouth-inner')?.setAttribute('opacity', String(paths.innerOpacity));
  mouth.querySelector('#avatar-mouth-teeth')?.setAttribute('opacity', String(paths.teethOpacity));
  mouth.querySelector('#avatar-mouth-tongue')?.setAttribute('opacity', String(paths.tongueOpacity));
  mouth.setAttribute('data-viseme', viseme || 'rest');
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!media) return undefined;
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);
  return reduced;
}

export default function Avatar({ teacher, emotion = 'neutral', talking = false, frame = 'none', className = '', rounded = 'rounded-[26%]' }) {
  const rootRef = useRef(null);
  const instanceId = useId();
  const stateRef = useRef({ current: getVisemeShape('rest'), target: getVisemeShape('rest') });
  const face = useMemo(() => faceFor(teacher?.id), [teacher?.id]);
  const reducedMotion = useReducedMotion();
  const svg = useMemo(() => renderAvatarSVG(face, { emotion, viseme: talking ? 'rest' : emotionMouth(emotion), instanceId }), [face, emotion, talking]);

  // Keep natural blinking and tiny pupil saccades independent of React renders.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    let alive = true;
    let blinkTimer;
    let blinkClose;
    let saccadeTimer;
    const eyes = [root.querySelector('#avatar-eye-left'), root.querySelector('#avatar-eye-right')].filter(Boolean);
    const gazes = [root.querySelector('#avatar-gaze-left'), root.querySelector('#avatar-gaze-right')].filter(Boolean);
    const blink = () => {
      if (!alive) return;
      eyes.forEach((eye) => eye.setAttribute('transform', 'scale(1 .08)'));
      blinkClose = window.setTimeout(() => {
        eyes.forEach((eye) => eye.setAttribute('transform', 'scale(1 1)'));
        // A double blink is occasional, not a distracting loop.
        if (Math.random() < 0.16) window.setTimeout(() => {
          eyes.forEach((eye) => eye.setAttribute('transform', 'scale(1 .08)'));
          window.setTimeout(() => eyes.forEach((item) => item.setAttribute('transform', 'scale(1 1)')), 72);
        }, 120);
      }, 92);
      blinkTimer = window.setTimeout(blink, 2000 + Math.random() * 4000);
    };
    const saccade = () => {
      if (!alive) return;
      const x = (Math.random() * 2 - 1) * 2.2;
      const y = (Math.random() * 2 - 1) * 1.4;
      gazes.forEach((gaze) => gaze.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})`));
      saccadeTimer = window.setTimeout(saccade, 800 + Math.random() * 1400);
    };
    blinkTimer = window.setTimeout(blink, 1800 + Math.random() * 2600);
    if (!reducedMotion) saccadeTimer = window.setTimeout(saccade, 900 + Math.random() * 1000);
    return () => {
      alive = false;
      window.clearTimeout(blinkTimer); window.clearTimeout(blinkClose); window.clearTimeout(saccadeTimer);
    };
  }, [reducedMotion, svg]);

  // Subscribe only while speaking. The same loop handles real visemes and a
  // soft procedural fallback if a TTS provider has not supplied one recently.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const state = stateRef.current;
    const initial = talking ? getVisemeShape('rest') : getVisemeShape(emotionMouth(emotion));
    state.current = initial; state.target = initial;
    setMouth(root, initial, talking ? 'rest' : emotionMouth(emotion));
    if (!talking) return undefined;

    let alive = true;
    let raf = 0;
    let previous = performance.now();
    let lastEvent = performance.now();
    let nextBabble = lastEvent + 250;
    const babble = ['A', 'E', 'I', 'O', 'U', 'M', 'F', 'L', 'W'];
    const ownEvent = (payload) => !payload?.teacherId || payload.teacherId === face.id;
    const onViseme = (payload = {}) => {
      if (!ownEvent(payload)) return;
      const v = payload.v || 'rest';
      state.target = getVisemeShape(v);
      state.lastViseme = v;
      lastEvent = performance.now();
    };
    const onStart = (payload = {}) => { if (ownEvent(payload)) lastEvent = performance.now(); };
    const onEnd = (payload = {}) => { if (ownEvent(payload)) state.target = getVisemeShape('rest'); };
    const offViseme = speechBus.on('viseme', onViseme);
    const offStart = speechBus.on('start', onStart);
    const offEnd = speechBus.on('end', onEnd);

    const tick = (now) => {
      if (!alive) return;
      const dt = Math.min(80, now - previous); previous = now;
      if (now - lastEvent > 250 && now >= nextBabble) {
        const v = babble[Math.floor(Math.random() * babble.length)];
        state.target = getVisemeShape(v);
        state.lastViseme = v;
        nextBabble = now + 100 + Math.random() * 170;
      }
      state.current = interpolateViseme(state.current, state.target, Math.min(1, dt / 60));
      setMouth(root, state.current, state.lastViseme || 'rest');
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      alive = false; cancelAnimationFrame(raf);
      offViseme?.(); offStart?.(); offEnd?.();
    };
  }, [talking, emotion, face.id]);

  return (
    <div className={`relative ${className}`}>
      <div className={`w-full aspect-square overflow-hidden ${rounded} ${FRAME_CLS[frame] || ''}`} style={{ background: teacher?.bg || face.bg }}>
        <div ref={rootRef} className="w-full h-full [&>svg]:block [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: svg }} />
      </div>
    </div>
  );
}

// Small helper: flash an emotion for a moment, then return to neutral.
export function useEmotion() {
  const [emotion, setEmotion] = useState('neutral');
  const t = useRef(null);
  const flash = (e, ms = 2400) => {
    clearTimeout(t.current);
    setEmotion(e);
    if (ms) t.current = setTimeout(() => setEmotion('neutral'), ms);
  };
  useEffect(() => () => clearTimeout(t.current), []);
  return [emotion, flash];
}

export function SpeechBubble({ children, className = '' }) {
  if (!children) return null;
  return (
    <div className={`anim-bubble relative bg-surface border border-black/5 shadow-lg rounded-2xl px-4 py-3 font-semibold text-[15px] leading-snug ${className}`}>
      {children}
    </div>
  );
}
