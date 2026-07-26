import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp, useT } from '../../core/store.js';
import { api } from '../../core/api.js';
import { teacherById } from '../../data/teachers.js';
import { grammar, shuffle, pickOne, praise, encourage } from '../../data/index.js';
import Avatar, { useEmotion } from '../../avatar/Avatar.jsx';
import { tts } from '../../audio/tts.js';
import { sfx } from '../../audio/sfx.js';
import { ProgressBar, Confetti } from '../../ui/kit.jsx';

const ROUNDS = 3;

export default function WordBattle() {
  const { user, setUser } = useApp();
  const t = useT();
  const teacher = teacherById(user.teacherId);
  const [phase, setPhase] = useState('intro'); // intro | play | between | over
  const [round, setRound] = useState(1);
  const [task, setTask] = useState(null);
  const [bank, setBank] = useState([]);
  const [built, setBuilt] = useState([]);
  const [aiProgress, setAiProgress] = useState(0);
  const [score, setScore] = useState({ you: 0, ai: 0 });
  const [talking, setTalking] = useState(false);
  const [emotion, flash] = useEmotion();
  const [roundMsg, setRoundMsg] = useState(null);
  const timer = useRef(null);

  const newRound = (rn) => {
    const pool = grammar.filter((g) => g.type === 'reorder' && (g.level === user.level || true));
    const src = pickOne(pool.length ? pool : grammar.filter((g) => g.type === 'reorder'));
    const finalTask = { type: 'reorder', words: shuffle(src.words), correct: src.correct };
    setTask(finalTask);
    setBank(finalTask.words.map((w, i) => ({ w, i })));
    setBuilt([]);
    setAiProgress(0);
    setRoundMsg(null);
    setPhase('play');
    const dur = (finalTask.words.length * 2600) * (0.9 + Math.random() * 0.5); // ms for AI to finish
    const startAt = Date.now();
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      const p = (Date.now() - startAt) / dur;
      setAiProgress(p);
      if (p >= 1) { clearInterval(timer.current); roundEnd(false, finalTask, rn); }
    }, 90);
  };

  const speak = (text) => tts.speak(text, teacher, { onStart: () => setTalking(true), onEnd: () => setTalking(false) });

  const roundEnd = (youWon, tk, rn) => {
    clearInterval(timer.current);
    api.addAttempt({ taskType: 'grammar', topic: 'word battle', level: user.level, correct: youWon, durationMs: 0 }).then((u) => u && setUser(u)).catch(() => {});
    setScore((s) => ({ you: s.you + (youWon ? 1 : 0), ai: s.ai + (youWon ? 0 : 1) }));
    if (youWon) { sfx.correct(); flash('happy'); speak(praise()); }
    else { sfx.wrong(); flash('encourage'); speak("Got it first! " + encourage()); }
    setRoundMsg({ youWon, correct: tk.correct });
    setPhase(rn >= ROUNDS ? 'preover' : 'between');
  };

  useEffect(() => {
    if (phase !== 'preover') return;
    (async () => {
      const finalYou = score.you, finalAi = score.ai;
      const won = finalYou > finalAi;
      const xp = won ? 40 : 12, coins = won ? 25 : 6;
      const u = await api.earn({ xp, coins }).catch(() => null);
      if (u) setUser(u);
      if (won) sfx.levelUp();
      setPhase('over');
    })();
    return () => {};
  }, [phase]); // eslint-disable-line

  useEffect(() => () => { clearInterval(timer.current); tts.stop(); }, []);

  const take = (item) => { sfx.pop(); setBank(bank.filter((b) => b.i !== item.i)); setBuilt([...built, item]); };
  const put = (item) => { sfx.click(); setBuilt(built.filter((b) => b.i !== item.i)); setBank([...bank, item]); };
  const check = () => {
    const answer = built.map((b) => b.w).join(' ').toLowerCase().replace(/[^a-z0-9' ]/g, '');
    const target = task.correct.toLowerCase().replace(/[^a-z0-9' ]/g, '');
    if (answer === target) roundEnd(true, task, round);
    else { sfx.wrong(); flash('encourage'); document.getElementById('wb-built')?.classList.add('anim-shake'); setTimeout(() => document.getElementById('wb-built')?.classList.remove('anim-shake'), 350); }
  };

  const won = score.you > score.ai;
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Link to="/games" className="text-2xl">←</Link>
        <h1 className="h2">⚔️ {t('games.wordbattle.name')}</h1>
        {phase !== 'intro' && <span className="chip ml-auto">{t('games.round', { n: Math.min(round, ROUNDS) })} / {ROUNDS}</span>}
      </div>

      {phase === 'intro' && (
        <div className="card p-6 text-center">
          <div className="w-36 mx-auto"><Avatar teacher={teacher} emotion="happy" /></div>
          <p className="font-bold text-lg mt-3">{t('games.wordbattle.desc')}</p>
          <div className="mt-2 font-black text-2xl">{t('games.you')} 🆚 {teacher.name}</div>
          <button className="btn-primary mt-5 w-full" onClick={() => { setScore({ you: 0, ai: 0 }); setRound(1); newRound(1); }}>▶️ {t('games.start')}</button>
        </div>
      )}

      {(phase === 'play' || phase === 'between' || phase === 'preover' || phase === 'over') && phase !== 'intro' && (
        <>
          {/* scoreboard */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="card p-3">
              <div className="flex justify-between font-black"><span>🎒 {t('games.you')}</span><span>{score.you}</span></div>
            </div>
            <div className="card p-3">
              <div className="flex items-center gap-2">
                <div className="w-9 shrink-0"><Avatar teacher={teacher} talking={talking} emotion={emotion} rounded="rounded-lg" /></div>
                <div className="flex-1">
                  <div className="flex justify-between font-black text-sm"><span>{teacher.name}</span><span>{score.ai}</span></div>
                  {phase === 'play' && <ProgressBar value={aiProgress} className="mt-1 !h-2" color="linear-gradient(90deg,#f43f5e,#f97316)" />}
                </div>
              </div>
            </div>
          </div>

          {phase === 'play' && task && (
            <div className="card p-5">
              <div id="wb-built" className="min-h-[60px] rounded-2xl border-2 border-dashed border-primary/30 bg-soft/50 p-3 flex flex-wrap gap-2 justify-center">
                {built.map((b) => <button key={b.i} className="btn-primary !px-3 !py-1.5" onClick={() => put(b)}>{b.w}</button>)}
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-4 min-h-[44px]">
                {bank.map((b) => <button key={b.i} className="btn-ghost !px-3 !py-1.5" onClick={() => take(b)}>{b.w}</button>)}
              </div>
              <button className="btn-primary w-full mt-4" disabled={bank.length > 0} onClick={check}>⚡ {t('task.check')}</button>
            </div>
          )}

          {(phase === 'between') && roundMsg && (
            <div className="card p-5 text-center anim-pop">
              <div className={`text-2xl font-black ${roundMsg.youWon ? 'text-emerald-500' : 'text-rose-500'}`}>
                {roundMsg.youWon ? '🏅 ' + t('games.win') : '💨 ' + t('games.lose', { name: teacher.name })}
              </div>
              <div className="mt-1 font-bold text-ink/60">“{roundMsg.correct}”</div>
              <button className="btn-primary mt-4 w-full" onClick={() => { setRound(round + 1); newRound(round + 1); }}>{t('games.round', { n: round + 1 })} →</button>
            </div>
          )}

          {phase === 'over' && (
            <div className="card p-6 text-center anim-pop">
              <Confetti burst={won} />
              <div className="text-4xl">{won ? '🏆' : '🤝'}</div>
              <div className="text-2xl font-black mt-1">{won ? t('games.win') : score.you === score.ai ? t('games.draw') : t('games.lose', { name: teacher.name })}</div>
              <div className="font-black text-lg mt-2">{score.you} : {score.ai}</div>
              <div className="chip mt-2">🎁 {t('games.reward')}: ⭐ {won ? 40 : 12} · 🪙 {won ? 25 : 6}</div>
              <div className="flex gap-2 mt-4">
                <button className="btn-primary flex-1" onClick={() => setPhase('intro')}>🔁 {t('games.again')}</button>
                <Link to="/games" className="btn-ghost flex-1">{t('games.back')}</Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
