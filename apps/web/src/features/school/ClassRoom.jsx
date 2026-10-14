import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../core/store.js';
import { school } from './schoolStore.js';
import { MARKS } from './homeworkCheck.js';
import { useAI } from '../../ai/useAI.js';
import RuOnly from './RuOnly.jsx';

function useSchoolDb() {
  const [db, setDb] = useState(() => school.get());
  useEffect(() => school.subscribe(setDb), []);
  return db;
}

const SUBJECTS = ['Математика', 'Алгебра', 'Геометрия', 'Иностранный язык', 'Русский язык', 'Классное руководство', 'Другой предмет'];
const input = 'w-full rounded-xl border border-black/10 bg-white px-3 py-2 font-semibold';
const time = (t) => new Date(t).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const dayRu = (d) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) : '');
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

function SvetlanaCheck({ check }) {
  if (!check) return <p className="text-xs font-semibold text-ink/50">Светлана ещё не проверяла этот ответ.</p>;
  return (
    <div className="rounded-xl bg-violet-50 px-3 py-2 text-sm space-y-1">
      <div className="font-black">👩‍🏫 Светлана{check.mark ? `: предварительно ${check.mark}` : ''}<span className="ml-1 text-[11px] font-bold text-ink/40">{check.source === 'llm' ? '(локальный ИИ)' : '(проверка по правилам)'}</span></div>
      <p className="font-semibold">{check.verdict}</p>
      {check.fixes.length > 0 && (
        <ul className="space-y-0.5">
          {check.fixes.map((f, i) => (
            <li key={i} className="font-semibold"><span className="line-through text-red-600">{f.wrong}</span>{f.right && <> → <span className="text-green-700">{f.right}</span></>}{f.why && <span className="text-ink/60"> · {f.why}</span>}</li>
          ))}
        </ul>
      )}
      {check.advice && <p className="text-xs font-semibold text-ink/60">💡 {check.advice}</p>}
    </div>
  );
}

function TeacherMark({ sub, user }) {
  const [mark, setMark] = useState(String(sub.mark || sub.check?.mark || 5));
  const [comment, setComment] = useState(sub.comment || '');
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select aria-label={`Оценка: ${sub.name}`} className="rounded-xl border border-black/10 bg-white px-2 py-1.5 font-black" value={mark} onChange={(e) => setMark(e.target.value)}>
        {MARKS.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
      <input aria-label={`Комментарий: ${sub.name}`} className="flex-1 min-w-[10rem] rounded-xl border border-black/10 bg-white px-3 py-1.5 text-sm font-semibold" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Комментарий ученику (необязательно)" />
      <button className="btn-primary !py-1.5 text-sm" onClick={() => school.reviewHomework(sub.id, user.id, { mark: Number(mark), comment })}>{sub.mark ? 'Изменить оценку' : 'Поставить оценку'}</button>
    </div>
  );
}

