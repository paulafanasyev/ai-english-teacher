import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../core/store.js';
import { PLANS, DOCS, findProgram } from './fop.js';

const Doc = ({ k }) => (
  <a href={DOCS[k].url} target="_blank" rel="noreferrer" className="underline font-bold text-primary">{DOCS[k].title}</a>
);

export default function Programs() {
  const { user } = useApp();
  const nav = useNavigate();
  const [level, setLevel] = useState('ООО');
  const plan = PLANS[level];
  const [grade, setGrade] = useState(5);
  const [subject, setSubject] = useState('Математика');
  const g = plan.grades.includes(grade) ? grade : plan.grades[0];
  const gi = plan.grades.indexOf(g);
  const rows = plan.rows.filter(([, h]) => h[gi] > 0);
  const current = rows.find(([s]) => s === subject) ? subject : null;
  const program = current ? findProgram(current, g) : null;
  const canPlan = user.role === 'TEACHER' || user.role === 'ADMIN';

  const pickLevel = (l) => { setLevel(l); setGrade(PLANS[l].grades[0]); setSubject(null); };
  const tab = (on) => `rounded-full px-4 py-1.5 text-sm font-black transition ${on ? 'bg-primary text-white' : 'bg-soft text-ink/70'}`;

  return (
    <div className="space-y-5">
      <div>
        <div className="h2">📋 Федеральные программы</div>
        <p className="text-sm font-semibold text-ink/60 mt-1">
          Учебный план и содержание обучения по официальным документам Минпросвещения России. Сейчас загружены полные программы по математике (5–9) и английскому языку (2–9), остальные предметы добавляются.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.keys(PLANS).map((l) => (
          <button key={l} className={tab(l === level)} onClick={() => pickLevel(l)}>{l} · {PLANS[l].label}</button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Класс">
        {plan.grades.map((x) => (
          <button key={x} className={tab(x === g)} onClick={() => { setGrade(x); }} aria-pressed={x === g}>{x} класс</button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,280px)_1fr]">
        <div className="card p-3">
          <div className="text-xs font-black uppercase text-ink/50 px-2 pb-2">Учебный план, {g} класс (ч/нед.)</div>
          <ul className="space-y-1">
            {rows.map(([s, h]) => {
              const has = !!findProgram(s, g);
              return (
                <li key={s}>
                  <button onClick={() => setSubject(s)} className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold transition ${current === s ? 'bg-primary text-white' : 'hover:bg-soft'}`}>
                    <span>{has ? '📘 ' : ''}{s}</span><span className="shrink-0 opacity-70">{h[gi]}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-2 border-t border-black/5 px-2 pt-2 text-xs font-bold text-ink/60">
            Итого обязательная часть: {plan.total[gi]} ч · максимум с частью школы: {plan.max[gi]} ч
          </div>
          {plan.note && <p className="px-2 pt-2 text-[11px] font-semibold text-ink/50">{plan.note}</p>}
          <p className="px-2 pt-2 text-[11px] font-semibold text-ink/50">📘 — полная программа загружена. Источник: <Doc k={plan.doc} />.</p>
        </div>

        <div className="card p-5 min-w-0">
          {!current && <p className="font-semibold text-ink/60">Выберите предмет слева.</p>}
          {current && !program && (
            <div className="space-y-2">
              <div className="h3 font-black text-lg">{current}, {g} класс</div>
              <p className="font-semibold text-ink/70">По учебному плану: {rows.find(([s]) => s === current)[1][gi]} ч в неделю.</p>
              <p className="text-sm font-semibold text-ink/60">Полный текст программы этого предмета в Репетитор пока не загружен. Официальный документ: <Doc k="edsoo" />.</p>
            </div>
          )}
          {program && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-black text-lg">{program.subject}, {program.grade} класс</div>
                  <div className="text-sm font-bold text-ink/60">{program.hours_per_week} ч в неделю · {program.hours_per_year} ч в год · {program.source_doc}</div>
                </div>
                {canPlan && <button className="btn-primary !py-2 text-sm" onClick={() => nav(`/planner?p=${program.id}`)}>🗓️ Составить план уроков</button>}
              </div>
              {program.sections.map((s) => (
                <details key={s.title} className="rounded-2xl bg-soft/60 p-3" open>
                  <summary className="cursor-pointer font-black">{s.title}</summary>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm font-semibold text-ink/80">
                    {s.topics.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </details>
              ))}
              {program.results?.length > 0 && (
                <details className="rounded-2xl bg-soft/60 p-3">
                  <summary className="cursor-pointer font-black">Планируемые предметные результаты</summary>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm font-semibold text-ink/80">
                    {program.results.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </details>
              )}
              <a href={program.source_url} target="_blank" rel="noreferrer" className="inline-block text-sm font-bold text-primary underline">Открыть официальный источник</a>
            </div>
          )}
        </div>
      </div>

      <div className="card p-5 space-y-2 text-sm font-semibold text-ink/70">
        <div className="font-black text-ink">Документы</div>
        <p>• <Doc k="noo" /></p>
        <p>• <Doc k="ooo" /></p>
        <p>• Для детей с ОВЗ и домашнего обучения: <Doc k="faopNoo" />; <Doc k="faopOoo" />. В Репетиторе есть режим доступности (кнопка ♿ в меню).</p>
        <p>• <Doc k="fpu" />. Учебники из перечня принадлежат издательствам, их тексты здесь не публикуются.</p>
      </div>
    </div>
  );
}
