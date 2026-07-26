import { useEffect, useRef, useState } from 'react';
import { spriteUrl } from '../data/teachers.js';

// Sprite sheet 2×2: TL neutral · TR talking · BL happy · BR encouraging.
// Slight inset (205%) hides the seam lines between panels.
const POS = {
  neutral: '2.5% 2.5%',
  talk: '97.5% 2.5%',
  happy: '2.5% 97.5%',
  encourage: '97.5% 97.5%',
};
const FRAME_CLS = {
  none: '',
  gold: 'ring-4 ring-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.45)]',
  neon: 'ring-4 ring-cyan-400 shadow-[0_0_28px_rgba(34,211,238,0.55)]',
  leaf: 'ring-4 ring-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.4)]',
};

export default function Avatar({ teacher, emotion = 'neutral', talking = false, frame = 'none', className = '', rounded = 'rounded-[26%]' }) {
  const [mouthOpen, setMouthOpen] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    clearTimeout(timer.current);
    if (!talking) { setMouthOpen(false); return; }
    let alive = true;
    const flip = () => {
      if (!alive) return;
      setMouthOpen((m) => !m);
      timer.current = setTimeout(flip, 85 + Math.random() * 110);
    };
    flip();
    return () => { alive = false; clearTimeout(timer.current); };
  }, [talking]);

  const state = talking ? (mouthOpen ? 'talk' : 'neutral') : emotion;

  return (
    <div className={`relative ${className}`}>
      <div
        className={`w-full aspect-square overflow-hidden ${rounded} ${FRAME_CLS[frame] || ''}`}
        style={{ background: teacher.bg }}
      >
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url(${spriteUrl(teacher.id)})`,
            backgroundSize: '205% 205%',
            backgroundPosition: POS[state] || POS.neutral,
            animation: talking ? 'talkbob 0.55s ease-in-out infinite' : 'breathe 3.4s ease-in-out infinite',
          }}
        />
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
