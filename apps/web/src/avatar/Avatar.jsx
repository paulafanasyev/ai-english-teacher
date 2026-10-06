import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { speechBus } from '../audio/speechBus.js';
import { faceFor } from './faces.js';
import { FRAME_CLS, renderAvatarSVG } from './svg.js';

// Pixar-style portraits: one base render + feathered RGBA overlays that are
// cross-faded for lip-sync (A / O / E), blinking and a happy smile.
const PIXAR = new Set(['emma', 'james', 'sofia', 'alex', 'linh', 'minh']);
const LAYERS = ['A', 'O', 'E', 'happy', 'blink'];
const MOUTHS = ['A', 'O', 'E'];
// Viseme from the TTS engine -> mouth overlay (null = closed lips of the base render).
const VISEME_TO_LAYER = { rest: null, M: null, F: 'E', A: 'A', I: 'E', E: 'E', L: 'A', O: 'O', U: 'O', W: 'O' };
const HAPPY = new Set(['happy', 'encourage', 'excited', 'proud']);

// Portraits ship as lazily-loaded JS modules with WebP data URLs (no extra
// static files to deploy; each teacher is ~20 KB and loads on first use).
const LOADERS = {
  emma: () => import('./pixar/emma.js'),
  james: () => import('./pixar/james.js'),
  sofia: () => import('./pixar/sofia.js'),
  alex: () => import('./pixar/alex.js'),
  linh: () => import('./pixar/linh.js'),
  minh: () => import('./pixar/minh.js'),
};
const cache = {};
function usePortrait(id) {
  const [data, setData] = useState(() => cache[id] || null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    if (cache[id]) { setData(cache[id]); return undefined; }
    const load = LOADERS[id];
    if (!load) { setFailed(true); return undefined; }
    load().then((m) => { cache[id] = m.default; if (alive) setData(m.default); }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [id]);
  return { data, failed };
}
const pct = (v, size) => `${(v / size) * 100}%`;

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
  const id = teacher?.id;
  const { data, failed } = usePortrait(PIXAR.has(id) ? id : null);
  if (!PIXAR.has(id) || failed) return <SvgAvatar teacher={teacher} emotion={emotion} frame={frame} className={className} rounded={rounded} />;
  return <PixarAvatar teacher={teacher} data={data} emotion={emotion} talking={talking} frame={frame} className={className} rounded={rounded} />;
}

