import { useId } from 'react';

// Pavel Afanasyev "P/>" mark (teal, extruded like the 3D logo animation).
export function LogoMark({ className = 'w-12 h-8', title = 'P/>' }) {
  const gid = useId().replace(/:/g, '');
  const shapes = (
    <>
      <path fillRule="evenodd" d="M8 6h30a22 22 0 0 1 0 44H24v24H8zM24 20v16h13a8 8 0 0 0 0-16z" />
      <path d="M58 6h14L52 74H38z" />
      <path d="M80 33h12l14 15-14 15H80l14-15z" />
    </>
  );
  return (
    <svg viewBox="0 0 112 80" className={className} role="img" aria-label={title}>
      <defs>
        <linearGradient id={`lg${gid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3fd6c4" />
          <stop offset=".55" stopColor="#14938f" />
          <stop offset="1" stopColor="#0d5c66" />
        </linearGradient>
      </defs>
      <g fill="#0a3e47" transform="translate(3 4)">{shapes}</g>
      <g fill={`url(#lg${gid})`}>{shapes}</g>
    </svg>
  );
}

export default function Logo({ className = '', subtitle = 'FULL STACK DEVELOPER' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoMark className="w-14 h-10 shrink-0" />
      <div className="leading-tight">
        <div className="font-black tracking-tight text-[#1d3a4a]">PAVEL AFANASYEV</div>
        <div className="text-[10px] font-extrabold tracking-[0.22em] text-[#14938f]">{subtitle}</div>
      </div>
    </div>
  );
}
