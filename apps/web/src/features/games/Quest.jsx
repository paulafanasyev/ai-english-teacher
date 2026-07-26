import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp, useT, useLocale } from '../../core/store.js';
import { api } from '../../core/api.js';
import { storage } from '../../core/storage.js';
import { quest } from '../../data/index.js';
import { teacherById } from '../../data/teachers.js';
import { singleTask } from '../../engine/tasks.js';
import { pickL } from '../../i18n/index.js';
import Avatar, { useEmotion } from '../../avatar/Avatar.jsx';
import TaskView from '../lessons/TaskView.jsx';
import { sfx } from '../../audio/sfx.js';
import { Confetti, ProgressBar } from '../../ui/kit.jsx';

const TASK_MAP = { vocab: 'vocab', match: 'match', grammar: 'grammar', listening: 'listening', writing: 'writing' };

export default function Quest() {
  const { user, setUser } = useApp();
  const t = useT();
  const locale = useLocale();
  const teacher = teacherById(user.teacherId);
  const key = `aet_quest_${user.id}`;
  const [done, setDone] = useState(() => storage.get(key, []));
  const [view, setView] = useState({ mode: 'map' }); // map | story | tasks | finale
  const [tasks, setTasks] = useState([]);
  const [ti, setTi] = useState(0);
  const [nCorrect, setNCorrect] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [emotion, flash] = useEmotion();

  const chapters = quest.chapters;
  const nextPlayable = chapters.findIndex((c) => !done.includes(c.id));

  const openChapter = (ch) => { sfx.click(); setView({ mode: 'story', ch }); };
  const beginTasks = (ch) => {
    const generated = ch.tasks.map((tt) => singleTask(TASK_MAP[tt] || 'vocab', { level: user.level, locale }));
    setTasks(generated); setTi(0); setNCorrect(0); setFeedback(null);
    setView({ mode: 'tasks', ch });
  };

  const onAnswer = (res) => {
    if (res.correct) { sfx.correct(); flash('happy'); } else { sfx.wrong(); flash('encourage'); }
    setNCorrect((n) => n + (res.correct ? 1 : 0));
    setFeedback(res);
    api.addAttempt({ taskType: tasks[ti].type === 'vocabRev' ? 'vocab' : tasks[ti].type, topic: 'quest', level: user.level, correct: res.correct, durationMs: 0 }).then((u) => u && setUser(u)).catch(() => {});
  };

  const nextTask = async () => {
    sfx.click(); setFeedback(null);
    if (ti + 1 < tasks.length) { setTi(ti + 1); return; }
    const ch = view.ch;
    const finalCorrect = nCorrect;
    if (finalCorrect >= 2) {
      const nd = [...done, ch.id];
      setDone(nd); storage.set(key, nd);
      const u = await api.earn({ xp: ch.reward.xp, coins: ch.reward.coins }).catch(() => null);
      if (u) setUser(u);
      sfx.levelUp();
      setView({ mode: 'finale', ch, ok: true });
    } else {
      setView({ mode: 'finale', ch, ok: false });
    }
  };

  /* ---------- map ---------- */
  if (view.mode === 'map') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Link to="/games" className="text-2xl">←</Link>
          <h1 className="h2">🗺️ {pickL(quest.title, locale)}</h1>
        </div>
        <ProgressBar value={done.length / chapters.length} className="mb-4" />
        <div className="card p-5 mb-5 font-semibold leading-relaxed text-[15px]">{pickL(quest.intro, locale)}</div>
        <div className="space-y-3">
          {chapters.map((ch, i) => {
            const isDone = done.includes(ch.id);
            const isNext = i === nextPlayable;
            return (
              <button key={ch.id} disabled={!isDone && !isNext}
                onClick={() => openChapter(ch)}
                className={`card p-4 w-full flex items-center gap-4 text-left transition ${isNext ? 'hover:-translate-y-0.5 ring-2 ring-primary/50' : isDone ? 'opacity-90' : 'opacity-50'}`}>
                <div className="text-4xl">{isDone ? '✅' : isNext ? ch.emoji : '🔒'}</div>
                <div className="min-w-0 flex-1">
                  <div className="label">{t('quest.chapter', { n: i + 1 })} · {pickL(ch.place, locale)}</div>
                  <div className="font-black truncate">{pickL(ch.title, locale)}</div>
                </div>
                <div className="chip shrink-0">⭐{ch.reward.xp} 🪙{ch.reward.coins}</div>
              </button>
            );
          })}
        </div>
        {done.length === chapters.length && (
          <div className="card p-5 mt-5 text-center anim-pop"><Confetti burst /><div className="text-3xl">🏆</div><div className="font-black text-lg">{t('quest.completed')}!</div></div>
        )}
      </div>
    );
  }

  const ch = view.ch;
  const chIdx = chapters.indexOf(ch);

  /* ---------- story ---------- */
  if (view.mode === 'story') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <button className="text-2xl" onClick={() => setView({ mode: 'map' })}>←</button>
          <h1 className="h2">{ch.emoji} {pickL(ch.title, locale)}</h1>
        </div>
        <div className="card p-6 bg-gradient-to-br from-soft to-surface">
          <div className="label mb-2">{t('quest.chapter', { n: chIdx + 1 })} · {pickL(ch.place, locale)}</div>
          <p className="font-semibold leading-relaxed text-[16px] whitespace-pre-line">{pickL(ch.story, locale)}</p>
          <button className="btn-primary w-full mt-5" onClick={() => beginTasks(ch)}>
            {done.includes(ch.id) ? '🔁 ' + t('games.again') : '⚡ ' + (chIdx === 0 ? t('quest.begin') : t('quest.continue'))}
          </button>
        </div>
      </div>
    );
  }

  /* ---------- tasks ---------- */
  if (view.mode === 'tasks') {
    const task = tasks[ti];
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <button className="text-2xl" onClick={() => setView({ mode: 'map' })}>✖️</button>
          <span className="font-black">{ch.emoji} {pickL(ch.title, locale)}</span>
          <span className="chip ml-auto">{t('quest.taskProgress', { n: ti + 1, total: tasks.length })}</span>
        </div>
        <div className="flex items-start gap-3 mb-3">
          <div className="w-16 shrink-0"><Avatar teacher={teacher} emotion={emotion} rounded="rounded-2xl" /></div>
          <ProgressBar value={(ti + (feedback ? 1 : 0)) / tasks.length} className="flex-1 mt-6" />
        </div>
        <TaskView key={ti + ch.id} task={task} teacher={teacher} onAnswer={onAnswer} disabled={!!feedback} />
        {feedback && (
          <div className={`card p-4 mt-3 anim-pop border-2 ${feedback.correct ? '!border-emerald-400' : '!border-rose-300'}`}>
            <span className={`font-black ${feedback.correct ? 'text-emerald-600' : 'text-rose-500'}`}>
              {feedback.correct ? '✅ ' + t('task.correct') : '❌ ' + t('task.wrong')}
            </span>
            {!feedback.correct && feedback.correctText && <span className="ml-2 font-bold">{t('task.answerWas')} {feedback.correctText}</span>}
            <button className="btn-primary w-full mt-3" onClick={nextTask}>{ti + 1 < tasks.length ? t('lesson.next') + ' →' : '🏁 ' + t('lesson.finish')}</button>
          </div>
        )}
      </div>
    );
  }

  /* ---------- finale ---------- */
  return (
    <div className="max-w-xl mx-auto text-center">
      {view.ok && <Confetti burst />}
      <div className="text-5xl">{view.ok ? '🎉' : '😅'}</div>
      <h1 className="h2 mt-2">{view.ok ? pickL(ch.title, locale) : t('task.wrong')}</h1>
      <div className="card p-5 mt-4 font-semibold leading-relaxed">
        {view.ok ? pickL(ch.finale, locale) : `${nCorrect}/${tasks.length} — ${t('games.again')}?`}
      </div>
      {view.ok && <div className="chip mt-3">🎁 {t('quest.reward')}: ⭐ {ch.reward.xp} · 🪙 {ch.reward.coins}</div>}
      <div className="flex gap-2 mt-5">
        {!view.ok && <button className="btn-primary flex-1" onClick={() => beginTasks(ch)}>🔁 {t('games.again')}</button>}
        <button className={view.ok ? 'btn-primary flex-1' : 'btn-ghost flex-1'} onClick={() => setView({ mode: 'map' })}>🗺️ {t('quest.continue')}</button>
      </div>
    </div>
  );
}
