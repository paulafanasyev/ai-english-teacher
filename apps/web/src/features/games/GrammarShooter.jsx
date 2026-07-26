import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp, useT } from '../../core/store.js';
import { api } from '../../core/api.js';
import { grammar, shuffle, pickOne } from '../../data/index.js';
import { sfx } from '../../audio/sfx.js';
import { Confetti } from '../../ui/kit.jsx';

const GAME_SEC = 60;

function nextWave(level) {
  const errors = grammar.filter((g) => g.type === 'findError');
  const cleans = grammar.filter((g) => g.type === 'reorder');
  const useClean = Math.random() < 0.3;
  if (useClean && cleans.length) {
    const c = pickOne(cleans);
    return { clean: true, words: c.correct.split(' ') };
  }
  const g = pickOne(errors);
  return { clean: false, words: g.sentence.split(' '), errorIndex: g.errorIndex, correction: g.correction };
}

export default function GrammarShooter() {
  const { user, setUser } = useApp();
  const t = useT();
  const [phase, setPhase] = useState('intro');
  const [wave, setWave] = useState(null);
  const [sec, setSec] = useState(GAME_SEC);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [lives, setLives] = useState(3);
  const [flash, setFlash] = useState(null); // {ok, text}
  const timer = useRef(null);
  const stats = useRef({ hits: 0, waves: 0 });

  const start = () => {
    sfx.click();
    setScore(0); setCombo(1); setLives(3); setSec(GAME_SEC);
    stats.current = { hits: 0, waves: 0 };
    setWave(nextWave(user.level));
    setPhase('play');
    clearInterval(timer.current);
    timer.current = setInterval(() => setSec((s) => {
      if (s <= 1) { end(); return 0; }
      return s - 1;
    }), 1000);
  };

  const end = async () => {
    clearInterval(timer.current);
    setPhase((p) => {
      if (p !== 'play') return p;
      return 'over';
    });
  };

  useEffect(() => {
    if (phase !== 'over') return;
    (async () => {
      const xp = Math.min(60, Math.round(score / 4)), coins = Math.min(30, Math.round(score / 8));
      const u = await api.earn({ xp, coins }).catch(() => null);
      if (u) setUser(u);
      if (score > 60) sfx.levelUp();
    })();
  }, [phase]); // eslint-disable-line

  useEffect(() => () => clearInterval(timer.current), []);

  const resolve = (ok, revealText) => {
    stats.current.waves++;
    if (ok) stats.current.hits++;
    api.addAttempt({ taskType: 'grammar', topic: 'grammar shooter', level: user.level, correct: ok, durationMs: 0 }).then((u) => u && setUser(u)).catch(() => {});
    if (ok) {
      sfx.shot(); sfx.correct();
      setScore((s) => s + 10 * combo);
      setCombo((c) => Math.min(5, c + 1));
      setFlash({ ok: true, text: '+' + 10 * combo });
    } else {
      sfx.wrong();
      setCombo(1);
      setLives((l) => {
        if (l - 1 <= 0) setTimeout(end, 400);
        return l - 1;
      });
      setFlash({ ok: false, text: revealText || '✖' });
    }
    setTimeout(() => {
      setFlash(null);
      setWave(nextWave(user.level));
    }, ok ? 450 : 900);
  };

  const clickWord = (i) => {
    if (phase !== 'play' || flash) return;
    if (wave.clean) resolve(false, t('games.shooter.noerror'));
    else if (i === wave.errorIndex) resolve(true);
    else resolve(false, wave.words[wave.errorIndex] + ' → ' + wave.correction);
  };
  const clickNoError = () => {
    if (phase !== 'play' || flash) return;
    if (wave.clean) resolve(true);
    else resolve(false, wave.words[wave.errorIndex] + ' → ' + wave.correction);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Link to="/games" className="text-2xl">←</Link>
        <h1 className="h2">🎯 {t('games.shooter.name')}</h1>
        {phase === 'play' && (
          <div className="ml-auto flex gap-2 items-center">
            <span className="chip">⏱ {sec}s</span>
            <span className="chip">💥 {t('games.combo', { n: combo })}</span>
            <span className="chip">{'❤️'.repeat(Math.max(0, lives))}{'🖤'.repeat(3 - Math.max(0, lives))}</span>
          </div>
        )}
      </div>

      {phase === 'intro' && (
        <div className="card p-6 text-center">
          <div className="text-6xl">🎯</div>
          <p className="font-bold text-lg mt-2">{t('games.shooter.desc')}</p>
          <p className="text-sm font-semibold text-ink/50 mt-1">⏱ {GAME_SEC}s · ❤️×3 · 💥 combo ×5</p>
          <button className="btn-primary mt-5 w-full" onClick={start}>▶️ {t('games.start')}</button>
        </div>
      )}

      {phase === 'play' && wave && (
        <div className="card p-6 relative overflow-hidden min-h-[300px] flex flex-col">
          <div className="text-right font-black text-2xl text-primary mb-2">{t('games.score')}: {score}</div>
          <div className="flex-1 flex flex-wrap gap-3 items-center justify-center content-center py-6">
            {wave.words.map((w, i) => (
              <button key={i} onClick={() => clickWord(i)}
                className="btn-ghost !px-4 !py-2.5 text-lg anim-floaty hover:!bg-rose-100"
                style={{ animationDelay: `${(i * 0.35) % 2}s`, animationDuration: `${2.6 + (i % 3) * 0.5}s` }}>
                {w}
              </button>
            ))}
          </div>
          <button className="btn-outline w-full" onClick={clickNoError}>✅ {t('games.shooter.noerror')}</button>
          {flash && (
            <div className={`absolute inset-0 flex items-center justify-center text-3xl font-black pointer-events-none anim-pop ${flash.ok ? 'text-emerald-500' : 'text-rose-500'}`}
              style={{ background: flash.ok ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)' }}>
              {flash.text}
            </div>
          )}
        </div>
      )}

      {phase === 'over' && (
        <div className="card p-6 text-center anim-pop">
          <Confetti burst={score > 60} />
          <div className="text-4xl">🏁</div>
          <div className="text-2xl font-black mt-1">{t('games.score')}: {score}</div>
          <div className="font-bold text-ink/60 mt-1">🎯 {stats.current.hits}/{stats.current.waves}</div>
          <div className="chip mt-2">🎁 {t('games.reward')}: ⭐ {Math.min(60, Math.round(score / 4))} · 🪙 {Math.min(30, Math.round(score / 8))}</div>
          <div className="flex gap-2 mt-4">
            <button className="btn-primary flex-1" onClick={start}>🔁 {t('games.again')}</button>
            <Link to="/games" className="btn-ghost flex-1">{t('games.back')}</Link>
          </div>
        </div>
      )}
    </div>
  );
}
