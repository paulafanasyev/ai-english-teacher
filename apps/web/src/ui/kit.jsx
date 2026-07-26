import { useEffect } from 'react';

export function Modal({ open, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className={`card anim-pop w-full ${wide ? 'max-w-2xl' : 'max-w-md'} p-6 max-h-[86vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-3 w-full text-left group">
      <span className={`w-12 h-7 rounded-full p-1 transition shrink-0 ${checked ? 'bg-primary' : 'bg-ink/15'}`}>
        <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </span>
      {label && <span className="font-bold">{label}</span>}
    </button>
  );
}

// Chip-style selector (no native <select> — avoids DOM quirks in sandboxed
// iframes and plays nicer on touch screens).
export function Select({ value, onChange, options, className = '' }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={`btn !py-2 !px-3.5 text-sm ${value === o.value ? 'btn-primary' : 'btn-ghost'}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ProgressBar({ value, className = '', color }) {
  return (
    <div className={`h-3 rounded-full bg-ink/10 overflow-hidden ${className}`}>
      <div className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value * 100))}%`, background: color || 'linear-gradient(90deg, rgb(var(--c-primary)), rgb(var(--c-primary2)))' }} />
    </div>
  );
}

export function Stat({ icon, label, value, sub }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className="text-3xl">{icon}</div>
      <div className="min-w-0">
        <div className="text-xl font-black leading-tight truncate">{value}</div>
        <div className="label">{label}</div>
        {sub && <div className="text-xs font-semibold text-ink/50">{sub}</div>}
      </div>
    </div>
  );
}

export const Coin = ({ n }) => <span className="chip bg-amber-100 text-amber-800">🪙 {n}</span>;
export const Xp = ({ n }) => <span className="chip bg-violet-100 text-violet-800">⭐ {n}</span>;

export function Confetti({ burst }) {
  if (!burst) return null;
  const pieces = Array.from({ length: 26 });
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {pieces.map((_, i) => {
        const left = Math.random() * 100, delay = Math.random() * 0.25, dur = 1.4 + Math.random() * 1.2;
        const emoji = ['🎉', '✨', '⭐', '🎊', '💛', '💜'][i % 6];
        return (
          <span key={i} className="absolute text-2xl" style={{
            left: left + '%', top: '-8%',
            animation: `confettiFall ${dur}s ${delay}s ease-in forwards`,
          }}>{emoji}</span>
        );
      })}
      <style>{`@keyframes confettiFall { to { transform: translateY(115vh) rotate(${Math.random() > 0.5 ? '' : '-'}220deg); opacity: 0.9; } }`}</style>
    </div>
  );
}
