import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../core/store.js';
import { school } from './schoolStore.js';
import RuOnly from './RuOnly.jsx';

function useSchoolDb() {
  const [db, setDb] = useState(() => school.get());
  useEffect(() => school.subscribe(setDb), []);
  return db;
}

const SUBJECTS = ['Математика', 'Алгебра', 'Геометрия', 'Иностранный язык', 'Русский язык', 'Классное руководство', 'Другой предмет'];
const input = 'w-full rounded-xl border border-black/10 bg-white px-3 py-2 font-semibold';
const time = (t) => new Date(t).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

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
          <Chat cls={cls} user={user} db={db} />
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
          <Chat cls={cls} user={user} db={db} />
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
        <p className="text-sm font-semibold text-ink/60 mt-1">Демо-режим: школа, классы и чат хранятся в этом браузере (можно сразу проверить с демо-учителем и демо-учеником). Общий класс на разных устройствах заработает после переезда на сервер в России.</p>
      </div>
      <RuOnly />
      {isTeacher ? <TeacherView user={user} db={db} /> : <StudentView user={user} db={db} />}
    </div>
  );
}
