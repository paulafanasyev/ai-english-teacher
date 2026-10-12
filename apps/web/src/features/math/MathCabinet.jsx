import { useEffect, useMemo, useState } from 'react';
import { useLocale } from '../../core/store.js';
import { pickL } from '../../i18n/index.js';
import { ProgressBar, Select } from '../../ui/kit.jsx';
import { sfx } from '../../audio/sfx.js';
import { TOPICS } from './problems.js';
import { topicTitle } from './classMath.js';
import { mathStore, mathCabinetAvailable, DB_STORAGE_KEY } from './mathStore.js';

const T = {
  title: { ru: 'Математика', en: 'Math' },
  serverSoon: { ru: 'Статистика по математике пока работает в демо-режиме. Серверная версия будет следующим шагом.', en: 'Math stats work in demo mode for now. Server support comes next.' },
  student: { ru: 'Ученик', en: 'Student' },
  acc: { ru: 'Верно', en: 'Correct' },
  hints: { ru: 'Подсказок на задачу', en: 'Hints per problem' },
  weak: { ru: 'Слабая тема', en: 'Weak topic' },
  none: { ru: 'нет', en: 'none' },
  noData: { ru: 'нет решений', en: 'no attempts' },
  classWeak: { ru: 'Слабее всего у класса', en: 'Class weakest topic' },
  assign: { ru: 'Выдать домашку', en: 'Assign homework' },
  grade: { ru: 'Класс', en: 'Grade' },
  topic: { ru: 'Тема', en: 'Topic' },
  any: { ru: '🎲 Разные', en: '🎲 Mixed' },
  count: { ru: 'Задач', en: 'Problems' },
  give: { ru: 'Выдать классу', en: 'Assign to class' },
  given: { ru: 'Задание выдано, ученики увидят его в разделе «Математика»', en: 'Assigned: students will see it in Math' },
  list: { ru: 'Выданные задания', en: 'Assignments' },
  empty: { ru: 'Заданий пока нет', en: 'No assignments yet' },
  done: { ru: 'сдали', en: 'done' },
  hintsShort: { ru: 'подск.', en: 'hints' },
  del: { ru: 'Удалить задание', en: 'Delete assignment' },
};

const pct = (x) => Math.round(x * 100) + '%';