function PixarAvatar({ teacher, data, emotion, talking, frame, className, rounded }) {
  const id = teacher.id;
  const refs = useRef({});
  const target = useRef({ A: 0, O: 0, E: 0, happy: 0, blink: 0 });
  const current = useRef({ A: 0, O: 0, E: 0, happy: 0, blink: 0 });
  const reducedMotion = useReducedMotion();
  const happy = HAPPY.has(emotion);

  // Base layer: happy smile when idle and cheerful.
  useEffect(() => {
    if (!talking) {
      MOUTHS.forEach((k) => { target.current[k] = 0; });
      target.current.happy = happy ? 1 : 0;
    } else target.current.happy = 0;
  }, [happy, talking]);

  // Animation loop: ease every layer toward its target opacity.
  useEffect(() => {
    let raf = 0; let prev = performance.now(); let alive = true;
    const tick = (now) => {
      if (!alive) return;
      const dt = Math.min(64, now - prev); prev = now;
      LAYERS.forEach((k) => {
        const speed = k === 'blink' ? 0.6 : k === 'happy' ? 0.12 : 0.45;
        const c = current.current[k] + (target.current[k] - current.current[k]) * Math.min(1, speed * (dt / 16));
        current.current[k] = Math.abs(c - target.current[k]) < 0.01 ? target.current[k] : c;
        const el = refs.current[k];
        if (el) el.style.opacity = String(current.current[k]);
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { alive = false; cancelAnimationFrame(raf); };
  }, []);

  // Natural blinking (2-6 s, occasional double blink).
  useEffect(() => {
    let alive = true; let t1; let t2;
    const blink = () => {
      if (!alive) return;
      target.current.blink = 1;
      t2 = setTimeout(() => {
        target.current.blink = 0;
        if (Math.random() < 0.15) setTimeout(() => { target.current.blink = 1; setTimeout(() => { target.current.blink = 0; }, 90); }, 140);
      }, 110);
      t1 = setTimeout(blink, 2000 + Math.random() * 4000);
    };
    t1 = setTimeout(blink, 1500 + Math.random() * 2500);
    return () => { alive = false; clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Lip-sync: real visemes from the speech engine, babble fallback if none arrive.
  useEffect(() => {
    if (!talking) return undefined;
    let last = performance.now(); let alive = true; let babbleTimer;
    const show = (layer) => { MOUTHS.forEach((k) => { target.current[k] = k === layer ? 1 : 0; }); };
    const own = (p) => !p?.teacherId || p.teacherId === id;
    const offV = speechBus.on('viseme', (p = {}) => { if (!own(p)) return; last = performance.now(); show(VISEME_TO_LAYER[p.v] ?? null); });
    const offE = speechBus.on('end', (p = {}) => { if (own(p)) show(null); });
    const babble = () => {
      if (!alive) return;
      if (performance.now() - last > 260) {
        const r = Math.random();
        show(r < 0.38 ? 'A' : r < 0.6 ? 'E' : r < 0.78 ? 'O' : null);
      }
      babbleTimer = setTimeout(babble, 90 + Math.random() * 120);
    };
    babbleTimer = setTimeout(babble, 260);
    return () => { alive = false; clearTimeout(babbleTimer); offV(); offE(); show(null); };
  }, [talking, id]);

  const motion = reducedMotion ? 'none' : talking ? 'aet-talk 2.6s ease-in-out infinite' : 'aet-breathe 4.2s ease-in-out infinite';
  return (
    <div className={`relative ${className}`}>
      <style>{AVATAR_CSS}</style>
      <div className={`w-full aspect-square overflow-hidden ${rounded} ${FRAME_CLS[frame] || ''}`} style={{ background: teacher.bg }}>
        <div className="relative w-full h-full" style={{ animation: motion, transformOrigin: '50% 90%' }}>
          {data && <img src={data.base} alt={teacher.name || 'Teacher'} draggable="false" className="absolute inset-0 w-full h-full object-cover select-none" />}
          {data && LAYERS.map((k) => {
            const l = data.layers[k];
            if (!l) return null;
            return <img key={k} ref={(el) => { refs.current[k] = el; }} src={l.src} alt="" aria-hidden="true" draggable="false"
              className="absolute select-none pointer-events-none"
              style={{ left: pct(l.x, data.size), top: pct(l.y, data.size), width: pct(l.w, data.size), height: pct(l.h, data.size), opacity: 0 }} />;
          })}
        </div>
      </div>
    </div>
  );
}

const AVATAR_CSS = `
@keyframes aet-breathe { 0%,100% { transform: translateY(0) scale(1) } 50% { transform: translateY(-0.6%) scale(1.006) } }
@keyframes aet-talk { 0%,100% { transform: rotate(0deg) translateY(0) } 25% { transform: rotate(-0.6deg) translateY(-0.4%) } 75% { transform: rotate(0.6deg) translateY(-0.2%) } }
`;

// Fallback for teachers without a Pixar render (e.g. custom ones from an API).
function SvgAvatar({ teacher, emotion, frame, className, rounded }) {
  const instanceId = useId();
  const face = useMemo(() => faceFor(teacher?.id), [teacher?.id]);
  const svg = useMemo(() => renderAvatarSVG(face, { emotion, instanceId }), [face, emotion, instanceId]);
  return (
    <div className={`relative ${className}`}>
      <div className={`w-full aspect-square overflow-hidden ${rounded} ${FRAME_CLS[frame] || ''}`} style={{ background: teacher?.bg || face.bg }}>
        <div className="w-full h-full [&>svg]:block [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: svg }} />
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
