// Demo school store: schools, classes, members, chat, remote lessons, lesson plans and homework.
// Everything lives in this browser's localStorage. A server version is planned for the Russian hosting.
import { sanitizeCheck, validMark } from './homeworkCheck.js';

const KEY = 'aet_school_v1';
const EVT = 'aet-school-change';

const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const arr = (v) => (Array.isArray(v) ? v : []);
const str = (v, max = 120) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const txt = (v, max = 3000) => (typeof v === 'string' ? v.replace(/\r\n?/g, '\n').trim().slice(0, max) : '');
const num = (v) => (Number.isFinite(v) ? v : 0);
const isUrl = (v) => typeof v === 'string' && /^https:\/\/meet\.jit\.si\/[A-Za-z0-9-]+$/.test(v);
const isDay = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

function load() {
  let d = {};
  try { d = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { d = {}; }
  if (!isObj(d)) d = {};
  const schools = arr(d.schools)
    .filter((s) => isObj(s) && typeof s.id === 'string')
    .map((s) => ({ id: s.id, name: str(s.name), region: str(s.region, 80), ownerId: str(s.ownerId), createdAt: num(s.createdAt) }))
    .filter((s) => s.name);
  const classes = arr(d.classes)
    .filter((c) => isObj(c) && typeof c.id === 'string' && typeof c.code === 'string')
    .map((c) => ({
      id: c.id,
      schoolId: str(c.schoolId),
      title: str(c.title, 20),
      subject: str(c.subject, 60),
      teacherId: str(c.teacherId),
      teacherName: str(c.teacherName, 60),
      code: str(c.code, 10).toUpperCase(),
      members: arr(c.members).filter((m) => isObj(m) && typeof m.id === 'string').map((m) => ({ id: m.id, name: str(m.name, 60), joinedAt: num(m.joinedAt) })),
      lesson: isObj(c.lesson) && isUrl(c.lesson.url) ? { url: c.lesson.url, topic: str(c.lesson.topic, 140), startedAt: num(c.lesson.startedAt) } : null,
      createdAt: num(c.createdAt),
    }))
    .filter((c) => c.title && c.code);
  const messages = {};
  if (isObj(d.messages)) {
    for (const [k, v] of Object.entries(d.messages)) {
      messages[k] = arr(v)
        .filter((m) => isObj(m) && typeof m.id === 'string')
        .map((m) => ({ id: m.id, userId: str(m.userId), name: str(m.name, 60), role: str(m.role, 20), text: typeof m.text === 'string' ? m.text.slice(0, 2000) : '', kind: m.kind === 'hw' ? 'hw' : 'msg', at: num(m.at) }))
        .filter((m) => m.text);
    }
  }
  const plans = {};
  if (isObj(d.plans)) for (const [k, v] of Object.entries(d.plans)) if (isObj(v)) plans[k] = v;
  const homework = arr(d.homework)
    .filter((h) => isObj(h) && typeof h.id === 'string' && typeof h.classId === 'string')
    .map((h) => ({ id: h.id, classId: h.classId, teacherId: str(h.teacherId), title: str(h.title, 140), text: txt(h.text), expected: str(h.expected, 300), due: isDay(h.due) ? h.due : '', createdAt: num(h.createdAt) }))
    .filter((h) => h.title);
  const submissions = arr(d.submissions)
    .filter((x) => isObj(x) && typeof x.id === 'string' && typeof x.hwId === 'string' && typeof x.studentId === 'string')
    .map((x) => ({ id: x.id, hwId: x.hwId, studentId: x.studentId, name: str(x.name, 60), text: txt(x.text, 5000), at: num(x.at), check: sanitizeCheck(x.check), mark: validMark(x.mark), comment: str(x.comment, 500), reviewedAt: num(x.reviewedAt) }))
    .filter((x) => x.text);
  return { schools, classes, messages, plans, homework, submissions };
}
function save(db) {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch {}
  try { window.dispatchEvent(new Event(EVT)); } catch {}
  return db;
}
const uid = (p) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const makeCode = () => Array.from({ length: 6 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join('');
const clean = (s, max = 120) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, max);
const ruDay = (d) => (isDay(d) ? `${d.slice(8, 10)}.${d.slice(5, 7)}` : '');

export const school = {
  get: load,
  subscribe(fn) {
    const h = (e) => { if (!e || e.type !== 'storage' || e.key === KEY) fn(load()); };
    window.addEventListener(EVT, h);
    window.addEventListener('storage', h);
    return () => { window.removeEventListener(EVT, h); window.removeEventListener('storage', h); };
  },

  createSchool({ name, region, ownerId }) {
    const db = load();
    const s = { id: uid('sch'), name: clean(name), region: clean(region, 80), ownerId: String(ownerId), createdAt: Date.now() };
    if (!s.name) return null;
    db.schools.push(s);
    save(db);
    return s;
  },
  schoolOf(ownerId) { return load().schools.find((s) => s.ownerId === ownerId) || null; },
  schoolById(id) { return load().schools.find((s) => s.id === id) || null; },

  createClass({ schoolId, title, subject, teacher }) {
    const db = load();
    let code = makeCode();
    while (db.classes.some((c) => c.code === code)) code = makeCode();
    const c = { id: uid('cls'), schoolId, title: clean(title, 20), subject: clean(subject, 60), teacherId: String(teacher.id), teacherName: clean(teacher.name, 60), code, members: [], lesson: null, createdAt: Date.now() };
    if (!c.title) return null;
    db.classes.push(c);
    save(db);
    return c;
  },
  classesOfTeacher(id) { return load().classes.filter((c) => c.teacherId === id); },
  classesOfStudent(id) { return load().classes.filter((c) => c.members.some((m) => m.id === id)); },

  join(code, user) {
    const db = load();
    const c = db.classes.find((x) => x.code === clean(code, 10).toUpperCase());
    if (!c) return null;
    if (!c.members.some((m) => m.id === user.id)) c.members.push({ id: String(user.id), name: clean(user.name, 60), joinedAt: Date.now() });
    save(db);
    return c;
  },
  leave(classId, userId) {
    const db = load();
    const c = db.classes.find((x) => x.id === classId);
    if (c) c.members = c.members.filter((m) => m.id !== userId);
    save(db);
  },

  post(classId, user, text, kind = 'msg') {
    const body = String(text || '').trim().slice(0, 2000);
    if (!body) return null;
    const db = load();
    const list = db.messages[classId] || (db.messages[classId] = []);
    const m = { id: uid('msg'), userId: String(user.id), name: clean(user.name, 60), role: String(user.role || ''), text: body, kind: kind === 'hw' ? 'hw' : 'msg', at: Date.now() };
    list.push(m);
    if (list.length > 500) list.splice(0, list.length - 500);
    save(db);
    return m;
  },
  messages(classId) { return load().messages[classId] || []; },

  startLesson(classId, topic) {
    const db = load();
    const c = db.classes.find((x) => x.id === classId);
    if (!c) return null;
    const room = `Svetlana-${c.code}-${Math.random().toString(36).slice(2, 8)}`;
    c.lesson = { url: `https://meet.jit.si/${room}`, topic: clean(topic, 140), startedAt: Date.now() };
    save(db);
    return c.lesson;
  },
  endLesson(classId) {
    const db = load();
    const c = db.classes.find((x) => x.id === classId);
    if (c) c.lesson = null;
    save(db);
  },

  // ---- Homework: the teacher assigns, the student submits, Svetlana checks, the teacher confirms the mark.
  addHomework(classId, teacher, { title, text, expected, due } = {}) {
    const db = load();
    const c = db.classes.find((x) => x.id === classId);
    if (!c || c.teacherId !== String(teacher?.id)) return null;
    const h = { id: uid('hw'), classId, teacherId: String(teacher.id), title: clean(title, 140), text: txt(text), expected: clean(expected, 300), due: isDay(due) ? due : '', createdAt: Date.now() };
    if (!h.title) return null;
    db.homework.push(h);
    const list = db.messages[classId] || (db.messages[classId] = []);
    list.push({ id: uid('msg'), userId: h.teacherId, name: clean(teacher.name, 60), role: String(teacher.role || ''), text: `${h.title}${h.due ? ` (сдать до ${ruDay(h.due)})` : ''}${h.text ? `\n${h.text}` : ''}\nСдать на проверку можно в разделе «Домашние задания».`.slice(0, 2000), kind: 'hw', at: h.createdAt });
    save(db);
    return h;
  },
  removeHomework(hwId, teacherId) {
    const db = load();
    const h = db.homework.find((x) => x.id === hwId);
    if (!h || h.teacherId !== String(teacherId)) return false;
    db.homework = db.homework.filter((x) => x.id !== hwId);
    db.submissions = db.submissions.filter((x) => x.hwId !== hwId);
    save(db);
    return true;
  },
  homeworkOf(classId) { return load().homework.filter((h) => h.classId === classId).sort((a, b) => b.createdAt - a.createdAt); },
  submissionsOf(hwId) { return load().submissions.filter((x) => x.hwId === hwId); },
  submissionOf(hwId, studentId) { return load().submissions.find((x) => x.hwId === hwId && x.studentId === String(studentId)) || null; },

  // Saves (or replaces) the student's answer together with Svetlana's check. A marked answer is locked.
  submitHomework(hwId, student, text, check) {
    const db = load();
    const h = db.homework.find((x) => x.id === hwId);
    const c = h && db.classes.find((x) => x.id === h.classId);
    if (!c || !c.members.some((m) => m.id === String(student?.id))) return null;
    const body = txt(text, 5000);
    if (!body) return null;
    const old = db.submissions.find((x) => x.hwId === hwId && x.studentId === String(student.id));
    if (old && old.mark) return null;
    const sub = { id: old?.id || uid('sub'), hwId, studentId: String(student.id), name: clean(student.name, 60), text: body, at: Date.now(), check: sanitizeCheck(check), mark: null, comment: '', reviewedAt: 0 };
    db.submissions = db.submissions.filter((x) => x !== old);
    db.submissions.push(sub);
    save(db);
    return sub;
  },
  reviewHomework(subId, teacherId, { mark, comment } = {}) {
    const db = load();
    const sub = db.submissions.find((x) => x.id === subId);
    const h = sub && db.homework.find((x) => x.id === sub.hwId);
    if (!h || h.teacherId !== String(teacherId)) return null;
    sub.mark = validMark(mark);
    sub.comment = clean(comment, 500);
    sub.reviewedAt = sub.mark ? Date.now() : 0;
    save(db);
    return sub;
  },

  savePlan(userId, programId, plan) {
    const db = load();
    db.plans[`${userId}:${programId}`] = { ...plan, savedAt: Date.now() };
    save(db);
  },
  // Returns a sanitized saved plan or null.
  getPlan(userId, programId) {
    const p = load().plans[`${userId}:${programId}`];
    if (!p) return null;
    const ints = (v) => arr(v).filter((x) => Number.isInteger(x));
    const lessons = arr(p.lessons)
      .filter((l) => isObj(l))
      .map((l, i) => ({ n: Number.isInteger(l.n) ? l.n : i + 1, date: typeof l.date === 'string' ? l.date : '', section: str(l.section, 300), topic: typeof l.topic === 'string' ? l.topic.slice(0, 2000) : '', hw: typeof l.hw === 'string' ? l.hw.slice(0, 500) : '' }));
    return { start: typeof p.start === 'string' ? p.start : '', days: ints(p.days).filter((x) => x >= 1 && x <= 6), secs: ints(p.secs).filter((x) => x >= 0), lessons };
  },
};
