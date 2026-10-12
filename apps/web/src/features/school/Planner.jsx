import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../../core/store.js';
import { PROGRAMS, buildPlan, defaultDays, schoolYearStart, toCSV } from './fop.js';
import { school } from './schoolStore.js';

const WD = [[1, 'Пн'], [2, 'Вт'], [3, 'Ср'], [4, 'Чт'], [5, 'Пт'], [6, 'Сб']];

export default function Planner() {
  const { user } = useApp();
  const [params] = useSearchParams();
  const [pid, setPid] = useState(() => (PROGRAMS.some((p) => p.id === params.get('p')) ? params.get('p') : PROGRAMS[0].id));
  const program = PROGRAMS.find((p) => p.id === pid) || PROGRAMS[0];
  const [start, setStart] = useState(schoolYearStart());
  const [days, setDays] = useState(defaultDays(program.hours_per_week));
  const [secs, setSecs] = useState(program.sections.map((_, i) => i));
  const [lessons, setLessons] = useState([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const s = school.getPlan(user.id, program.id);
    setStart(s?.start || schoolYearStart());
    setDays(s?.days || defaultDays(program.hours_per_week));
    setSecs(s?.secs || program.sections.map((_, i) => i));
    setLessons(s?.lessons || []);
    setMsg('');
  }, [program.id, user.id]);

  const toggle = (setter) => (v) => setter((x) => (x.includes(v) ? x.filter((y) => y !== v) : [...x, v].sort((a, b) => a - b)));
  const toggleDay = toggle(setDays);
  const toggleSec = toggle(setSecs);

  const generate = () => {
    if (!days.length || !secs.length) { setMsg('Выберите дни уроков и хотя бы один раздел.'); return; }
    setLessons(buildPlan(program, { start, days, secs }));
    setMsg('План составлен. Проверьте даты каникул и праздников и сохраните.');
  };
  const savePlan = () => { school.savePlan(user.id, program.id, { start, days, secs, lessons }); setMsg('План сохранён в этом браузере.'); };
  const exportCsv = () => {
    const blob = new Blob([toCSV(lessons)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `КТП_${program.subject}_${program.grade}_класс.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  };
  const edit = (i, k, v) => setLessons((ls) => ls.map((l, j) => (j === i ? { ...l, [k]: v } : l)));

  return (
    <div className="space-y-5">
      <div>
        <div className="h2">🗓️ План уроков (КТП)</div>
        <p className="text-sm font-semibold text-ink/60 mt-1">Календарно-тематическое планирование по темам федеральной программы. Часы распределяются по темам равномерно, дальше всё можно править вручную.</p>
      </div>

      <div className="card p-5 space-y-4">
        <label className="block">
          <span className="text-xs font-black uppercase text-ink/50">Предмет и класс</span>
          <select className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 font-bold" value={pid} onChange={(e) => setPid(e.target.value)}>
            {PROGRAMS.map((p) => <option key={p.id} value={p.id}>{p.subject}, {p.grade} класс ({p.hours_per_year} ч)</option>)}
          </select>
        </label>
        <div className="flex flex-wrap items-end gap-4">
          <label>
            <span className="text-xs font-black uppercase text-ink/50">Начало</span>
            <input type="date" className="mt-1 block rounded-xl border border-black/10 bg-white px-3 py-2 font-bold" value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <div>
            <span className="text-xs font-black uppercase text-ink/50">Дни уроков ({program.hours_per_week} ч/нед.)</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {WD.map(([d, l]) => (
                <button key={d} type="button" aria-pressed={days.includes(d)} onClick={() => toggleDay(d)} className={`rounded-xl px-3 py-2 text-sm font-black ${days.includes(d) ? 'bg-primary text-white' : 'bg-soft text-ink/60'}`}>{l}</button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <span className="text-xs font-black uppercase text-ink/50">Разделы программы</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {program.sections.map((s, i) => (
              <label key={s.title} className="flex items-center gap-2 rounded-xl bg-soft px-3 py-1.5 text-sm font-bold">
                <input type="checkbox" checked={secs.includes(i)} onChange={() => toggleSec(i)} />{s.title}
              </label>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary !py-2" onClick={generate}>✨ Составить план</button>
          <button className="btn-ghost !py-2" onClick={savePlan} disabled={!lessons.length}>💾 Сохранить</button>
          <button className="btn-ghost !py-2" onClick={exportCsv} disabled={!lessons.length}>⬇️ Скачать CSV (Excel)</button>
        </div>
        {msg && <p className="text-sm font-bold text-primary" role="status">{msg}</p>}
      </div>

      {lessons.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="bg-soft text-left text-xs font-black uppercase text-ink/60">
                <th className="p-2 w-10">№</th><th className="p-2 w-36">Дата</th><th className="p-2">Тема урока</th><th className="p-2 w-64">Домашнее задание</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((l, i) => (
                <tr key={l.n} className="border-t border-black/5 align-top">
                  <td className="p-2 font-black text-ink/50">{l.n}</td>
                  <td className="p-2"><input type="date" aria-label={`Дата урока ${l.n}`} className="w-full rounded-lg border border-black/10 bg-white px-2 py-1 font-semibold" value={l.date} onChange={(e) => edit(i, 'date', e.target.value)} /></td>
                  <td className="p-2"><div className="text-[11px] font-black uppercase text-ink/40">{l.section}</div><div className="font-semibold">{l.topic}</div></td>
                  <td className="p-2"><input aria-label={`Домашнее задание к уроку ${l.n}`} className="w-full rounded-lg border border-black/10 bg-white px-2 py-1 font-semibold" value={l.hw} placeholder="№, страница, задание" onChange={(e) => edit(i, 'hw', e.target.value)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
