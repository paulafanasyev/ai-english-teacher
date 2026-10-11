// Class-level math data for the teacher cabinet (pure functions over the demo DB object).
// Stores: d.math = { log: [...], assignments: [...], results: [...], seeded }.
// No storage access here, so everything is unit-testable; see mathStore.js for the wrapper.
import { TOPICS, rng } from './problems.js';

const DAY = 86400000;
export const MIN_COUNT = 3;
export const MAX_COUNT = 15;

const uid = (r) => 'm' + Math.floor(r() * 1e9).toString(36) + Math.floor(r() * 1e9).toString(36);

export function topicTitle(topic) {
  for (const g of Object.keys(TOPICS)) {
    const t = TOPICS[g].find((x) => x.id === topic);
    if (t) return t.title;
  }
  return { ru: topic, en: topic, vi: topic };
}

export function markFor(solved, total) {
  if (!total) return null;
  const r = solved / total;
  return r >= 0.9 ? 5 : r >= 0.7 ? 4 : r >= 0.5 ? 3 : 2;
}

function classesOf(d, userId) { return (d.classes || []).filter((c) => c.studentIds.includes(userId)); }

// Creates d.math if missing and seeds a realistic demo once. Returns true if d changed.
export function ensureMath(d, now = Date.now()) {
  let changed = false;
  if (!d.math) { d.math = { log: [], assignments: [], results: [], seeded: false }; changed = true; }
  if (d.math.seeded) return changed;
  const c1 = (d.classes || []).find((c) => c.id === 'c1');
  if (c1) {
    // The demo student account joins the demo class, so a teacher assignment reaches it.
    if (d.users?.some((u) => u.id === 'u_student') && !c1.studentIds.includes('u_student')) c1.studentIds.push('u_student');
    const r = rng(20261011);
    const pool = [[6, 'frac_diff'], [6, 'negatives'], [6, 'proportion'], [7, 'linear'], [7, 'expand'], [7, 'powers']];
    c1.studentIds.filter((id) => id !== 'u_student').forEach((sid, i) => {
      const skill = 0.45 + ((i * 37) % 50) / 100; // 0.45..0.94, varied per student
      const weak = pool[i % pool.length][1];
      const n = 14 + Math.floor(r() * 16);
      for (let k = 0; k < n; k++) {
        const [grade, topic] = pool[Math.floor(r() * pool.length)];
        const p = topic === weak ? skill - 0.3 : skill;
        const correct = r() < p;
        const hints = correct ? (r() < p ? 0 : 1 + Math.floor(r() * 2)) : 3;
        d.math.log.push({ id: uid(r), userId: sid, grade, topic, correct, hints, revealed: !correct, at: now - Math.floor(r() * 14) * DAY - Math.floor(r() * DAY * 0.5) });
      }
    });
    const a = { id: 'ma_demo', classId: 'c1', teacherId: c1.teacherId, grade: 7, topic: 'linear', count: 6, seed: 7106, createdAt: now - 3 * DAY };
    d.math.assignments.push(a);
    c1.studentIds.slice(0, 3).forEach((sid, i) => {
      const solved = [6, 4, 5][i], hints = [1, 5, 3][i];
      d.math.results.push({ id: uid(r), assignmentId: a.id, studentId: sid, solved, total: 6, hints, at: now - (2 - i * 0.5) * DAY });
    });
  }
  d.math.seeded = true;
  return true;
}

export function logResult(d, { userId, grade, topic, correct, hints = 0, revealed = false, assignmentId = null, at = Date.now() }) {
  ensureMath(d, at);
  if (!TOPICS[grade]?.some((t) => t.id === topic)) return null;
  // An assignment id is kept only if it belongs to one of the student's classes.
  if (assignmentId) {
    const a = d.math.assignments.find((x) => x.id === assignmentId);
    if (!a || !classesOf(d, userId).some((cl) => cl.id === a.classId)) assignmentId = null;
  }
  d.math.log.push({ id: 'l' + at.toString(36) + d.math.log.length, userId, grade, topic, correct: !!correct, hints: Math.max(0, Math.min(3, hints | 0)), revealed: !!revealed, assignmentId, at });
}

