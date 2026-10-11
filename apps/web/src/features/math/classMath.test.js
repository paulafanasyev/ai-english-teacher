import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from './classMath.js';

const base = () => ({
  users: [
    { id: 'u_teacher', name: 'T', role: 'TEACHER' }, { id: 'u_s0', name: 'A' }, { id: 'u_s1', name: 'B' },
    { id: 'u_student', name: 'Саша' }, { id: 'u_x', name: 'Outsider' },
  ],
  classes: [{ id: 'c1', teacherId: 'u_teacher', studentIds: ['u_s0', 'u_s1'] }],
  journal: [],
});

test('marks', () => {
  assert.equal(C.markFor(6, 6), 5); assert.equal(C.markFor(5, 6), 4); assert.equal(C.markFor(3, 6), 3);
  assert.equal(C.markFor(2, 6), 2); assert.equal(C.markFor(0, 0), null);
});

test('seed once, enrolls demo student, stats have weak topics', () => {
  const d = base();
  assert.equal(C.ensureMath(d, 1e12), true);
  assert.ok(d.classes[0].studentIds.includes('u_student'));
  const n = d.math.log.length;
  assert.ok(n > 20);
  C.ensureMath(d, 1e12);
  assert.equal(d.math.log.length, n, 'seeding is not repeated');
  const s = C.classMathStats(d, 'c1');
  assert.equal(s.students.length, 3);
  assert.ok(s.students.every((x) => x.acc >= 0 && x.acc <= 1));
  assert.ok(s.students.some((x) => x.weak), 'at least one weak topic is detected');
});

test('assignment flow: create, see, complete once, journal mark', () => {
  const d = base(); C.ensureMath(d, 1e12);
  assert.throws(() => C.createAssignment(d, { classId: 'c1', teacherId: 'u_s0', grade: 7, topic: 'linear', count: 6 }), /forbidden/);
  assert.throws(() => C.createAssignment(d, { classId: 'c1', teacherId: 'u_teacher', grade: 7, topic: 'percent', count: 6 }), /topic/);
  const a = C.createAssignment(d, { classId: 'c1', teacherId: 'u_teacher', grade: 6, topic: 'proportion', count: 99, now: 2e12 });
  assert.equal(a.count, C.MAX_COUNT);
  assert.ok(C.openAssignmentsFor(d, 'u_student').some((x) => x.id === a.id));
  assert.equal(C.openAssignmentsFor(d, 'u_x').length, 0, 'outsiders see nothing');
  assert.equal(C.completeAssignment(d, { assignmentId: a.id, userId: 'u_x', solved: 1, total: 15, hints: 0 }), null);
  const r = C.completeAssignment(d, { assignmentId: a.id, userId: 'u_student', solved: 14, total: 15, hints: 2, now: 2e12 + 1 });
  assert.ok(r);
  assert.equal(C.completeAssignment(d, { assignmentId: a.id, userId: 'u_student', solved: 15, total: 15, hints: 0 }), null, 'idempotent');
  assert.equal(d.journal[0].mark, 5);
  assert.match(d.journal[0].comment, /Пропорции/);
  assert.ok(!C.openAssignmentsFor(d, 'u_student').some((x) => x.id === a.id));
  const list = C.classAssignments(d, 'c1').find((x) => x.id === a.id);
  assert.equal(list.done, 1); assert.equal(list.of, 3);
  assert.throws(() => C.deleteAssignment(d, { id: a.id, teacherId: 'u_s0' }), /forbidden/);
  C.deleteAssignment(d, { id: a.id, teacherId: 'u_teacher' });
  assert.ok(!C.classAssignments(d, 'c1').some((x) => x.id === a.id));
});

test('logResult clamps hints and feeds stats', () => {
  const d = base(); C.ensureMath(d, 1e12);
  for (let i = 0; i < 4; i++) C.logResult(d, { userId: 'u_student', grade: 7, topic: 'powers', correct: false, hints: 9, at: 1e12 + i });
  const me = C.classMathStats(d, 'c1').students.find((x) => x.id === 'u_student');
  assert.equal(me.byTopic.powers.total, 4);
  assert.equal(me.avgHints, 3);
  assert.equal(me.weak, 'powers');
});

test('completion uses assignment size; logs drop foreign assignment ids', () => {
  const d = base(); C.ensureMath(d, 1e12);
  const a = C.createAssignment(d, { classId: 'c1', teacherId: 'u_teacher', grade: 7, topic: 'linear', count: 6, now: 3e12 });
  const r = C.completeAssignment(d, { assignmentId: a.id, userId: 'u_s0', solved: 100, total: 100, hints: -5 });
  assert.equal(r.total, 6); assert.equal(r.solved, 6); assert.equal(r.hints, 0);
  C.logResult(d, { userId: 'u_x', grade: 7, topic: 'linear', correct: true, assignmentId: a.id, at: 3e12 });
  assert.equal(d.math.log.at(-1).assignmentId, null);
  assert.equal(C.logResult(d, { userId: 'u_s0', grade: 7, topic: 'nope', correct: true }), null);
  assert.ok(C.ownsClass(d, 'c1', 'u_teacher')); assert.ok(!C.ownsClass(d, 'c1', 'u_s0'));
});