function HomeworkTeacher({ cls, user, db }) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [expected, setExpected] = useState('');
  const [due, setDue] = useState('');
  const list = db.homework.filter((h) => h.classId === cls.id).sort((a, b) => b.createdAt - a.createdAt);
  const add = () => { if (school.addHomework(cls.id, user, { title, text, expected, due })) { setTitle(''); setText(''); setExpected(''); setDue(''); } };
  return (
    <div className="card p-4 space-y-3">
      <div className="font-black">🏠 Домашние задания</div>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <input aria-label="Название задания" className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например: № 245, упр. 3 на с. 41" />
        <label className="flex items-center gap-2 text-sm font-bold text-ink/60">Сдать до<input type="date" className="rounded-xl border border-black/10 bg-white px-2 py-2 font-semibold" min={today()} value={due} onChange={(e) => setDue(e.target.value)} /></label>
      </div>
      <textarea aria-label="Текст задания" className={input} rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Условие задания: что сделать и в каком виде прислать ответ" />
      <input aria-label="Правильный ответ для проверки" className={input} value={expected} onChange={(e) => setExpected(e.target.value)} placeholder="Правильный ответ (необязательно, ученики его не видят, Светлана сверит с ним)" />
      <button className="btn-primary !py-2" disabled={!title.trim()} onClick={add}>Задать классу</button>
      {list.length === 0 && <p className="text-sm font-semibold text-ink/50">Заданий пока нет.</p>}
      {list.map((h) => {
        const subs = db.submissions.filter((x) => x.hwId === h.id);
        return (
          <details key={h.id} className="rounded-2xl bg-soft/60 p-3">
            <summary className="cursor-pointer font-black">{h.title}{h.due ? ` · до ${dayRu(h.due)}` : ''} <span className="text-sm font-bold text-ink/50">· сдали {subs.length} из {cls.members.length}</span></summary>
            <div className="mt-2 space-y-3">
              {h.text && <p className="whitespace-pre-wrap text-sm font-semibold">{h.text}</p>}
              {h.expected && <p className="text-xs font-bold text-ink/50">Ответ для проверки: {h.expected}</p>}
              {subs.length === 0 && <p className="text-sm font-semibold text-ink/50">Ответов пока нет.</p>}
              {subs.map((sub) => (
                <div key={sub.id} className="rounded-xl bg-white p-3 space-y-2">
                  <div className="text-xs font-black text-ink/50">{sub.name} · {time(sub.at)}{sub.mark ? ` · оценка ${sub.mark}` : ' · ждёт оценки'}</div>
                  <p className="whitespace-pre-wrap text-sm font-semibold">{sub.text}</p>
                  <SvetlanaCheck check={sub.check} />
                  <TeacherMark key={`${sub.id}:${sub.at}`} sub={sub} user={user} />
                </div>
              ))}
              <button className="text-xs font-bold text-ink/40 hover:text-red-600" onClick={() => { if (window.confirm(`Удалить задание «${h.title}» вместе с ответами учеников?`)) school.removeHomework(h.id, user.id); }}>Удалить задание</button>
            </div>
          </details>
        );
      })}
    </div>
  );
}

