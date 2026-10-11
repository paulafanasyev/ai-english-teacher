// Thin storage wrapper around classMath.js for the local demo backend.
// Works only in demo mode (api.demo): the HTTP backend will get its own endpoints later.
// Demo limitation: localStorage has no transactions, two tabs writing at once can lose a write.
import { storage } from '../../core/storage.js';
import { api } from '../../core/api.js';
import * as C from './classMath.js';

export const DB_STORAGE_KEY = 'aet_db_v3'; // same key DemoApi uses in core/api.js
const DB_KEY = DB_STORAGE_KEY;
const SES_KEY = 'aet_session';

export const mathCabinetAvailable = () => !!api.demo;

function withDb(fn, write = false) {
  if (!api.demo) return null;
  const d = storage.get(DB_KEY);
  if (!d) return null;
  const changed = C.ensureMath(d);
  const me = d.users?.find((u) => u.id === storage.get(SES_KEY)?.userId) || null;
  const out = fn(d, me);
  if (write || changed) storage.set(DB_KEY, d);
  return out;
}

export const mathStore = {
  log(entry) { withDb((d, me) => { if (me) C.logResult(d, { ...entry, userId: me.id }); }, true); },
  // Reads are limited to the teacher who owns the class.
  classStats(classId) { return withDb((d, me) => (me && C.ownsClass(d, classId, me.id) ? C.classMathStats(d, classId) : null)) || { students: [], class: { total: 0, byTopic: {} } }; },
  classAssignments(classId) { return withDb((d, me) => (me && C.ownsClass(d, classId, me.id) ? C.classAssignments(d, classId) : [])) || []; },
  assign({ classId, grade, topic, count }) {
    return withDb((d, me) => { if (!me) throw new Error('auth'); return C.createAssignment(d, { classId, teacherId: me.id, grade, topic, count }); }, true);
  },
  remove(id) { return withDb((d, me) => { if (!me) throw new Error('auth'); C.deleteAssignment(d, { id, teacherId: me.id }); }, true); },
  myOpen() { return withDb((d, me) => (me ? C.openAssignmentsFor(d, me.id) : [])) || []; },
  complete({ assignmentId, solved, total, hints }) {
    return withDb((d, me) => (me ? C.completeAssignment(d, { assignmentId, userId: me.id, solved, total, hints }) : null), true);
  },
};
