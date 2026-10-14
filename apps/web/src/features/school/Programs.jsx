import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../core/store.js';
import { PLANS, DOCS, findProgram, findPrograms, isSampleResults, fmtHours } from './fop.js';
import RuOnly from './RuOnly.jsx';

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
  const [mod, setMod] = useState(0);
  const g = plan.grades.includes(grade) ? grade : plan.grades[0];
  const gi = plan.grades.indexOf(g);
  const rows = plan.rows.filter(([, h]) => h[gi] > 0);
  const current = rows.find(([s]) => s === subject) ? subject : null;
  const programs = current ? findPrograms(current, g) : [];
  const program = programs[mod] || programs[0] || null;
  const canPlan = user.role === 'TEACHER' || user.role === 'ADMIN';

  const pickLevel = (l) => { setLevel(l); setGrade(PLANS[l].grades[0]); setSubject(null); setMod(0); };
  const tab = (on) => `rounded-full px-4 py-1.5 text-sm font-black transition ${on ? 'bg-primary text-white' : 'bg-soft text-ink/70'}`;

  return (
    <div className="space-y-5">
      <div>
        <div className="h2">📋 Федеральные рабочие программы</div>
        <p className="text-sm font-semibold text-ink/60 mt-1">
          Учебный план и содержание обучения по документам Минпросвещения России. Для всех предметов обязательной части учебного плана 1–9 классов доступны разделы, темы и планируемые предметные результаты (ОРКСЭ по всем шести модулям, английский язык со 2 класса). Для 10–11 классов добавлен универсальный профиль (базовый уровень); по литературе 11 класса и обществознанию 10–11 классов пока нет предметных результатов. Это справка, она не заменяет полный текст действующей программы и утверждённый план школы.
        </p>
      </div>
      <RuOnly />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Уровень образования">
        {Object.keys(PLANS).map((l) => (
          <button key={l} className={tab(l === level)} aria-pressed={l === level} onClick={() => pickLevel(l)}>{l} · {PLANS[l].label}</button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Класс">
        {plan.grades.map((x) => (
          <button key={x} className={tab(x === g)} onClick={() => { setGrade(x); setMod(0); }} aria-pressed={x === g}>{x} класс</button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,280px)_1fr]">
        <div className="card p-3">
          <div className="text-xs font-black uppercase text-ink/50 px-2 pb-2">Учебный план, {g} класс (ч/нед.)</div>
          <ul className="space-y-1" aria-label="Предметы">
            {rows.map(([s, h]) => {
              const has = !!findProgram(s, g);
              return (
                <li key={s}>
                  <button onClick={() => { setSubject(s); setMod(0); }} aria-pressed={current === s} className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold transition ${current === s ? 'bg-primary text-white' : 'hover:bg-soft'}`}>
                    <span>{has ? '📘 ' : ''}{s}</span><span className="shrink-0 opacity-70">{fmtHours(h[gi])}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-2 border-t border-black/5 px-2 pt-2 text-xs font-bold text-ink/60">
            Итого обязательная часть: {fmtHours(plan.total[gi])} ч · максимум с частью школы: {fmtHours(plan.max[gi])} ч
          </div>
          {plan.note && <p className="px-2 pt-2 text-[11px] font-semibold text-ink/50">{plan.note}</p>}
          <p className="px-2 pt-2 text-[11px] font-semibold text-ink/50">📘 программа есть в Репетиторе. Источник плана: <Doc k={plan.doc} />.</p>
        </div>

        <div className="card p-5 min-w-0">
          {!current && <p className="font-semibold text-ink/60">Выберите предмет в списке.</p>}
          {current && !program && (
            <div className="space-y-2">
              <div className="h3 font-black text-lg">{current}, {g} класс</div>
              <p className="font-semibold text-ink/70">По учебному плану: {fmtHours(rows.find(([s]) => s === current)[1][gi])} ч в неделю.</p>
              <p className="text-sm font-semibold text-ink/60">Темы этого предмета в Репетитор пока не добавлены. Официальные документы: <Doc k="edsoo" />.</p>
            </div>
          )}
          {program && (
            <div className="space-y-4">
              {programs.length > 1 && (
                <div className="flex flex-wrap gap-2" role="group" aria-label="Модуль">
                  {programs.map((p, i) => (
                    <button key={p.id} className={tab(p.id === program.id)} aria-pressed={p.id === program.id} onClick={() => setMod(i)}>{p.subject.split(': ').slice(1).join(': ') || p.subject}</button>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-black text-lg">{program.subject}, {program.grade} класс</div>
                  <div className="text-sm font-bold text-ink/60">{program.hours_per_week} ч в неделю · {program.hours_per_year} ч в год · {program.source_doc}</div>
                </div>
                {canPlan && <button className="btn-primary !py-2 text-sm" onClick={() => nav(`/planner?p=${program.id}`)}>🗓️ Составить план уроков</button>}
              </div>
              {program.note && <p className="rounded-xl bg-soft/60 px-3 py-2 text-sm font-semibold text-ink/70">ℹ️ {program.note}</p>}
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
                  <summary className="cursor-pointer font-black">Планируемые предметные результаты{isSampleResults(program) ? ' (выборка)' : program.results_scope === 'period' ? ' за весь период среднего общего образования (10–11 классы)' : program.subject === 'Музыка' ? ` за весь период ${program.grade <= 4 ? 'начальной' : 'основной'} школы (по модулям)` : ' к концу года'}</summary>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm font-semibold text-ink/80">
                    {program.results.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </details>
              )}
              <p className="text-[11px] font-semibold text-ink/50">Текст по федеральной рабочей программе, пунктуация упрощена для экрана. Для документов школы сверяйтесь с оригиналом.</p>
              <a href={program.source_url} target="_blank" rel="noreferrer" className="inline-block text-sm font-bold text-primary underline">Открыть официальный источник</a>
            </div>
          )}
        </div>
      </div>

      <div className="card p-5 space-y-2 text-sm font-semibold text-ink/70">
        <div className="font-black text-ink">Документы</div>
        <p>• <Doc k="noo" /></p>
        <p>• <Doc k="ooo" /></p>
        <p>• <Doc k="ooo808" /></p>
        <p>• <Doc k="soo" /></p>
        <p>• Для детей с ОВЗ и домашнего обучения: <Doc k="faopNoo" />; <Doc k="faopOoo" />. В Репетиторе есть режим доступности (кнопка ♿ в меню): крупный шрифт, без анимаций, чтение выделенного вслух.</p>
        <p>• <Doc k="fpu" />. Учебники из перечня принадлежат издательствам, их тексты здесь не публикуются.</p>
      </div>
    </div>
  );
}