function HomeworkAnswer({ hw, cls, user, sub }) {
  const ai = useAI();
  const [text, setText] = useState('');
  const [editing, setEditing] = useState(!sub);
  const [busy, setBusy] = useState(false);
  const send = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    let check = null;
    try {
      const r = await ai.runTask('check_homework', { subject: cls.subject, task: `${hw.title}\n${hw.text}`, answer: text, expected: hw.expected }, { locale: 'ru', timeoutMs: 40000 });
      check = r?.data || null;
    } catch { check = null; }
    if (school.submitHomework(hw.id, user, text, check)) { setText(''); setEditing(false); }
    setBusy(false);
  };
  if (sub && !editing) {
    return (
      <div className="space-y-2">
        <div className="text-xs font-black text-ink/50">Твой ответ · {time(sub.at)}</div>
        <p className="whitespace-pre-wrap rounded-xl bg-white px-3 py-2 text-sm font-semibold">{sub.text}</p>
        <SvetlanaCheck check={sub.check} />
        {sub.mark ? (
          <p className="rounded-xl bg-green-50 px-3 py-2 text-sm font-black">✅ Оценка учителя: {sub.mark}{sub.comment ? ` · ${sub.comment}` : ''}</p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-ink/50">Учитель ещё не поставил оценку.</span>
            <button className="btn-ghost !py-1.5 text-sm" onClick={() => { setText(sub.text); setEditing(true); }}>Исправить и сдать заново</button>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <textarea aria-label={`Ответ: ${hw.title}`} className={input} rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Напиши решение или ответ…" disabled={busy} />
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary !py-2" disabled={!text.trim() || busy} onClick={send}>{busy ? 'Светлана проверяет…' : 'Сдать на проверку Светлане'}</button>
        {sub && !busy && <button className="btn-ghost !py-2" onClick={() => setEditing(false)}>Отмена</button>}
      </div>
    </div>
  );
}

function HomeworkStudent({ cls, user, db }) {
  const list = db.homework.filter((h) => h.classId === cls.id).sort((a, b) => b.createdAt - a.createdAt);
  return (
    <div className="card p-4 space-y-3">
      <div className="font-black">🏠 Домашние задания</div>
      {list.length === 0 && <p className="text-sm font-semibold text-ink/50">Учитель пока не задал домашних заданий.</p>}
      {list.map((h) => {
        const sub = db.submissions.find((x) => x.hwId === h.id && x.studentId === user.id) || null;
        const late = h.due && !sub && h.due < today();
        return (
          <details key={h.id} className="rounded-2xl bg-soft/60 p-3" open={!sub}>
            <summary className="cursor-pointer font-black">{sub ? (sub.mark ? `✅ ${sub.mark} · ` : '📨 ') : late ? '⏰ ' : '📝 '}{h.title}{h.due ? ` · до ${dayRu(h.due)}` : ''}</summary>
            <div className="mt-2 space-y-3">
              {h.text && <p className="whitespace-pre-wrap text-sm font-semibold">{h.text}</p>}
              <HomeworkAnswer hw={h} cls={cls} user={user} sub={sub} />
            </div>
          </details>
        );
      })}
      <p className="text-[11px] font-semibold text-ink/50">Светлана проверяет ответ сразу и ставит предварительную оценку, окончательную ставит учитель. С включённым локальным ИИ (Настройки) разбор подробнее.</p>
    </div>
  );
}

function ClassTabs({ classes, cls, setSel }) {
  if (!classes.length) return null;
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Классы">
      {classes.map((c) => (
        <button key={c.id} onClick={() => setSel(c.id)} aria-pressed={cls?.id === c.id} className={`rounded-full px-4 py-1.5 text-sm font-black ${cls?.id === c.id ? 'bg-primary text-white' : 'bg-soft text-ink/70'}`}>{c.title} · {c.subject}{c.lesson ? ' 🔴' : ''}{c.lesson && <span className="sr-only"> (идёт урок)</span>}</button>
      ))}
    </div>
  );
}

function Chat({ cls, user, db }) {
  const [text, setText] = useState('');
  const list = db.messages[cls.id] || [];
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [list.length]);
  const send = (kind = 'msg') => { if (school.post(cls.id, user, text, kind)) setText(''); };
  const isTeacher = user.id === cls.teacherId;
  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="font-black">💬 Чат класса</div>
      <div className="max-h-80 min-h-[8rem] overflow-y-auto space-y-2 rounded-2xl bg-soft/60 p-3" aria-live="polite">
        {list.length === 0 && <p className="text-sm font-semibold text-ink/50">Сообщений пока нет.</p>}
        {list.map((m) => (
          <div key={m.id} className={`rounded-xl px-3 py-2 text-sm ${m.kind === 'hw' ? 'bg-amber-100' : m.userId === user.id ? 'bg-white' : 'bg-white/70'}`}>
            <div className="text-[11px] font-black text-ink/50">{m.kind === 'hw' ? '📌 Домашнее задание · ' : ''}{m.name}{m.userId === cls.teacherId ? ' (учитель)' : ''} · {time(m.at)}</div>
            <div className="whitespace-pre-wrap font-semibold">{m.text}</div>
          </div>
        ))}
        <div ref={end} />
      </div>
      <div className="flex flex-wrap gap-2">
        <textarea aria-label="Сообщение" className={`${input} min-h-[2.75rem] flex-1`} rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Написать классу…" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
        <div className="flex flex-col gap-2">
          <button className="btn-primary !py-2" onClick={() => send()} disabled={!text.trim()}>Отправить</button>
          {isTeacher && <button className="btn-ghost !py-2 text-sm" onClick={() => send('hw')} disabled={!text.trim()}>📌 Как домашку</button>}
        </div>
      </div>
    </div>
  );
}

