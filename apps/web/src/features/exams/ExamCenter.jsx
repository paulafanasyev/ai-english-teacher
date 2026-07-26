import { useEffect, useRef, useState } from 'react';
import { useApp, useT } from '../../core/store.js';
import { api } from '../../core/api.js';
import { teacherById } from '../../data/teachers.js';
import { tts } from '../../audio/tts.js';
import { sfx } from '../../audio/sfx.js';
import { Stat } from '../../ui/kit.jsx';
import { EXAMS, BANKS, objectiveItems, buildMock, estimate } from '../../data/exams.js';

const SEC_ICON = { reading: '📖', listening: '🎧', use: '🔤', writing: '✍️', speaking: '🎤' };

export default function ExamCenter() {
  const { user } = useApp();
  const t = useT();
  const teacher = teacherById(user.teacherId);
  const [examId, setExamId] = useState('ielts');
  const [view, setView] = useState('menu'); // menu | run | writing | speaking | result
  const [items, setItems] = useState([]);
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [locked, setLocked] = useState(false);
  const [isMock, setIsMock] = useState(false);
  const [time, setTime] = useState(0);
  const [result, setResult] = useState(null);
  const timer = useRef(null);
  const exam = EXAMS[examId];

  useEffect(() => () => clearInterval(timer.current), []);

  const startSection = (section) => {
    if (section === 'writing') { setView('writing'); return; }
    if (section === 'speaking') { setView('speaking'); return; }
    const list = objectiveItems(section);
    if (!list.length) return;
    sfx.click(); setItems(list); setIdx(0); setCorrect(0); setLocked(false); setIsMock(false); setView('run');
  };
  const startMock = () => {
    sfx.click(); const list = buildMock(20);
    setItems(list); setIdx(0); setCorrect(0); setLocked(false); setIsMock(true); setView('run');
    setTime(1200); clearInterval(timer.current);
    timer.current = setInterval(() => setTime((s) => { if (s <= 1) { clearInterval(timer.current); finish(0, true); return 0; } return s - 1; }), 1000);
  };

  const cur = items[idx];
  const answer = async (opt) => {
    if (locked) return; setLocked(true);
    const ok = opt === cur.answer;
    if (ok) { setCorrect((c) => c + 1); sfx.correct?.(); } else sfx.wrong?.();
    api.addAttempt({ taskType: 'exam', topic: examId, level: user.level, correct: ok, durationMs: 0 }).catch(() => {});
    setTimeout(() => {
      if (idx + 1 >= items.length) finish(ok ? 1 : 0);
      else { setIdx(idx + 1); setLocked(false); }
    }, 700);
  };
  const finish = (lastDelta = 0, timeUp = false) => {
    clearInterval(timer.current);
    const total = items.length || 1;
    const score = correct + lastDelta; // correct already includes current if set; guard
    const finalCorrect = Math.min(total, score);
    const acc = finalCorrect / total;
    if (isMock) {
      const est = estimate(examId, acc);
      const xp = Math.round(acc * 120), coins = Math.round(acc * 60);
      api.earn({ xp, coins }).catch(() => {});
      setResult({ acc, correct: finalCorrect, total, est, xp, coins, timeUp });
      sfx.levelUp?.();
    } else {
      setResult({ acc, correct: finalCorrect, total, est: null });
    }
    setView('result');
  };

  // ---------- render ----------
  if (view === 'menu') {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="h1">📝 {t('exam.title')}</h1>
          <p className="font-semibold text-ink/55 mt-1">{t('exam.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          {Object.values(EXAMS).map((e) => (
            <button key={e.id} onClick={() => { sfx.click(); setExamId(e.id); }}
              className={`btn !py-2 ${examId === e.id ? 'btn-primary' : 'btn-ghost'}`}>{e.name}</button>
          ))}
        </div>
        <div className="card p-4 flex items-center gap-3">
          <span className="text-2xl">🎓</span>
          <div><div className="font-black">{exam.name} · <span className="text-ink/60">{exam.scale}</span></div>
            <div className="text-xs font-semibold text-ink/50">{t('exam.note')}</div></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {exam.sections.map((s) => (
            <button key={s} onClick={() => startSection(s)} className="card p-4 text-left hover:-translate-y-1 transition">
              <div className="text-2xl">{SEC_ICON[s]}</div>
              <div className="font-black mt-1">{t('exam.sec.' + s)}</div>
              <div className="text-xs font-semibold text-ink/45">{t('exam.practice')}</div>
            </button>
          ))}
        </div>
        <button onClick={startMock} className="btn-primary w-full !py-3">🎯 {t('exam.mock')} · {exam.scale}</button>
      </div>
    );
  }

  if (view === 'run' && cur) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <span className="chip">{exam.name}{isMock ? ' · ' + t('exam.mock') : ''}</span>
          <span className="font-black text-sm">{idx + 1} / {items.length}{isMock ? ` · ⏱ ${String(Math.floor(time / 60)).padStart(1, '0')}:${String(time % 60).padStart(2, '0')}` : ''}</span>
        </div>
        {cur.passage && <div className="card p-4 mb-3 text-sm font-semibold leading-relaxed">{cur.passage}</div>}
        {cur.transcript && (
          <div className="card p-4 mb-3 flex items-center gap-3">
            <button className="btn-primary !py-2" onClick={() => tts.speak(cur.transcript, teacher)}>▶ {t('exam.play')}</button>
            <span className="text-xs font-semibold text-ink/45">{t('exam.listenHint')}</span>
          </div>
        )}
        <div className="card p-5">
          <div className="font-black text-lg mb-4">{cur.q}</div>
          <div className="grid gap-2">
            {cur.options.map((o) => (
              <button key={o} disabled={locked} onClick={() => answer(o)}
                className={`btn-ghost !justify-start text-left ${locked && o === cur.answer ? '!bg-emerald-100 !text-emerald-700' : ''}`}>{o}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'writing') {
    return <Writing examId={examId} t={t} onBack={() => setView('menu')} />;
  }
  if (view === 'speaking') {
    return <Speaking examId={examId} t={t} teacher={teacher} onBack={() => setView('menu')} />;
  }

  if (view === 'result') {
    return (
      <div className="max-w-lg mx-auto text-center card p-8">
        <div className="text-5xl">{result.acc >= 0.7 ? '🏆' : result.acc >= 0.5 ? '🎉' : '💪'}</div>
        {result.est
          ? <>
              <h2 className="h1 mt-3">{result.est.headline}</h2>
              <p className="font-bold text-ink/60">CEFR ≈ {result.est.cefr}</p>
            </>
          : <h2 className="h2 mt-3">{result.correct} / {result.total}</h2>}
        <div className="grid grid-cols-3 gap-2 my-5">
          <Stat icon="✅" label={t('exam.correct')} value={`${result.correct}/${result.total}`} />
          <Stat icon="🎯" label={t('home.accuracy')} value={Math.round(result.acc * 100) + '%'} />
          {result.est && <Stat icon="⭐" label="XP" value={'+' + result.xp} />}
        </div>
        <p className="text-xs font-semibold text-ink/45 mb-4">{t('exam.note')}</p>
        <div className="flex gap-2">
          <button className="btn-primary flex-1" onClick={() => setView('menu')}>↩ {t('exam.back')}</button>
        </div>
      </div>
    );
  }
  return <div className="font-bold text-ink/40">{t('common.loading')}</div>;
}

function Writing({ examId, t, onBack }) {
  const prompts = BANKS.WRITING[examId];
  const [pi, setPi] = useState(0);
  const [text, setText] = useState('');
  const p = prompts[pi];
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const ok = words >= p.minWords;
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <button className="btn-ghost !py-1.5 text-sm" onClick={onBack}>← {t('exam.back')}</button>
      <h1 className="h2">✍️ {t('exam.sec.writing')} · {examId.toUpperCase()}</h1>
      <div className="flex gap-2">{prompts.map((_, i) => (
        <button key={i} onClick={() => { setPi(i); setText(''); }} className={`chip cursor-pointer ${i === pi ? '!bg-primary text-white' : ''}`}>#{i + 1}</button>
      ))}</div>
      <div className="card p-4 font-semibold">{p.task}</div>
      <textarea className="input min-h-[220px]" placeholder={t('exam.writePlaceholder')} value={text} onChange={(e) => setText(e.target.value)} />
      <div className="flex items-center justify-between text-sm font-bold">
        <span className={ok ? 'text-emerald-600' : 'text-ink/50'}>{words} / {p.minWords} {t('exam.words')} {ok ? '✅' : ''}</span>
      </div>
      <div className="card p-4">
        <div className="label mb-2">{t('exam.rubric')}</div>
        <ul className="text-sm font-semibold text-ink/70 space-y-1 list-disc pl-5">
          <li>{t('exam.r1')}</li><li>{t('exam.r2')}</li><li>{t('exam.r3')}</li><li>{t('exam.r4')}</li>
        </ul>
      </div>
    </div>
  );
}

function Speaking({ examId, t, teacher, onBack }) {
  const prompts = BANKS.SPEAKING[examId];
  const [pi, setPi] = useState(0);
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <button className="btn-ghost !py-1.5 text-sm" onClick={onBack}>← {t('exam.back')}</button>
      <h1 className="h2">🎤 {t('exam.sec.speaking')} · {examId.toUpperCase()}</h1>
      <div className="flex gap-2">{prompts.map((_, i) => (
        <button key={i} onClick={() => setPi(i)} className={`chip cursor-pointer ${i === pi ? '!bg-primary text-white' : ''}`}>#{i + 1}</button>
      ))}</div>
      <div className="card p-5 font-semibold text-lg">{prompts[pi]}</div>
      <div className="flex gap-2">
        <button className="btn-primary" onClick={() => tts.speak(prompts[pi], teacher)}>▶ {t('exam.play')}</button>
      </div>
      <p className="text-sm font-semibold text-ink/50">{t('exam.speakHint')}</p>
    </div>
  );
}
