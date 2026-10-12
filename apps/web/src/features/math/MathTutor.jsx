import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp, useLocale } from '../../core/store.js';
import { api } from '../../core/api.js';
import { pickL } from '../../i18n/index.js';
import { teacherById } from '../../data/teachers.js';
import Avatar, { SpeechBubble, useEmotion } from '../../avatar/Avatar.jsx';
import { sfx } from '../../audio/sfx.js';
import { track } from '../../core/analytics.js';
import { ProgressBar, Select, Confetti } from '../../ui/kit.jsx';
import { TOPICS, makeSet } from './problems.js';
import * as S from './socratic.js';
import { mathStore } from './mathStore.js';
import { topicTitle } from './classMath.js';

const T = {
  title: { ru: 'Математика: подумай сам', en: 'Math: think it through' },
  intro: {
    ru: 'Светлана не даёт готовых ответов. Сначала попробуй сам, подсказки откроются по шагам, а решение только после твоих попыток.',
    en: 'No ready answers here. Try first: hints open step by step, the solution only after your attempts.',
  },
  grade: { ru: 'Класс', en: 'Grade' },
  topic: { ru: 'Тема', en: 'Topic' },
  any: { ru: '🎲 Любая', en: '🎲 Any' },
  length: { ru: 'Сколько задач', en: 'How many problems' },
  start: { ru: 'Начать', en: 'Start' },
  answer: { ru: 'Твой ответ', en: 'Your answer' },
  placeholder: { ru: 'например 3/4, −2,5 или 2x + 6', en: 'e.g. 3/4, −2.5 or 2x + 6' },
  check: { ru: 'Проверить', en: 'Check' },
  hint: { ru: 'Подсказка', en: 'Hint' },
  tryFirst: { ru: 'Сначала попробуй ответить, потом откроется следующая подсказка', en: 'Try an answer first, then the next hint opens' },
  suggest: { ru: 'Не получается? Возьми подсказку, это не стыдно.', en: 'Stuck? Take a hint, that is fine.' },
  reveal: { ru: 'Показать решение', en: 'Show solution' },
  revealLocked: { ru: 'Решение откроется после третьей подсказки и ещё одной попытки', en: 'The solution unlocks after hint 3 and one more try' },
  correct: { ru: 'Верно!', en: 'Correct!' },
  partial: { ru: 'Почти!', en: 'Almost!' },
  wrong: { ru: 'Пока нет', en: 'Not yet' },
  solution: { ru: 'Решение', en: 'Solution' },
  explainQ: { ru: 'Объясни в одном-двух предложениях, как ты решал (+3 ⭐)', en: 'Explain in a sentence or two how you solved it (+3 ⭐)' },
  explainBtn: { ru: 'Отправить объяснение', en: 'Send explanation' },
  explainOk: { ru: 'Отлично объяснил! +3 ⭐', en: 'Great explanation! +3 ⭐' },
  explainMore: { ru: 'Назови главную идею: какое правило ты применил?', en: 'Name the key idea: which rule did you use?' },
  next: { ru: 'Дальше', en: 'Next' },
  finish: { ru: 'Завершить', en: 'Finish' },
  done: { ru: 'Готово!', en: 'Done!' },
  solved: { ru: 'Решено сам', en: 'Solved' },
  hintsUsed: { ru: 'Подсказок', en: 'Hints used' },
  again: { ru: 'Ещё задачи', en: 'More problems' },
  home: { ru: 'На главную', en: 'Home' },
  progress: { ru: 'Задача {n} из {total}', en: 'Problem {n} of {total}' },
  homework: { ru: 'Задание от учителя', en: 'Homework from your teacher' },
  doHomework: { ru: 'Решать', en: 'Start' },
  mixed: { ru: 'разные темы', en: 'mixed topics' },
  sent: { ru: 'Результат отправлен учителю в журнал', en: 'Your result was sent to the teacher' },
  xpRule: { ru: 'Без подсказок 10 ⭐, с одной 7, с двумя 4, с тремя 2', en: 'No hints 10 ⭐, one 7, two 4, three 2' },
};