function RemoteLesson({ cls, user }) {
  const [topic, setTopic] = useState('');
  const isTeacher = user.id === cls.teacherId;
  return (
    <div className="card p-4 space-y-3">
      <div className="font-black">🎥 Дистанционный урок</div>
      {cls.lesson ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Идёт урок{cls.lesson.topic ? `: ${cls.lesson.topic}` : ''} · начался в {time(cls.lesson.startedAt)}</p>
          <div className="flex flex-wrap gap-2">
            <a className="btn-primary !py-2" href={cls.lesson.url} target="_blank" rel="noreferrer">Войти в видеоурок</a>
            {isTeacher && <button className="btn-ghost !py-2" onClick={() => school.endLesson(cls.id)}>Завершить</button>}
          </div>
        </div>
      ) : isTeacher ? (
        <div className="flex flex-wrap gap-2">
          <input aria-label="Тема урока" className={`${input} flex-1`} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Тема урока (необязательно)" />
          <button className="btn-primary !py-2" onClick={() => { const l = school.startLesson(cls.id, topic); if (l) { school.post(cls.id, user, `Начался дистанционный урок${l.topic ? `: ${l.topic}` : ''}. Ссылка: ${l.url}`); setTopic(''); } }}>Начать урок</button>
        </div>
      ) : (
        <p className="text-sm font-semibold text-ink/60">Сейчас урока нет. Когда учитель начнёт, здесь появится кнопка входа.</p>
      )}
      <p className="text-[11px] font-semibold text-ink/50">Демо: видеосвязь идёт через публичный сервис Jitsi Meet. Для школ в рабочей версии будет свой сервер видеосвязи в России.</p>
    </div>
  );
}

function TeacherView({ user, db }) {
  const mySchool = db.schools.find((s) => s.ownerId === user.id);
  const classes = db.classes.filter((c) => c.teacherId === user.id);
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [sel, setSel] = useState(null);
  const cls = classes.find((c) => c.id === sel) || classes[0];

  if (!mySchool) {
    return (
      <div className="card p-5 space-y-3 max-w-xl">
        <div className="font-black text-lg">🏫 Ваша школа</div>
        <p className="text-sm font-semibold text-ink/60">Укажите школу, чтобы создавать классы. В рабочей версии школа будет выбираться из официального реестра образовательных организаций.</p>
        <input aria-label="Название школы" className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: МБОУ СОШ № 1" />
        <input aria-label="Регион и город" className={input} value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Регион, город" />
        <button className="btn-primary" disabled={!name.trim()} onClick={() => school.createSchool({ name, region, ownerId: user.id })}>Сохранить школу</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card p-4 flex flex-wrap items-center justify-between gap-2">
        <div><div className="font-black">🏫 {mySchool.name}</div><div className="text-xs font-bold text-ink/50">{mySchool.region}</div></div>
        <div className="flex flex-wrap gap-2">
          <input aria-label="Название класса" className="w-24 rounded-xl border border-black/10 bg-white px-3 py-2 font-semibold" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="5А" />
          <select aria-label="Предмет" className="rounded-xl border border-black/10 bg-white px-3 py-2 font-semibold" value={subject} onChange={(e) => setSubject(e.target.value)}>
            {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
          </select>
          <button className="btn-primary !py-2" disabled={!title.trim()} onClick={() => { const c = school.createClass({ schoolId: mySchool.id, title, subject, teacher: user }); if (c) { setSel(c.id); setTitle(''); } }}>+ Класс</button>
        </div>
      </div>

      {classes.length === 0 && <p className="font-semibold text-ink/60">Создайте первый класс: ученики присоединяются по коду.</p>}
      <ClassTabs classes={classes} cls={cls} setSel={setSel} />

      {cls && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_1fr]">
          <div className="space-y-4">
            <div className="card p-4 space-y-2">
              <div className="font-black">👥 {cls.title} · {cls.subject}</div>
              <p className="text-sm font-semibold">Код для учеников: <span className="rounded-lg bg-soft px-2 py-0.5 font-black tracking-widest">{cls.code}</span></p>
              <div className="text-xs font-black uppercase text-ink/50 pt-1">Ученики ({cls.members.length})</div>
              {cls.members.length === 0 && <p className="text-sm font-semibold text-ink/50">Пока никого. Передайте код классу.</p>}
              <ul className="space-y-1 text-sm font-semibold">
                {cls.members.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2"><span>{m.name}</span><button className="text-xs font-bold text-ink/40 hover:text-ink" aria-label={`Убрать из класса: ${m.name}`} onClick={() => school.leave(cls.id, m.id)}>убрать</button></li>
                ))}
              </ul>
            </div>
            <RemoteLesson cls={cls} user={user} />
          </div>
          <div className="space-y-4 min-w-0">
            <HomeworkTeacher cls={cls} user={user} db={db} />
            <Chat cls={cls} user={user} db={db} />
          </div>
        </div>
      )}
    </div>
  );
}

