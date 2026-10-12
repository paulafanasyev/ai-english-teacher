// Demo school store: schools, classes, members, chat, remote lessons and lesson plans.
// Everything lives in this browser's localStorage. A server version is planned for the Russian hosting.
const KEY = 'aet_school_v1';
const EVT = 'aet-school-change';

function load() {
  let d = {};
  try { d = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { d = {}; }
  return { schools: d.schools || [], classes: d.classes || [], messages: d.messages || {}, plans: d.plans || {} };
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
    const s = { id: uid('sch'), name: clean(name), region: clean(region, 80), ownerId, createdAt: Date.now() };
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
    const c = { id: uid('cls'), schoolId, title: clean(title, 20), subject: clean(subject, 60), teacherId: teacher.id, teacherName: clean(teacher.name, 60), code, members: [], lesson: null, createdAt: Date.now() };
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
    if (!c.members.some((m) => m.id === user.id)) c.members.push({ id: user.id, name: clean(user.name, 60), joinedAt: Date.now() });
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
    const m = { id: uid('msg'), userId: user.id, name: clean(user.name, 60), role: user.role, text: body, kind, at: Date.now() };
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

  savePlan(userId, programId, plan) {
    const db = load();
    db.plans[`${userId}:${programId}`] = { ...plan, savedAt: Date.now() };
    save(db);
  },
  getPlan(userId, programId) { return load().plans[`${userId}:${programId}`] || null; },
};
