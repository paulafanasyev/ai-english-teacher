// Data layer. Two interchangeable backends:
//  - DemoApi : everything in localStorage (published demo, no server needed)
//  - HttpApi : talks to the Node.js + PostgreSQL backend (apps/api) via JWT
// The active one is picked by VITE_API_URL.
import { storage } from './storage.js';

const DB_KEY = 'aet_db_v3';
const SES_KEY = 'aet_session';
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const now = () => Date.now();
const DAY = 86400000;
const enc = (p) => 'demo$' + btoa(unescape(encodeURIComponent(p))); // demo only — real backend uses bcrypt

const CEFR = ['A1', 'A2', 'B1', 'B2'];
const TASK_TYPES = ['vocab', 'match', 'gap', 'grammar', 'listening', 'writing', 'speaking'];
const TOPICS = ['basics', 'family', 'food', 'travel', 'school', 'hobbies', 'nature', 'city', 'shopping', 'work', 'technology', 'feelings'];

function seedDb() {
  const students = [
    ['Полина', 'polina@school.demo', 'A2', 0.82], ['Минь', 'minh@school.demo', 'A1', 0.64],
    ['Артём', 'artem@school.demo', 'B1', 0.88], ['Линь', 'lin@school.demo', 'A1', 0.71],
    ['Соня', 'sonya@school.demo', 'A2', 0.77], ['Хоанг', 'hoang@school.demo', 'B1', 0.9],
    ['Кирилл', 'kirill@school.demo', 'A1', 0.55], ['Тхао', 'thao@school.demo', 'A2', 0.8],
    ['Маша', 'masha@school.demo', 'B2', 0.93], ['Дима', 'dima@school.demo', 'A1', 0.6],
    ['Ань', 'anh@school.demo', 'A2', 0.74],
  ];
  const users = [
    { id: 'u_admin', email: 'admin@demo', passwordHash: enc('admin123'), name: 'Admin', role: 'ADMIN',
      blocked: false, level: 'B2', xp: 0, coins: 999, teacherId: 'minh', theme: 'candy', frame: 'none', createdAt: now() - 40 * DAY, lastActive: now() },
    { id: 'u_student', email: 'student@demo', passwordHash: enc('demo123'), name: 'Саша', role: 'STUDENT',
      blocked: false, level: 'A1', xp: 120, coins: 350, teacherId: null, theme: 'candy', frame: 'none', createdAt: now() - 2 * DAY, lastActive: now() },
  ];
  const attempts = [];
  const studentAcc = {};
  students.forEach(([name, email, level, acc], i) => {
    const id = 'u_s' + i;
    studentAcc[id] = acc;
    const daysActive = 8 + Math.floor(Math.random() * 22);
    users.push({ id, email, passwordHash: enc('pass1234'), name, role: 'STUDENT', blocked: i === 9,
      level, xp: 200 + Math.floor(Math.random() * 2200), coins: Math.floor(Math.random() * 400),
      teacherId: ['emma', 'james', 'sofia', 'alex', 'linh', 'minh'][i % 6], theme: 'candy', frame: 'none',
      createdAt: now() - (30 + i) * DAY, lastActive: now() - Math.floor(Math.random() * 9) * DAY });
    for (let d = 0; d < daysActive; d++) {
      const dayTs = now() - Math.floor(Math.random() * 30) * DAY;
      const n = 3 + Math.floor(Math.random() * 12);
      for (let k = 0; k < n; k++) {
        attempts.push({ id: uid(), userId: id, taskType: TASK_TYPES[Math.floor(Math.random() * TASK_TYPES.length)],
          topic: TOPICS[Math.floor(Math.random() * TOPICS.length)], level,
          correct: Math.random() < acc, durationMs: 4000 + Math.floor(Math.random() * 14000),
          at: dayTs + Math.floor(Math.random() * DAY * 0.6) });
      }
    }
  });
  // ---- teacher + parent + class + electronic journal (Phase 10) ----
  users.push({ id: 'u_teacher', email: 'teacher@demo', passwordHash: enc('teacher123'), name: 'Мария Петровна', role: 'TEACHER',
    blocked: false, level: 'C1', xp: 0, coins: 0, teacherId: null, theme: 'candy', frame: 'none', createdAt: now() - 60 * DAY, lastActive: now() });
  users.push({ id: 'u_parent', email: 'parent@demo', passwordHash: enc('parent123'), name: 'Ирина (родитель)', role: 'PARENT',
    blocked: false, level: 'A1', xp: 0, coins: 0, teacherId: null, childIds: ['u_s0'], theme: 'candy', frame: 'none', createdAt: now() - 30 * DAY, lastActive: now() });
  const classStudents = ['u_s0', 'u_s1', 'u_s2', 'u_s3', 'u_s4', 'u_s5'];
  const classes = [{ id: 'c1', name: 'Группа 5А · Английский', teacherId: 'u_teacher', studentIds: classStudents, createdAt: now() - 60 * DAY }];
  const KINDS = ['lesson', 'quiz', 'homework'];
  const JT = ['basics', 'family', 'food', 'travel', 'school', 'hobbies'];
  const journal = [];
  classStudents.forEach((sid) => {
    const acc = studentAcc[sid] ?? 0.7;
    const nEntries = 4 + Math.floor(Math.random() * 4);
    for (let e = 0; e < nEntries; e++) {
      const r = Math.random();
      const mark = r < acc * 0.65 ? 5 : r < acc + 0.2 ? 4 : 3;
      journal.push({ id: uid(), studentId: sid, classId: 'c1', teacherId: 'u_teacher', kind: KINDS[Math.floor(Math.random() * KINDS.length)],
        topic: JT[Math.floor(Math.random() * JT.length)], mark, comment: '', at: now() - Math.floor(Math.random() * 18) * DAY });
    }
  });
  journal.push({ id: uid(), studentId: 'u_s0', classId: 'c1', teacherId: 'u_teacher', kind: 'note', topic: '', mark: null, comment: 'Отличный прогресс в разговорной практике — так держать!', at: now() - 2 * DAY });
  journal.push({ id: uid(), studentId: 'u_s0', classId: 'c1', teacherId: 'u_teacher', kind: 'homework', topic: 'family', mark: 5, comment: 'Домашнее задание выполнено на отлично.', at: now() - 1 * DAY });
  journal.sort((a, b) => b.at - a.at);
  return {
    users, attempts, classes, journal, unlocks: [], materials: [],
    settings: { avatarGenerationEnabled: true, gamesEnabled: true, listeningEnabled: true, registrationOpen: true },
  };
}