function StudentView({ user, db }) {
  const classes = db.classes.filter((c) => c.members.some((m) => m.id === user.id));
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [sel, setSel] = useState(null);
  const cls = classes.find((c) => c.id === sel) || classes[0];
  const join = () => { const c = school.join(code, user); if (c) { setSel(c.id); setCode(''); setErr(''); } else setErr('Класс с таким кодом не найден.'); };
  const schoolName = (c) => db.schools.find((s) => s.id === c.schoolId)?.name || '';
  return (
    <div className="space-y-4">
      <div className="card p-4 flex flex-wrap items-end gap-2">
        <label className="flex-1 min-w-[12rem]">
          <span className="text-xs font-black uppercase text-ink/50">Код класса от учителя</span>
          <input className={`${input} mt-1 uppercase tracking-widest`} value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABC123" maxLength={6} onKeyDown={(e) => { if (e.key === 'Enter') join(); }} />
        </label>
        <button className="btn-primary !py-2" disabled={code.trim().length < 6} onClick={join}>Войти в класс</button>
        {err && <p className="w-full text-sm font-bold text-red-600" role="alert">{err}</p>}
      </div>
      <ClassTabs classes={classes} cls={cls} setSel={setSel} />
      {cls && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_1fr]">
          <div className="space-y-4">
            <div className="card p-4 space-y-1">
              <div className="font-black">🏫 {schoolName(cls)}</div>
              <p className="text-sm font-semibold">{cls.title} · {cls.subject}</p>
              <p className="text-sm font-semibold">Учитель: {cls.teacherName}</p>
              <p className="text-sm font-semibold text-ink/60">Учеников в классе: {cls.members.length}</p>
            </div>
            <RemoteLesson cls={cls} user={user} />
          </div>
          <div className="space-y-4 min-w-0">
            <HomeworkStudent cls={cls} user={user} db={db} />
            <Chat cls={cls} user={user} db={db} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClassRoom() {
  const { user } = useApp();
  const db = useSchoolDb();
  const isTeacher = user.role === 'TEACHER' || user.role === 'ADMIN';
  return (
    <div className="space-y-5">
      <div>
        <div className="h2">👥 {isTeacher ? 'Мои классы' : 'Мой класс'}, демо</div>
        <p className="text-sm font-semibold text-ink/60 mt-1">Демо-режим: школа, классы, чат и домашние задания хранятся в этом браузере (можно сразу проверить с демо-учителем и демо-учеником). Общий класс на разных устройствах заработает после переезда на сервер в России.</p>
      </div>
      <RuOnly />
      {isTeacher ? <TeacherView user={user} db={db} /> : <StudentView user={user} db={db} />}
    </div>
  );
}
