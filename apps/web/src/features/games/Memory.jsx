import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp, useT, useLocale } from '../../core/store.js';
import { api } from '../../core/api.js';
import { vocabulary, shuffle } from '../../data/index.js';
import { sfx } from '../../audio/sfx.js';
import { Confetti } from '../../ui/kit.jsx';

const PAIRS = 8;

function buildDeck(level, locale) {
  let pool = vocabulary.filter((w) => w.level === level && w.en.length <= 12);
  if (pool.length < PAIRS) pool = vocabulary.filter((w) => w.en.length <= 12);
  const words = shuffle(pool).slice(0, PAIRS);
  const cards = words.flatMap((w) => [
    { key: w.id + '_en', pair: w.id, text: w.en, side: 'en' },
    { key: w.id + '_tr', pair: w.id, text: locale === 'vi' ? w.vi : w.ru, side: 'tr' },
  ]);
  return shuffle(cards);
}

export default function Memory() {
  const { user, setUser } = useApp();
  const t = useT();
  const locale = useLocale();
  const [deck, setDeck] = useState(() => buildDeck(user.level, locale));
  const [open, setOpen] = useState([]); // keys currently flipped
  const [matched, setMatched] = useState([]); // pair ids
  const [moves, setMoves] = useState(0);
  const [sec, setSec] = useState(0);
  const [done, setDone] = useState(null);
  const lock = useRef(false);
  const timer = useRef(null);

  useEffect(() => {
    timer.current = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(timer.current);
  }, [deck]);

  const restart = () => {
    setDeck(buildDeck(user.level, locale));
    setOpen([]); setMatched([]); setMoves(0); setSec(0); setDone(null);
    lock.current = false;
  };

  const flip = (card) => {
    if (lock.current || done) return;
    if (open.includes(card.key) || matched.includes(card.pair)) return;
    sfx.pop();
    const nowOpen = [...open, card.key];
    setOpen(nowOpen);
    if (nowOpen.length === 2) {
      lock.current = true;
      setMoves((m) => m + 1);
      const [a, b] = nowOpen.map((k) => deck.find((c) => c.key === k));
      if (a.pair === b.pair && a.side !== b.side) {
        setTimeout(() => {
          sfx.match();
          const nm = [...matched, a.pair];
          setMatched(nm); setOpen([]); lock.current = false;
          if (nm.length === PAIRS) finish(nm);
        }, 350);
      } else {
        setTimeout(() => { sfx.wrong(); setOpen([]); lock.current = false; }, 750);
      }
    }
  };

  const finish = async () => {
    clearInterval(timer.current);
    const stars = moves + 1 <= 11 ? 3 : moves + 1 <= 15 ? 2 : 1;
    const xp = 15 + stars * 8, coins = 8 + stars * 5;
    sfx.levelUp();
    api.addAttempt({ taskType: 'match', topic: 'memory game', level: user.level, correct: true, durationMs: sec * 1000 }).catch(() => {});
    const u = await api.earn({ xp, coins }).catch(() => null);
    if (u) setUser(u);
    setDone({ stars, xp, coins });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Link to="/games" className="text-2xl">←</Link>
        <h1 className="h2">🧠 {t('games.memory.name')}</h1>
        <div className="ml-auto flex gap-2">
          <span className="chip">🎬 {t('games.memory.moves')}: {moves}</span>
          <span className="chip">⏱ {Math.floor(sec / 60)}:{String(sec % 60).padStart(2, '0')}</span>
          <span className="chip">✅ {matched.length}/{PAIRS}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2.5">
        {deck.map((c) => {
          const isOpen = open.includes(c.key) || matched.includes(c.pair);
          const isMatched = matched.includes(c.pair);
          return (
            <button key={c.key} onClick={() => flip(c)}
              className={`aspect-[4/3] rounded-2xl font-black text-sm sm:text-base p-1.5 transition-all duration-200 flex items-center justify-center text-center leading-tight
                ${isMatched ? 'bg-emerald-100 text-emerald-700 scale-95' :
                  isOpen ? 'bg-surface shadow-lg border-2 border-primary/40' :
                  'text-white shadow-md hover:scale-[1.03]'}
              `}
              style={!isOpen ? { background: 'linear-gradient(135deg, rgb(var(--c-primary)), rgb(var(--c-primary2)))' } : {}}>
              {isOpen ? c.text : '❓'}
            </button>
          );
        })}
      </div>

      {done && (
        <div className="card p-6 text-center mt-5 anim-pop">
          <Confetti burst />
          <div className="text-3xl">{'⭐'.repeat(done.stars)}</div>
          <div className="text-xl font-black mt-1">{t('games.win')}</div>
          <div className="chip mt-2">🎁 {t('games.reward')}: ⭐ {done.xp} · 🪙 {done.coins}</div>
          <div className="flex gap-2 mt-4">
            <button className="btn-primary flex-1" onClick={restart}>🔁 {t('games.again')}</button>
            <Link to="/games" className="btn-ghost flex-1">{t('games.back')}</Link>
          </div>
        </div>
      )}
    </div>
  );
}