function summarize(entries) {
  const total = entries.length, correct = entries.filter((e) => e.correct).length;
  const hints = entries.reduce((a, e) => a + (e.hints || 0), 0);
  const byTopic = {};
  for (const e of entries) {
    const t = (byTopic[e.topic] ||= { total: 0, correct: 0, hints: 0 });
    t.total++; if (e.correct) t.correct++; t.hints += e.hints || 0;
  }
  let weak = null;
  for (const [topic, t] of Object.entries(byTopic)) {
    if (t.total < 3) continue;
    const acc = t.correct / t.total;
    if (acc < 0.6 && (!weak || acc < weak.acc)) weak = { topic, acc };
  }
  return { total, correct, acc: total ? correct / total : 0, avgHints: total ? hints / total : 0, byTopic, weak: weak?.topic || null };
}

export const ownsClass = (d, classId, teacherId) => !!(d.classes || []).find((x) => x.id === classId && x.teacherId === teacherId);

export function classMathStats(d, classId) {
  const c = (d.classes || []).find((x) => x.id === classId);
  if (!c || !d.math) return { students: [], class: summarize([]) };
  const log = d.math.log.filter((e) => c.studentIds.includes(e.userId));
  const students = c.studentIds.map((id) => d.users.find((u) => u.id === id)).filter(Boolean)
    .map((u) => ({ id: u.id, name: u.name, ...summarize(log.filter((e) => e.userId === u.id)) }));
  return { students, class: summarize(log) };
}

export function createAssignment(d, { classId, teacherId, grade, topic, count, now = Date.now() }) {
  const c = (d.classes || []).find((x) => x.id === classId);
  if (!c || c.teacherId !== teacherId) throw new Error('forbidden');
  if (!TOPICS[grade]) throw new Error('grade');
  if (topic !== 'any' && !TOPICS[grade].some((t) => t.id === topic)) throw new Error('topic');
  const n = Math.max(MIN_COUNT, Math.min(MAX_COUNT, count | 0));
  ensureMath(d, now);
  const a = { id: 'ma' + now.toString(36) + d.math.assignments.length, classId, teacherId, grade, topic, count: n, seed: (now % 2147483647) >>> 0, createdAt: now };
  d.math.assignments.unshift(a);
  return a;
}

export function deleteAssignment(d, { id, teacherId }) {
  if (!d.math) return;
  const a = d.math.assignments.find((x) => x.id === id);
  if (!a || a.teacherId !== teacherId) throw new Error('forbidden');
  d.math.assignments = d.math.assignments.filter((x) => x.id !== id);
  d.math.results = d.math.results.filter((x) => x.assignmentId !== id);
}

export function classAssignments(d, classId) {
  const c = (d.classes || []).find((x) => x.id === classId);
  if (!c || !d.math) return [];
  return d.math.assignments.filter((a) => a.classId === classId).map((a) => {
    const res = d.math.results.filter((r) => r.assignmentId === a.id);
    return { ...a, done: res.length, of: c.studentIds.length,
      results: res.map((r) => ({ ...r, name: d.users.find((u) => u.id === r.studentId)?.name || '—', mark: markFor(r.solved, r.total) })) };
  });
}

export function openAssignmentsFor(d, userId) {
  if (!d.math) return [];
  const ids = new Set(classesOf(d, userId).map((c) => c.id));
  const done = new Set(d.math.results.filter((r) => r.studentId === userId).map((r) => r.assignmentId));
  return d.math.assignments.filter((a) => ids.has(a.classId) && !done.has(a.id));
}

// Idempotent: a second completion of the same assignment by the same student is ignored.
export function completeAssignment(d, { assignmentId, userId, solved, total, hints, now = Date.now() }) {
  if (!d.math) return null;
  const a = d.math.assignments.find((x) => x.id === assignmentId);
  if (!a || !classesOf(d, userId).some((c) => c.id === a.classId)) return null;
  if (d.math.results.some((r) => r.assignmentId === assignmentId && r.studentId === userId)) return null;
  // The size comes from the assignment itself, never from the client.
  total = a.count;
  const s = Math.max(0, Math.min(total, Number(solved) | 0));
  hints = Math.max(0, Math.min(total * 3, Number(hints) | 0));
  const res = { id: 'mr' + now.toString(36) + d.math.results.length, assignmentId, studentId: userId, solved: s, total, hints, at: now };
  d.math.results.push(res);
  const title = topicTitle(a.topic).ru;
  const entry = { id: 'j' + res.id, studentId: userId, classId: a.classId, teacherId: a.teacherId, kind: 'homework', topic: '',
    mark: markFor(s, total), comment: `Математика (${a.grade} кл.): ${a.topic === 'any' ? 'разные темы' : title}. Решено сам ${s} из ${total}, подсказок ${hints}.`, at: now };
  (d.journal ||= []).unshift(entry);
  return res;
}