export default function MathCabinet({ classId }) {
  const locale = useLocale();
  const tr = (k) => pickL(T[k], locale);
  const [tick, setTick] = useState(0);
  const [form, setForm] = useState({ grade: 7, topic: 'any', count: 6 });
  const [msg, setMsg] = useState(null);
  const available = mathCabinetAvailable();

  const stats = useMemo(() => (available && classId ? mathStore.classStats(classId) : null), [classId, tick, available]);
  const assignments = useMemo(() => (available && classId ? mathStore.classAssignments(classId) : []), [classId, tick, available]);
  useEffect(() => { setMsg(null); }, [classId]);
  // Refresh when a student finishes homework in another tab of the same browser.
  useEffect(() => {
    const on = (e) => { if (e.key === DB_STORAGE_KEY) setTick((x) => x + 1); };
    window.addEventListener('storage', on);
    return () => window.removeEventListener('storage', on);
  }, []);

  if (!available) return <div className="card p-5 mb-6 font-semibold text-ink/60">🧮 {tr('serverSoon')}</div>;
  if (!stats) return null;

  const tTitle = (id) => (id === 'any' ? tr('any') : pickL(topicTitle(id), locale));
  const classWeak = Object.entries(stats.class.byTopic || {}).filter(([, v]) => v.total >= 5)
    .map(([k, v]) => [k, v.correct / v.total]).sort((a, b) => a[1] - b[1])[0];
  const topicOpts = [{ value: 'any', label: tr('any') }, ...(TOPICS[form.grade] || []).map((x) => ({ value: x.id, label: pickL(x.title, locale) }))];

  const give = (e) => {
    e.preventDefault();
    try {
      mathStore.assign({ classId, ...form });
      sfx.levelUp(); setMsg(tr('given')); setTick((x) => x + 1);
      setTimeout(() => setMsg(null), 2500);
    } catch { sfx.wrong(); }
  };
  const remove = (id) => { sfx.wrong(); try { mathStore.remove(id); } catch {} setTick((x) => x + 1); };

  return (
    <section className="mb-6" aria-label={tr('title')}>
      <div className="flex items-center gap-3 mb-2">
        <h2 className="h2">🧮 {tr('title')}</h2>
        {classWeak && classWeak[1] < 0.7 && (
          <span className="chip !bg-rose-100 text-rose-700 text-xs">{tr('classWeak')}: {tTitle(classWeak[0])} · {pct(classWeak[1])}</span>
        )}
      </div>

      <div className="card overflow-x-auto mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-black/5">
              {[tr('student'), tr('acc'), tr('hints'), tr('weak')].map((h) => <th key={h} className="label !text-[10px] p-3">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {stats.students.map((s) => (
              <tr key={s.id} className="border-b border-black/5 last:border-0">
                <td className="p-3 font-black">{s.name}</td>
                <td className="p-3 w-32">
                  {s.total ? (<>
                    <div className="font-bold text-xs mb-1">{pct(s.acc)} · {s.total}</div>
                    <ProgressBar value={s.acc} className="!h-1.5" />
                  </>) : <span className="text-xs font-semibold text-ink/40">{tr('noData')}</span>}
                </td>
                <td className="p-3 font-bold">{s.total ? s.avgHints.toFixed(1) : '—'}</td>
                <td className="p-3">
                  {s.weak
                    ? <span className="chip !bg-rose-100 text-rose-700 text-xs">{tTitle(s.weak)} · {pct(s.byTopic[s.weak].correct / s.byTopic[s.weak].total)}</span>
                    : <span className="text-xs font-semibold text-ink/40">{s.total ? tr('none') : '—'}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={give} className="card p-5 mb-4 space-y-3">
        <div className="font-black">📝 {tr('assign')}</div>
        <div>
          <div className="label mb-1">{tr('grade')}</div>
          <Select value={form.grade} onChange={(g) => setForm({ ...form, grade: g, topic: 'any' })} options={[5, 6, 7, 8, 9].map((g) => ({ value: g, label: String(g) }))} />
        </div>
        <div>
          <div className="label mb-1">{tr('topic')}</div>
          <Select value={form.topic} onChange={(v) => setForm({ ...form, topic: v })} options={topicOpts} />
        </div>
        <div>
          <div className="label mb-1">{tr('count')}</div>
          <Select value={form.count} onChange={(n) => setForm({ ...form, count: n })} options={[4, 6, 10].map((n) => ({ value: n, label: String(n) }))} />
        </div>
        <button type="submit" className="btn-primary">➕ {tr('give')}</button>
        {msg && <div role="status" className="chip !bg-emerald-100 text-emerald-700 text-xs">✅ {msg}</div>}
      </form>

      <div className="label mb-2">📚 {tr('list')}</div>
      <div className="space-y-2">
        {!assignments.length && <div className="card p-5 text-center font-bold text-ink/40">{tr('empty')}</div>}
        {assignments.map((a) => (
          <div key={a.id} className="card p-4">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-black truncate">{tTitle(a.topic)} · {a.grade} {tr('grade').toLowerCase()} · {a.count}</div>
                <div className="text-xs font-bold text-ink/50">{a.done}/{a.of} {tr('done')}</div>
              </div>
              <button className="text-rose-400 text-lg" aria-label={tr('del')} title={tr('del')} onClick={() => remove(a.id)}>🗑</button>
            </div>
            {a.results.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {a.results.map((r) => (
                  <span key={r.id} className="chip text-xs">{r.name}: {r.solved}/{r.total} · {r.hints} {tr('hintsShort')} · <b>{r.mark}</b></span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
