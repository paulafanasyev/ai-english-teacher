import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp, useT, useLocale } from '../../core/store.js';
import { api } from '../../core/api.js';
import { teacherById } from '../../data/teachers.js';
import { TOPICS, LEVELS, praise, encourage } from '../../data/index.js';
import { generateLesson } from '../../engine/tasks.js';
import { pickL } from '../../i18n/index.js';
import Avatar, { SpeechBubble, useEmotion } from '../../avatar/Avatar.jsx';
import TaskView from './TaskView.jsx';
import { tts } from '../../audio/tts.js';
import { sfx } from '../../audio/sfx.js';
import { track } from '../../core/analytics.js';
import { ProgressBar, Select, Confetti } from '../../ui/kit.jsx';

export default function Lesson() {
  const { user, setUser } = useApp();
  const t = useT();
  const locale = useLocale();
  const teacher = teacherById(user.teacherId);

  const [phase, setPhase] = useState('setup'); // setup | run | done
  const [cfg, setCfg] = useState({ topic: 'any', level: user.level || 'A1', count: 8 });
  const [tasks, setTasks] = useState([]);
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState([]);
  const [feedback, setFeedback] = useState(null); // {correct, correctText, explanation}
  const [talking, setTalking] = useState(false);
  const [bubble, setBubble] = useState(null);
  const [emotion, flash] = useEmotion();
  const [reward, setReward] = useState(null);
  const [hasMaterials, setHasMaterials] = useState(false);
  const streak = useRef(0);

  useMemo(() => { api.listMaterials?.().then((m) => setHasMaterials(!!m?.length)).catch(() => {}); }, []);
  // e2e hook: #/lesson?auto=1 starts a lesson immediately (used by automated checks)
  useEffect(() => { if (window.location.hash.includes('auto=1')) start(); }, []); // eslint-disable-line

  const start = async () => {
    sfx.click();
    let materialTasks = null;
    if (cfg.topic === 'custom') materialTasks = await api.getMaterialTasks().catch(() => null);
    const settings = await api.getSettings().catch(() => ({}));
    setTasks(generateLesson({ level: cfg.level, topic: cfg.topic, count: cfg.count, locale, settings, materialTasks }));
    setIdx(0); setResults([]); setFeedback(null); streak.current = 0;
    track('lesson_start', { level: cfg.level, topic: cfg.topic });
    setPhase('run');
  };

  const speakReaction = (correct) => {
    const phrase = correct ? praise() : encourage();
    const shouldSpeak = correct ? (streak.current % 3 === 0 || Math.random() < 0.35) : Math.random() < 0.55;
    if (!shouldSpeak) return;
    setBubble(phrase);
    tts.speak(phrase, teacher, {
      onStart: () => setTalking(true),
      onEnd: () => { setTalking(false); setTimeout(() => setBubble(null), 1200); },
    });
  };

  const onAnswer = async (res) => {
    const task = tasks[idx];
    if (res.correct) { streak.current++; sfx.correct(); flash('happy'); }
    else { streak.current = 0; sfx.wrong(); flash('encourage'); }
    speakReaction(res.correct);
    setFeedback(res);
    setResults((r) => [...r, { type: task.type, correct: res.correct }]);
    api.addAttempt({ taskType: task.type === 'vocabRev' ? 'vocab' : task.type, topic: String(task.topic || 'any'), level: String(task.level || cfg.level), correct: res.correct, durationMs: 0 })
      .then((u) => u && setUser(u)).catch(() => {});
  };

  const next = async () => {
    sfx.click();
    setFeedback(null);
    if (idx + 1 < tasks.length) { setIdx(idx + 1); return; }
    const correct = results.filter((r) => r.correct).length;
    const xp = correct * 10, coins = 15 + correct * 2;
    const u = await api.earn({ xp, coins }).catch(() => null);
    if (u) setUser(u);
    setReward({ xp, coins, correct, total: tasks.length });
    sfx.levelUp(); flash('happy', 6000);
    setPhase('done');
  };

  const explanationOf = (task, res) => {
    if (task.explainObj) return pickL(task.explainObj, locale);
    if (res.missed?.length) return '🎯 ' + res.missed.join(', ');
    return task.explain || '';
  };

  /* ---------------- setup ---------------- */
  if (phase === 'setup') {
    const topicOpts = [
      { value: 'any', label: '🎲 ' + t('lesson.setup.anyTopic') },
      ...TOPICS.map((tp) => ({ value: tp, label: t('common.topic.' + tp) })),
      ...(hasMaterials ? [{ value: 'custom', label: '📄 ' + t('lesson.setup.custom') }] : []),
    ];
    return (
      <div className="max-w-xl mx-auto">
        <h1 className="h1 mb-6">📖 {t('lesson.setup.title')}</h1>
        <div className="card p-6 space-y-5">
          <div>
            <div className="label mb-1.5">{t('lesson.setup.topic')}</div>
            <Select value={cfg.topic} onChange={(v) => setCfg({ ...cfg, topic: v })} options={topicOpts} />
          </div>
          <div>
            <div className="label mb-1.5">{t('lesson.setup.level')}</div>
            <div className="grid grid-cols-4 gap-2">
              {LEVELS.map((l) => (
                <button key={l} onClick={() => setCfg({ ...cfg, level: l })}
                  className={`btn !py-2 ${cfg.level === l ? 'btn-primary' : 'btn-ghost'}`}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="label mb-1.5">{t('lesson.setup.length')}</div>
            <div className="grid grid-cols-3 gap-2">
              {[[5, t('lesson.setup.short')], [8, t('lesson.setup.normal')], [12, t('lesson.setup.long')]].map(([n, label]) => (
                <button key={n} onClick={() => setCfg({ ...cfg, count: n })}
                  className={`btn !py-2 text-sm ${cfg.count === n ? 'btn-primary' : 'btn-ghost'}`}>{label}</button>
              ))}
            </div>
          </div>
          <button className="btn-primary w-full text-lg" onClick={start}>🚀 {t('lesson.setup.start')}</button>
        </div>
      </div>
    );
  }

  /* ---------------- results ---------------- */
  if (phase === 'done') {
    return (
      <div className="max-w-lg mx-auto text-center">
        <Confetti burst />
        <div className="w-44 mx-auto"><Avatar teacher={teacher} emotion="happy" /></div>
        <h1 className="h1 mt-4">🎉 {t('lesson.results.title')}</h1>
        <div className="card p-6 mt-5 grid grid-cols-3 gap-3">
          <div><div className="text-3xl font-black text-primary">{Math.round((reward.correct / reward.total) * 100)}%</div><div className="label">{t('lesson.results.accuracy')}</div></div>
          <div><div className="text-3xl font-black text-violet-500">+{reward.xp}</div><div className="label">{t('lesson.results.xp')}</div></div>
          <div><div className="text-3xl font-black text-amber-500">+{reward.coins}</div><div className="label">{t('lesson.results.coins')}</div></div>
        </div>
        <div className="flex gap-3 mt-6">
          <button className="btn-primary flex-1" onClick={() => setPhase('setup')}>🔁 {t('lesson.results.again')}</button>
          <Link to="/" className="btn-ghost flex-1">🏠 {t('lesson.results.home')}</Link>
        </div>
      </div>
    );
  }

  /* ---------------- running ---------------- */
  const task = tasks[idx];
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <Link to="/" className="text-2xl" title={t('common.back')}>✖️</Link>
        <ProgressBar value={(idx + (feedback ? 1 : 0)) / tasks.length} className="flex-1" />
        <span className="font-black text-sm text-ink/50 whitespace-nowrap">{t('lesson.progress', { n: idx + 1, total: tasks.length })}</span>
      </div>

      <div className="grid md:grid-cols-[180px_1fr] gap-5 items-start">
        {/* Live teacher */}
        <div className="hidden md:block sticky top-4">
          <Avatar teacher={teacher} talking={talking} emotion={emotion} frame={user.frame} />
          {bubble && <SpeechBubble className="mt-3 text-sm">{bubble}</SpeechBubble>}
        </div>

        <div>
          <div className="md:hidden flex items-center gap-3 mb-3">
            <div className="w-16 shrink-0"><Avatar teacher={teacher} talking={talking} emotion={emotion} rounded="rounded-2xl" /></div>
            {bubble && <SpeechBubble className="text-xs flex-1">{bubble}</SpeechBubble>}
          </div>

          <TaskView key={task.id} task={task} teacher={teacher} onAnswer={onAnswer} disabled={!!feedback} />

          {feedback && (
            <div className={`card p-5 mt-4 anim-pop border-2 ${feedback.correct ? '!border-emerald-400 bg-emerald-50' : '!border-rose-300 bg-rose-50'}`}
              style={{ background: undefined }}>
              <div className={`font-black text-lg ${feedback.correct ? 'text-emerald-600' : 'text-rose-500'}`}>
                {feedback.correct ? '✅ ' + t('task.correct') : '❌ ' + t('task.wrong')}
              </div>
              {!feedback.correct && feedback.correctText && (
                <div className="mt-1 font-bold">{t('task.answerWas')} <span className="text-primary">{feedback.correctText}</span></div>
              )}
              {explanationOf(task, feedback) && (
                <div className="mt-1.5 text-sm font-semibold text-ink/60">💡 {explanationOf(task, feedback)}</div>
              )}
              <button className="btn-primary w-full mt-4" onClick={next}>
                {idx + 1 < tasks.length ? t('lesson.next') + ' →' : '🏁 ' + t('lesson.finish')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