function db() {
  let d = storage.get(DB_KEY);
  if (!d) { d = seedDb(); storage.set(DB_KEY, d); }
  return d;
}
const save = (d) => storage.set(DB_KEY, d);
const publicUser = (u) => { if (!u) return null; const { passwordHash, ...rest } = u; return rest; };

/* ---------- adaptive CEFR level ---------- */
function adaptLevel(d, user) {
  const recent = d.attempts.filter((a) => a.userId === user.id).slice(-20);
  if (recent.length < 12) return;
  const acc = recent.filter((a) => a.correct).length / recent.length;
  const i = CEFR.indexOf(user.level);
  if (acc > 0.85 && i < CEFR.length - 1) user.level = CEFR[i + 1];
  else if (acc < 0.45 && i > 0) user.level = CEFR[i - 1];
}

/* ---------- material → tasks (deterministic, offline) ---------- */
const STOP = new Set(('the a an and or but if of in on at to for with from by is are was were be been am i you he she it we they this that these those my your his her its our their as not no yes do does did done have has had will would can could should may might must about into over under again very just so than then there here when where who whom what which why how all any both each few more most other some such only own same too s t don now').split(' '));
export function extractTasksFromText(text) {
  const words = (text.toLowerCase().match(/[a-z']+/g) || []).filter((w) => w.length >= 4 && !STOP.has(w));
  const freq = {};
  words.forEach((w) => (freq[w] = (freq[w] || 0) + 1));
  const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 18).map(([w]) => w);
  const sentences = (text.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]/g) || [])
    .map((s) => s.trim()).filter((s) => { const n = s.split(' ').length; return n >= 6 && n <= 16; }).slice(0, 30);
  const gaps = [];
  for (const s of sentences) {
    const toks = s.replace(/[.!?]$/, '').split(' ');
    const idx = toks.findIndex((tk) => top.includes(tk.toLowerCase().replace(/[^a-z']/g, '')));
    if (idx === -1) continue;
    const answer = toks[idx].replace(/[^a-zA-Z']/g, '');
    const opts = [answer, ...top.filter((w) => w !== answer.toLowerCase()).sort(() => 0.5 - Math.random()).slice(0, 3)];
    gaps.push({ sentence: toks.map((tk, i2) => (i2 === idx ? '___' : tk)).join(' '), answer, options: opts.sort(() => 0.5 - Math.random()) });
    if (gaps.length >= 12) break;
  }
  const reorders = sentences.filter((s) => { const n = s.split(' ').length; return n >= 5 && n <= 9; }).slice(0, 8)
    .map((s) => { const clean = s.replace(/[.!?]$/, '').replace(/,/g, ''); return { correct: clean, words: clean.split(' ').sort(() => 0.5 - Math.random()) }; });
  return { topWords: top, gaps, reorders };
}

/* ================= Demo backend ================= */
const DemoApi = {
  demo: true,
  async register({ email, password, name }) {
    const d = db();
    if (!d.settings.registrationOpen) throw new Error('closed');
    if (d.users.some((u) => u.email === email)) throw new Error('exists');
    const user = { id: uid(), email, passwordHash: enc(password), name, role: 'STUDENT', blocked: false,
      level: 'A1', xp: 0, coins: 100, teacherId: null, theme: 'candy', frame: 'none', createdAt: now(), lastActive: now() };
    d.users.push(user); save(d);
    storage.set(SES_KEY, { userId: user.id });
    return publicUser(user);
  },
  async login({ email, password }) {
    const d = db();
    const user = d.users.find((u) => u.email === email && u.passwordHash === enc(password));
    if (!user) throw new Error('credentials');
    if (user.blocked) throw new Error('blocked');
    user.lastActive = now(); save(d);
    storage.set(SES_KEY, { userId: user.id });
    return publicUser(user);
  },
  async logout() { storage.del(SES_KEY); },
  async current() {
    const ses = storage.get(SES_KEY);
    if (!ses) return null;
    const d = db();
    const u = d.users.find((x) => x.id === ses.userId);
    return u && !u.blocked ? publicUser(u) : null;
  },
  async updateProfile(patch) {
    const d = db(); const ses = storage.get(SES_KEY);
    const u = d.users.find((x) => x.id === ses?.userId);
    if (!u) throw new Error('auth');
    for (const k of ['name', 'locale', 'teacherId', 'theme', 'frame', 'level']) if (patch[k] !== undefined) u[k] = patch[k];
    save(d); return publicUser(u);
  },

  async addAttempt({ taskType, topic, level, correct, durationMs }) {
    const d = db(); const ses = storage.get(SES_KEY);
    const u = d.users.find((x) => x.id === ses?.userId);
    if (!u) return null;
    d.attempts.push({ id: uid(), userId: u.id, taskType, topic, level, correct: !!correct, durationMs: durationMs || 0, at: now() });
    u.lastActive = now();
    adaptLevel(d, u);
    save(d); return publicUser(u);
  },
  async getStats() {
    const d = db(); const ses = storage.get(SES_KEY);
    const mine = d.attempts.filter((a) => a.userId === ses?.userId);
    const byType = {};
    TASK_TYPES.forEach((tt) => {
      const arr = mine.filter((a) => a.taskType === tt);
      if (arr.length) byType[tt] = { total: arr.length, correct: arr.filter((a) => a.correct).length };
    });
    const byDay = [];
    for (let i = 13; i >= 0; i--) {
      const d0 = new Date(); d0.setHours(0, 0, 0, 0); const start = d0.getTime() - i * DAY;
      byDay.push({ day: new Date(start).toISOString().slice(5, 10), n: mine.filter((a) => a.at >= start && a.at < start + DAY).length });
    }
    const days = new Set(mine.map((a) => Math.floor(a.at / DAY)));
    let streak = 0; let cursor = Math.floor(now() / DAY);
    while (days.has(cursor)) { streak++; cursor--; }
    const total = mine.length, correct = mine.filter((a) => a.correct).length;
    return { total, correct, accuracy: total ? correct / total : 0, byType, byDay, streak };
  },

  async earn({ xp = 0, coins = 0 }) {
    const d = db(); const ses = storage.get(SES_KEY);
    const u = d.users.find((x) => x.id === ses?.userId);
    if (!u) return null;
    u.xp += Math.max(0, Math.min(200, xp));
    u.coins += Math.max(0, Math.min(100, coins));
    save(d); return publicUser(u);
  },
  async spend({ itemType, itemId, price }) {
    const d = db(); const ses = storage.get(SES_KEY);
    const u = d.users.find((x) => x.id === ses?.userId);
    if (!u) throw new Error('auth');
    if (d.unlocks.some((x) => x.userId === u.id && x.itemType === itemType && x.itemId === itemId)) return publicUser(u);
    if (u.coins < price) throw new Error('coins');
    u.coins -= price;
    d.unlocks.push({ id: uid(), userId: u.id, itemType, itemId, at: now() });
    save(d); return publicUser(u);
  },
  async getUnlocks() {
    const d = db(); const ses = storage.get(SES_KEY);
    return d.unlocks.filter((x) => x.userId === ses?.userId).map(({ itemType, itemId }) => ({ itemType, itemId }));
  },

  /* ----- admin ----- */
  async listUsers(q = '') {
    const d = db(); const s = q.trim().toLowerCase();
    return d.users
      .filter((u) => !s || u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s))
      .map((u) => {
        const mine = d.attempts.filter((a) => a.userId === u.id);
        const acc = mine.length ? mine.filter((a) => a.correct).length / mine.length : 0;
        return { ...publicUser(u), attempts: mine.length, accuracy: acc };
      });
  },
  async patchUser(id, patch) {
    const d = db(); const u = d.users.find((x) => x.id === id);
    if (!u) throw new Error('notfound');
    for (const k of ['blocked', 'role', 'level']) if (patch[k] !== undefined) u[k] = patch[k];
    save(d); return publicUser(u);
  },
  async deleteUser(id) {
    const d = db();
    d.users = d.users.filter((x) => x.id !== id);
    d.attempts = d.attempts.filter((a) => a.userId !== id);
    d.unlocks = d.unlocks.filter((a) => a.userId !== id);
    save(d);
  },
  async analytics() {
    const d = db();
    const students = d.users.filter((u) => u.role === 'STUDENT');
    const active7 = students.filter((u) => now() - u.lastActive < 7 * DAY).length;
    const byType = {};
    TASK_TYPES.forEach((tt) => {
      const arr = d.attempts.filter((a) => a.taskType === tt);
      if (arr.length) byType[tt] = { total: arr.length, correct: arr.filter((a) => a.correct).length };
    });
    const byDay = [];
    for (let i = 13; i >= 0; i--) {
      const d0 = new Date(); d0.setHours(0, 0, 0, 0); const start = d0.getTime() - i * DAY;
      byDay.push({ day: new Date(start).toISOString().slice(5, 10), n: d.attempts.filter((a) => a.at >= start && a.at < start + DAY).length });
    }
    const topicCount = {};
    d.attempts.forEach((a) => (topicCount[a.topic] = (topicCount[a.topic] || 0) + 1));
    const topTopics = Object.entries(topicCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const total = d.attempts.length, correct = d.attempts.filter((a) => a.correct).length;
    return { students: students.length, active7, attempts: total, avgAccuracy: total ? correct / total : 0, byType, byDay, topTopics };
  },
  async getSettings() { return { ...db().settings }; },
  async putSetting(key, value) { const d = db(); d.settings[key] = value; save(d); return { ...d.settings }; },

  /* ----- materials ----- */
  async addMaterial({ filename, text }) {
    const d = db();
    const tasks = extractTasksFromText(text);
    const mat = { id: uid(), filename, chars: text.length, tasks, at: now() };
    d.materials.push(mat); save(d);
    return mat;
  },
  async listMaterials() { return db().materials.map(({ id, filename, chars, tasks, at }) => ({ id, filename, chars, at, words: tasks.topWords.length, gaps: tasks.gaps.length, reorders: tasks.reorders.length })); },
  async deleteMaterial(id) { const d = db(); d.materials = d.materials.filter((m) => m.id !== id); save(d); },
  async getMaterialTasks() {
    const d = db();
    const gaps = d.materials.flatMap((m) => m.tasks.gaps);
    const reorders = d.materials.flatMap((m) => m.tasks.reorders);
    return { gaps, reorders };
  },
  /* ----- Phase 10: journal / teacher & parent cabinets ----- */
  _summary(d, u) {
    const mine = d.attempts.filter((a) => a.userId === u.id);
    const correct = mine.filter((a) => a.correct).length;
    const days = new Set(mine.map((a) => Math.floor(a.at / DAY)));
    let streak = 0, cur = Math.floor(now() / DAY);
    while (days.has(cur)) { streak++; cur--; }
    return { id: u.id, name: u.name, level: u.level, xp: u.xp, coins: u.coins, attempts: mine.length, correct,
      accuracy: mine.length ? correct / mine.length : 0, streak, lastActive: u.lastActive, teacherId: u.teacherId };
  },
  async myClasses() {
    const d = db(); const u = d.users.find((x) => x.id === storage.get(SES_KEY)?.userId);
    if (!u) throw new Error('auth');
    return (d.classes || []).filter((c) => c.teacherId === u.id).map((c) => {
      const studs = c.studentIds.map((id) => d.users.find((x) => x.id === id)).filter(Boolean);
      const accs = studs.map((s) => this._summary(d, s).accuracy);
      return { id: c.id, name: c.name, students: studs.length, avgAccuracy: accs.length ? accs.reduce((a, b) => a + b, 0) / accs.length : 0 };
    });
  },
  async classRoster(classId) {
    const d = db(); const c = (d.classes || []).find((x) => x.id === classId);
    if (!c) return [];
    return c.studentIds.map((id) => d.users.find((x) => x.id === id)).filter(Boolean).map((s) => this._summary(d, s));
  },
  async listJournal({ classId, studentId } = {}) {
    const d = db(); let arr = (d.journal || []);
    if (classId) arr = arr.filter((e) => e.classId === classId);
    if (studentId) arr = arr.filter((e) => e.studentId === studentId);
    const nameOf = (id) => d.users.find((x) => x.id === id)?.name || '—';
    return arr.slice().sort((a, b) => b.at - a.at).map((e) => ({ ...e, studentName: nameOf(e.studentId), teacherName: nameOf(e.teacherId) }));
  },
  async addJournalEntry({ studentId, classId, kind, topic, mark, comment }) {
    const d = db(); const u = d.users.find((x) => x.id === storage.get(SES_KEY)?.userId);
    if (!u || u.role !== 'TEACHER') throw new Error('forbidden');
    const entry = { id: uid(), studentId, classId, teacherId: u.id, kind, topic: topic || '', mark: mark == null || mark === '' ? null : Number(mark), comment: comment || '', at: now() };
    d.journal.unshift(entry); save(d); return entry;
  },
  async deleteJournalEntry(id) { const d = db(); d.journal = (d.journal || []).filter((e) => e.id !== id); save(d); },
  async myChildren() {
    const d = db(); const u = d.users.find((x) => x.id === storage.get(SES_KEY)?.userId);
    if (!u) throw new Error('auth');
    return (u.childIds || []).map((id) => d.users.find((x) => x.id === id)).filter(Boolean).map((s) => this._summary(d, s));
  },
  async childDiary(childId) {
    const d = db(); const u = d.users.find((x) => x.id === storage.get(SES_KEY)?.userId);
    if (!u) throw new Error('auth');
    if (u.role === 'PARENT' && !(u.childIds || []).includes(childId)) throw new Error('forbidden');
    const nameOf = (id) => d.users.find((x) => x.id === id)?.name || '—';
    const child = d.users.find((x) => x.id === childId);
    const entries = (d.journal || []).filter((e) => e.studentId === childId).sort((a, b) => b.at - a.at).map((e) => ({ ...e, teacherName: nameOf(e.teacherId) }));
    return { summary: this._summary(d, child), entries };
  },
  async resetDemo() { storage.del(DB_KEY); storage.del(SES_KEY); },
};

/* ================= HTTP backend (Node + PostgreSQL, apps/api) ================= */
function makeHttpApi(base) {
  let tokens = storage.get('aet_jwt', null);
  const setTokens = (t) => { tokens = t; storage.set('aet_jwt', t); };
  async function call(path, { method = 'GET', body, retry = true } = {}) {
    const res = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401 && retry && tokens?.refresh) {
      const r = await fetch(base + '/api/auth/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: tokens.refresh }) });
      if (r.ok) { setTokens(await r.json()); return call(path, { method, body, retry: false }); }
      setTokens(null);
    }
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'http_' + res.status);
    return res.status === 204 ? null : res.json();
  }
  return {
    demo: false,
    async register(p) { const r = await call('/api/auth/register', { method: 'POST', body: p }); setTokens(r.tokens); return r.user; },
    async login(p) { const r = await call('/api/auth/login', { method: 'POST', body: p }); setTokens(r.tokens); return r.user; },
    async logout() { try { await call('/api/auth/logout', { method: 'POST', body: { refreshToken: tokens?.refresh } }); } catch {} setTokens(null); },
    async current() { if (!tokens) return null; try { return await call('/api/me'); } catch { return null; } },
    async updateProfile(patch) { return call('/api/me', { method: 'PATCH', body: patch }); },
    async addAttempt(p) { return call('/api/progress/attempt', { method: 'POST', body: p }); },
    async getStats() { return call('/api/progress/stats'); },
    async earn(p) { return call('/api/economy/earn', { method: 'POST', body: p }); },
    async spend(p) { return call('/api/economy/spend', { method: 'POST', body: p }); },
    async getUnlocks() { return call('/api/economy/unlocks'); },
    async listUsers(q) { return call('/api/admin/users?search=' + encodeURIComponent(q || '')); },
    async patchUser(id, patch) { return call('/api/admin/users/' + id, { method: 'PATCH', body: patch }); },
    async deleteUser(id) { return call('/api/admin/users/' + id, { method: 'DELETE' }); },
    async analytics() { return call('/api/admin/analytics'); },
    async getSettings() { return call('/api/admin/settings'); },
    async putSetting(key, value) { return call('/api/admin/settings', { method: 'PUT', body: { key, value } }); },
    async addMaterial(p) { return call('/api/materials', { method: 'POST', body: p }); },
    async listMaterials() { return call('/api/materials'); },
    async deleteMaterial(id) { return call('/api/materials/' + id, { method: 'DELETE' }); },
    async getMaterialTasks() { return call('/api/materials/tasks'); },
    async myClasses() { return call('/api/teacher/classes'); },
    async classRoster(id) { return call('/api/teacher/classes/' + id + '/roster'); },
    async listJournal(p = {}) { const q = new URLSearchParams(p).toString(); return call('/api/journal' + (q ? '?' + q : '')); },
    async addJournalEntry(p) { return call('/api/journal', { method: 'POST', body: p }); },
    async deleteJournalEntry(id) { return call('/api/journal/' + id, { method: 'DELETE' }); },
    async myChildren() { return call('/api/parent/children'); },
    async childDiary(id) { return call('/api/parent/children/' + id + '/diary'); },
    async resetDemo() {},
  };
}

const API_URL = import.meta.env.VITE_API_URL;
export const api = API_URL ? makeHttpApi(API_URL) : DemoApi;
