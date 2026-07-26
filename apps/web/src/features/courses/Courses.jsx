import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, useT, useLocale } from '../../core/store.js';
import { api } from '../../core/api.js';
import { pickL } from '../../i18n/index.js';
import { sfx } from '../../audio/sfx.js';
import { COURSES } from '../../data/courses.js';

const STATUS_CHIP = {
  full: '!bg-emerald-100 text-emerald-700',
  external: '!bg-sky-100 text-sky-700',
  course: '!bg-violet-100 text-violet-700',
  starter: '!bg-violet-100 text-violet-700',
  soon: '!bg-black/5 text-ink/40',
};

// ---- progress persistence (per course → list of completed unit ids) ----
const KEY = (id) => `aet_course_${id}`;
function loadDone(id) {
  try { return JSON.parse(localStorage.getItem(KEY(id)) || '[]'); } catch { return []; }
}
function saveDone(id, arr) {
  try { localStorage.setItem(KEY(id), JSON.stringify(arr)); } catch { /* noop */ }
}

const shuffle = (a) => a.slice().sort(() => 0.5 - Math.random());
function buildQuiz(pack) {
  return shuffle(pack).slice(0, Math.min(6, pack.length)).map((item) => {
    const distract = shuffle(pack.filter((x) => x.w !== item.w)).slice(0, 2);
    return { item, options: shuffle([item, ...distract]) };
  });
}