export default function MathTutor() {
  const { user, setUser } = useApp();
  const locale = useLocale();
  const tr = (k, p) => { let s = pickL(T[k], locale); if (p) for (const [a, b] of Object.entries(p)) s = s.split(`{${a}}`).join(String(b)); return s; };
  const teacher = teacherById(user.teacherId);
  const [emotion, flash] = useEmotion();

  const [phase, setPhase] = useState('setup');
  const [cfg, setCfg] = useState({ grade: 7, topic: 'any', count: 6 });
  const [set, setSet] = useState([]);
  const [idx, setIdx] = useState(0);
  const [st, setSt] = useState(null);
  const [input, setInput] = useState('');
  const [why, setWhy] = useState('');
  const [whyRes, setWhyRes] = useState(null);
  const [log, setLog] = useState([]);
  const [reward, setReward] = useState(null);
  const startedAt = useRef(0);
  const recorded = useRef(new Set());
  const advancing = useRef(false);
  const [homework, setHomework] = useState([]);
  const [assignment, setAssignment] = useState(null);

  useEffect(() => { if (phase === 'setup') setHomework(mathStore.myOpen()); }, [phase]);

  const topicOpts = useMemo(() => [{ value: 'any', label: tr('any') },
    ...(TOPICS[cfg.grade] || []).map((x) => ({ value: x.id, label: pickL(x.title, locale) }))], [cfg.grade, locale]); // eslint-disable-line

  // A teacher assignment uses its own seed, so the whole class gets the same problems.
  const begin = (a = null) => {
    sfx.click();
    setAssignment(a);
    const s = a
      ? makeSet({ grade: a.grade, topic: a.topic, count: a.count, seed: a.seed })
      : makeSet({ grade: cfg.grade, topic: cfg.topic, count: cfg.count, seed: (Date.now() ^ (Math.random() * 1e9)) >>> 0 });
    recorded.current = new Set();
    setSet(s); setIdx(0); setLog([]); open(s[0]);
    track('math_start', { grade: a ? a.grade : cfg.grade, topic: a ? a.topic : cfg.topic, homework: !!a });
    setPhase('run');
  };
  const open = (p) => { setSt(S.start(p)); setInput(''); setWhy(''); setWhyRes(null); startedAt.current = Date.now(); };

  // One attempt record per problem: solved or revealed, never both, never twice.
  const record = (n, correct) => {
    if (recorded.current.has(n.problem.id)) return;
    recorded.current.add(n.problem.id);
    // Math has its own log: English attempts drive the adaptive CEFR level, so math must not mix in.
    mathStore.log({ grade: n.problem.grade, topic: n.problem.topic, correct, hints: n.hintLevel, revealed: !correct, assignmentId: assignment?.id || null });
  };

  const onCheck = (e) => {
    e?.preventDefault?.();
    if (!st || st.solved || st.revealed) return;
    const n = S.attempt(st, input);
    setSt(n);
    if (n.last?.status === 'invalid') return;
    if (n.solved) { sfx.correct(); flash('happy'); record(n, true); }
    else { sfx.wrong(); flash('encourage'); }
  };
  const onHint = () => { sfx.click(); setSt(S.hint(st)); };
  const onReveal = () => {
    if (!S.canReveal(st)) return;
    const n = S.reveal(st);
    if (!n.revealed) return;
    sfx.click(); setSt(n); record(n, false);
  };
  const onExplain = () => { const r = S.explain(st, why); setWhyRes(r.ok); if (r.ok) { setSt(r.state); sfx.correct(); } };

  const next = async () => {
    if (advancing.current) return;
    advancing.current = true;
    try { await advance(); } finally { advancing.current = false; }
  };
  const advance = async () => {
    sfx.click();
    const entry = { solved: st.solved, hints: st.hintLevel, xp: st.xp };
    const all = [...log, entry];
    setLog(all);
    if (idx + 1 < set.length) { setIdx(idx + 1); open(set[idx + 1]); return; }
    const xp = all.reduce((a, b) => a + b.xp, 0);
    const solved = all.filter((x) => x.solved).length;
    const coins = 5 + solved * 2;
    const hintsTotal = all.reduce((a, b) => a + b.hints, 0);
    const sent = assignment ? !!mathStore.complete({ assignmentId: assignment.id, solved, total: all.length, hints: hintsTotal }) : false;
    const u = await api.earn({ xp, coins }).catch(() => null);
    if (u) setUser(u);
    setReward({ xp, coins, solved, total: all.length, hints: hintsTotal, sent });
    sfx.levelUp(); flash('happy', 6000);
    setPhase('done');
  };

  if (phase === 'setup') {
    return (
      <div className="max-w-xl mx-auto">
        <h1 className="h1 mb-2">🧮 {tr('title')}</h1>
        <p className="font-semibold text-ink/60 mb-5">{tr('intro')}</p>
        {homework.length > 0 && (
          <div className="card p-5 mb-5 space-y-2 !border-2 !border-violet-300">
            <div className="font-black">📝 {tr('homework')}</div>
            {homework.map((a) => (
              <div key={a.id} className="flex items-center gap-3">
                <div className="flex-1 font-bold">{a.topic === 'any' ? tr('mixed') : pickL(topicTitle(a.topic), locale)} · {a.grade} {tr('grade').toLowerCase()} · {a.count}</div>
                <button className="btn-primary !py-2" onClick={() => begin(a)}>{tr('doHomework')}</button>
              </div>
            ))}
          </div>
        )}
        <div className="card p-6 space-y-5">
          <div>
            <div className="label mb-1.5">{tr('grade')}</div>
            <div className="grid grid-cols-5 gap-2">
              {[5, 6, 7, 8, 9].map((g) => (
                <button key={g} onClick={() => setCfg({ ...cfg, grade: g, topic: 'any' })}
                  className={`btn !py-2 ${cfg.grade === g ? 'btn-primary' : 'btn-ghost'}`}>{g}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="label mb-1.5">{tr('topic')}</div>
            <Select value={cfg.topic} onChange={(v) => setCfg({ ...cfg, topic: v })} options={topicOpts} />
          </div>
          <div>
            <div className="label mb-1.5">{tr('length')}</div>
            <div className="grid grid-cols-3 gap-2">
              {[4, 6, 10].map((n) => (
                <button key={n} onClick={() => setCfg({ ...cfg, count: n })}
                  className={`btn !py-2 ${cfg.count === n ? 'btn-primary' : 'btn-ghost'}`}>{n}</button>
              ))}
            </div>
          </div>
          <div className="text-xs font-bold text-ink/50">⭐ {tr('xpRule')}</div>
          <button className="btn-primary w-full text-lg" onClick={() => begin()}>🚀 {tr('start')}</button>
        </div>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="max-w-lg mx-auto text-center">
        <Confetti burst />
        <div className="w-44 mx-auto"><Avatar teacher={teacher} emotion="happy" /></div>
        <h1 className="h1 mt-4">🎉 {tr('done')}</h1>
        <div className="card p-6 mt-5 grid grid-cols-3 gap-3">
          <div><div className="text-3xl font-black text-primary">{reward.solved}/{reward.total}</div><div className="label">{tr('solved')}</div></div>
          <div><div className="text-3xl font-black text-violet-500">+{reward.xp}</div><div className="label">XP</div></div>
          <div><div className="text-3xl font-black text-amber-500">{reward.hints}</div><div className="label">{tr('hintsUsed')}</div></div>
        </div>
        {reward.sent && <div role="status" className="chip !bg-emerald-100 text-emerald-700 mt-4">✅ {tr('sent')}</div>}
        <div className="flex gap-3 mt-6">
          <button className="btn-primary flex-1" onClick={() => setPhase('setup')}>🔁 {tr('again')}</button>
          <Link to="/" className="btn-ghost flex-1">🏠 {tr('home')}</Link>
        </div>
      </div>
    );
  }

  const p = st.problem;
  const topicMeta = (TOPICS[p.grade] || []).find((x) => x.id === p.topic);
  const finished = st.solved || st.revealed;
  const status = st.last?.status;
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <Link to="/" className="text-2xl" aria-label={tr('home')}>✖️</Link>
        <ProgressBar value={(idx + (finished ? 1 : 0)) / set.length} className="flex-1" />
        <span className="font-black text-sm text-ink/50 whitespace-nowrap">{tr('progress', { n: idx + 1, total: set.length })}</span>
      </div>

      <div className="grid md:grid-cols-[160px_1fr] gap-5 items-start">
        <div className="hidden md:block sticky top-4">
          <Avatar teacher={teacher} emotion={emotion} frame={user.frame} />
          {st.suggestHint && <SpeechBubble className="mt-3 text-sm">{tr('suggest')}</SpeechBubble>}
        </div>

        <div className="space-y-4">
          <div className="card p-6">
            <div className="label mb-2">{topicMeta ? pickL(topicMeta.title, locale) : p.topic} · {p.grade} {tr('grade').toLowerCase()}</div>
            <div className="text-2xl font-black leading-snug">{pickL(p.prompt, locale)}</div>

            {!finished && (
              <form onSubmit={onCheck} className="mt-5 flex gap-2">
                <input className="input flex-1 text-lg font-bold" value={input} onChange={(e) => setInput(e.target.value)}
                  placeholder={tr('placeholder')} aria-label={tr('answer')} inputMode="text" autoComplete="off" maxLength={256} autoFocus />
                <button type="submit" className="btn-primary">{tr('check')}</button>
              </form>
            )}

            {st.last && (
              <div role="status" aria-live="polite" className={`mt-4 rounded-2xl p-4 font-bold anim-pop ${status === 'correct' ? 'bg-emerald-50 text-emerald-700' : status === 'partial' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-600'}`}>
                {status === 'correct' ? '✅ ' + tr('correct') : status === 'partial' ? '🟡 ' + tr('partial') : status === 'wrong' ? '🤔 ' + tr('wrong') : '✍️'}
                {st.last.note && <span className="ml-2 font-semibold">{pickL(st.last.note, locale)}</span>}
              </div>
            )}
          </div>

          {S.visibleHints(st).length > 0 && (
            <div className="card p-5 space-y-2">
              {S.visibleHints(st).map((h, i) => (
                <div key={i} className="flex gap-2 font-semibold"><span className="chip bg-violet-100 text-violet-800 shrink-0">💡 {i + 1}</span><span>{pickL(h, locale)}</span></div>
              ))}
            </div>
          )}

          {!finished && (
            <div className="flex flex-wrap gap-2">
              <button className="btn-ghost" disabled={!S.canHint(st)} title={S.canHint(st) ? '' : tr('tryFirst')} onClick={onHint}>
                💡 {tr('hint')} {Math.min(st.hintLevel + 1, 3)}/3
              </button>
              {st.hintLevel >= 3 && (
                <button className="btn-ghost" disabled={!S.canReveal(st)} title={S.canReveal(st) ? '' : tr('revealLocked')} onClick={onReveal}>📖 {tr('reveal')}</button>
              )}
              {!S.canHint(st) && st.hintLevel < 3 && <span className="text-xs font-bold text-ink/50 self-center">{tr('tryFirst')}</span>}
            </div>
          )}

          {finished && (
            <div className="card p-5 space-y-3 anim-pop">
              <div><span className="label">{tr('solution')}:</span> <span className="font-bold">{pickL(p.solution, locale)}</span></div>
              {st.solved && !st.explained && (
                <div className="space-y-2">
                  <label htmlFor="math-why" className="block font-bold text-sm">{tr('explainQ')}</label>
                  <textarea id="math-why" className="input w-full min-h-[70px]" maxLength={500} value={why} onChange={(e) => setWhy(e.target.value)} />
                  <button className="btn-ghost !py-2 text-sm" onClick={onExplain} disabled={!why.trim()}>{tr('explainBtn')}</button>
                  {whyRes === false && <div className="text-sm font-semibold text-amber-700">{tr('explainMore')}</div>}
                </div>
              )}
              {st.explained && <div className="text-sm font-bold text-emerald-700">{tr('explainOk')}</div>}
              <button className="btn-primary w-full" onClick={next}>{idx + 1 < set.length ? tr('next') + ' →' : '🏁 ' + tr('finish')}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