export default function Courses() {
  const t = useT();
  const locale = useLocale();
  const nav = useNavigate();
  const [active, setActive] = useState(null); // course being studied

  if (active) return <Course course={active} onBack={() => setActive(null)} />;

  const open = (c) => {
    sfx.click();
    if (c.status === 'full') nav(c.route || '/');
    else if (c.status === 'external') window.open(c.url, '_blank', 'noopener,noreferrer');
    else if (c.status === 'course' || c.status === 'starter') setActive(c);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="h1">📚 {t('courses.title')}</h1>
        <p className="font-semibold text-ink/55 mt-1">{t('courses.subtitle')}</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {COURSES.map((c) => (
          <button key={c.id} disabled={c.status === 'soon'} onClick={() => open(c)}
            className={`card p-5 text-left transition ${c.status === 'soon' ? 'opacity-60 cursor-default' : 'hover:-translate-y-1'}`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{c.icon}</span>
              <div className="min-w-0">
                <div className="font-black leading-tight">{pickL(c.name, locale)}</div>
                <span className={`chip text-[10px] mt-1 ${STATUS_CHIP[c.status]}`}>{t('courses.status.' + c.status)}</span>
              </div>
            </div>
            <div className="text-xs font-semibold text-ink/50 mt-3">{pickL(c.tag, locale)}</div>
          </button>
        ))}
      </div>
      <p className="text-xs font-semibold text-ink/40">{t('courses.note')}</p>
    </div>
  );
}

// ---------- Course: list of units with progress ----------
function Course({ course, onBack }) {
  const t = useT();
  const locale = useLocale();
  const units = course.units || [];
  const [done, setDone] = useState(() => loadDone(course.id));
  const [unit, setUnit] = useState(null);

  if (unit) {
    const idx = units.findIndex((u) => u.id === unit.id);
    return (
      <Unit
        unit={unit}
        onBack={() => setUnit(null)}
        onComplete={() => {
          const nd = done.includes(unit.id) ? done : [...done, unit.id];
          setDone(nd); saveDone(course.id, nd);
        }}
        onNext={units[idx + 1] ? () => setUnit(units[idx + 1]) : null}
      />
    );
  }

  const pct = units.length ? Math.round((done.length / units.length) * 100) : 0;

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <button className="btn-ghost !py-1.5 text-sm" onClick={onBack}>← {t('exam.back')}</button>
      <div>
        <h1 className="h2">{course.icon} {pickL(course.name, locale)}</h1>
        <p className="font-semibold text-ink/55 mt-1">{pickL(course.tag, locale)}</p>
      </div>

      {/* progress */}
      <div className="card p-4">
        <div className="flex items-center justify-between text-sm font-bold mb-2">
          <span>{t('courses.progress')}</span>
          <span className="text-primary">{done.length}/{units.length} · {pct}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-black/10 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all" style={{ width: pct + '%' }} />
        </div>
      </div>

      {/* unit list */}
      <div className="space-y-2">
        {units.map((u, i) => {
          const isDone = done.includes(u.id);
          return (
            <button key={u.id} onClick={() => { sfx.click(); setUnit(u); }}
              className="card p-4 w-full flex items-center gap-3 text-left hover:-translate-y-0.5 transition">
              <span className="text-2xl">{u.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="font-black truncate">{t('courses.unit')} {i + 1} · {pickL(u.title, locale)}</div>
                <div className="text-xs font-semibold text-ink/50">{u.pack.length} {t('exam.words')} · {u.phrases.length} {t('courses.phrases').toLowerCase()}</div>
              </div>
              {isDone
                ? <span className="chip !bg-emerald-100 text-emerald-700 text-xs font-black">✓ {t('courses.completed')}</span>
                : <span className="text-ink/30 text-xl">›</span>}
            </button>
          );
        })}
      </div>
      <p className="text-xs font-semibold text-ink/40">{t('courses.doneNote')}</p>
    </div>
  );
}

// ---------- Unit: words / phrases / quiz ----------
function Unit({ unit, onBack, onComplete, onNext }) {
  const t = useT();
  const locale = useLocale();
  const { setUser } = useApp();
  const tr = (it) => (locale === 'ru' ? it.ru : locale === 'vi' ? (it.vi || it.en) : it.en);

  const [tab, setTab] = useState('words'); // words | phrases | quiz
  const quiz = useMemo(() => buildQuiz(unit.pack), [unit]);
  const [qi, setQi] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [finished, setFinished] = useState(false);

  const answer = async (opt, q) => {
    if (locked) return; setLocked(true);
    if (opt.w === q.item.w) { setScore((s) => s + 1); sfx.correct?.(); try { setUser(await api.earn({ xp: 5, coins: 2 })); } catch {} }
    else sfx.wrong?.();
    setTimeout(() => {
      if (qi + 1 >= quiz.length) { setFinished(true); onComplete?.(); sfx.levelUp?.(); }
      else { setQi(qi + 1); setLocked(false); }
    }, 600);
  };
  const restartQuiz = () => { setQi(0); setScore(0); setLocked(false); setFinished(false); };

  const TABS = [
    { id: 'words', label: t('courses.words'), icon: '🔤' },
    { id: 'phrases', label: t('courses.phrases'), icon: '💬' },
    { id: 'quiz', label: t('courses.quiz'), icon: '🎯' },
  ];

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <button className="btn-ghost !py-1.5 text-sm" onClick={onBack}>← {t('courses.units')}</button>
      <h1 className="h2">{unit.emoji} {pickL(unit.title, locale)}</h1>

      <div className="flex gap-2">
        {TABS.map((tb) => (
          <button key={tb.id} onClick={() => { sfx.click(); setTab(tb.id); }}
            className={`btn !py-2 ${tab === tb.id ? 'btn-primary' : 'btn-ghost'}`}>{tb.icon} {tb.label}</button>
        ))}
      </div>

      {tab === 'words' && (
        <div className="grid grid-cols-2 gap-2">
          {unit.pack.map((it) => (
            <div key={it.w} className="card p-3 flex items-center gap-2">
              <span className="text-2xl">{it.emoji}</span>
              <div className="min-w-0"><div className="font-black truncate">{it.w}</div><div className="text-xs font-semibold text-ink/55">{tr(it)}</div></div>
            </div>
          ))}
        </div>
      )}

      {tab === 'phrases' && (
        <div className="space-y-2">
          {unit.phrases.map((p) => (
            <div key={p.src} className="card p-4">
              <div className="font-black">{p.src}</div>
              <div className="text-sm font-semibold text-ink/55 mt-0.5">{locale === 'ru' ? p.ru : locale === 'vi' ? (p.vi || p.en) : p.en}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'quiz' && (
        <>
          {!finished && quiz[qi] && (
            <div className="card p-6 text-center">
              <div className="text-xs font-black text-ink/40 mb-2">{qi + 1} / {quiz.length}</div>
              <div className="text-5xl mb-1">{quiz[qi].item.emoji}</div>
              <div className="text-2xl font-black mb-4">{quiz[qi].item.w}</div>
              <div className="grid gap-2">
                {quiz[qi].options.map((o) => (
                  <button key={o.w} disabled={locked} onClick={() => answer(o, quiz[qi])}
                    className={`btn-ghost ${locked && o.w === quiz[qi].item.w ? '!bg-emerald-100 !text-emerald-700' : ''}`}>{tr(o)}</button>
                ))}
              </div>
            </div>
          )}
          {finished && (
            <div className="card p-8 text-center">
              <div className="text-5xl">{score >= Math.ceil(quiz.length * 0.8) ? '🏆' : '🎉'}</div>
              <div className="h2 mt-2">{score} / {quiz.length}</div>
              <p className="font-semibold text-ink/55 mt-1">✓ {t('courses.completed')}</p>
              <div className="flex gap-2 mt-4">
                <button className="btn-ghost flex-1" onClick={restartQuiz}>↻ {t('courses.review')}</button>
                {onNext && <button className="btn-primary flex-1" onClick={onNext}>{t('courses.next')} →</button>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
