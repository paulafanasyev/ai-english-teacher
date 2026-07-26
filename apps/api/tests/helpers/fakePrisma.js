// In-memory fake Prisma client used exclusively by tests, so the full test
// suite runs without any live PostgreSQL database.
//
// It implements only the subset of Prisma Client's query surface that the
// route code in src/routes/*.js actually calls: findUnique, findFirst,
// findMany (no-filter — routes that need filtering do it in JS after a
// findMany({}) call, matching how the real routes are written), create,
// update (including { increment }/{ decrement } field operations), upsert,
// delete, and $transaction (which receives a callback and must expose the
// same model API on the `tx` object it passes in).
//
// Each model is backed by a plain Map keyed by an internal primary key
// (id for most models, key for Setting) preserving insertion order, which
// is what allows deterministic, reproducible test behavior.

import crypto from 'node:crypto';

function cuid() {
  return `c${crypto.randomBytes(12).toString('hex')}`;
}

// Deep-clone a record while preserving Date instances (JSON.stringify would
// turn them into ISO strings, which silently breaks `date < new Date()`
// comparisons elsewhere in the codebase: JS compares a string operand
// against a Date via Date.prototype.toString(), not toISOString(), which
// does NOT sort chronologically). Prisma's real client always returns
// actual Date objects for DateTime fields, so the fake must match that.
function clone(obj) {
  if (obj === undefined || obj === null) return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (Array.isArray(obj)) return obj.map(clone);
  if (typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = clone(v);
    }
    return out;
  }
  return obj;
}

/**
 * Apply a Prisma-style `data` object (which may contain nested
 * { increment } / { decrement } / { set } operators) onto an existing
 * record, returning a new merged record.
 */
function applyUpdateData(existing, data) {
  const next = { ...existing };
  for (const [field, value] of Object.entries(data)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      if ('increment' in value) {
        next[field] = (existing[field] || 0) + value.increment;
        continue;
      }
      if ('decrement' in value) {
        next[field] = (existing[field] || 0) - value.decrement;
        continue;
      }
      if ('set' in value) {
        next[field] = value.set;
        continue;
      }
    }
    next[field] = value;
  }
  return next;
}

function matchesWhere(record, where = {}) {
  return Object.entries(where).every(([key, cond]) => {
    // Support the small operator subset the Phase-10 routes use: { in: [...] }, { not: x }.
    if (cond && typeof cond === 'object' && !Array.isArray(cond) && !(cond instanceof Date)) {
      if ('in' in cond) return Array.isArray(cond.in) && cond.in.includes(record[key]);
      if ('not' in cond) return record[key] !== cond.not;
      return false; // unsupported operator → explicit non-match
    }
    return record[key] === cond;
  });
}

// Minimal single-field orderBy: { field: 'asc' | 'desc' } (Dates compared by time).
function applyOrderBy(rows, orderBy) {
  const entry = Object.entries(orderBy || {})[0];
  if (!entry) return rows;
  const [field, dir] = entry;
  const sorted = rows.slice().sort((a, b) => {
    const av = a[field] instanceof Date ? a[field].getTime() : a[field];
    const bv = b[field] instanceof Date ? b[field].getTime() : b[field];
    if (av < bv) return -1;
    if (av > bv) return 1;
    return 0;
  });
  return dir === 'desc' ? sorted.reverse() : sorted;
}

// Resolve the relation `include` shapes used by the teacher/journal/parent routes:
//   class    → enrollments (optionally nested { include: { student } })
//   *        → student (by studentId), teacher (by teacherId)
async function resolveInclude(modelName, record, include, models) {
  const out = { ...record };
  for (const [rel, spec] of Object.entries(include || {})) {
    if (!spec) continue;
    if (modelName === 'class' && rel === 'enrollments') {
      let enr = await models.enrollment.findMany({ where: { classId: record.id } });
      const nested = spec && typeof spec === 'object' ? spec.include : null;
      if (nested) enr = await Promise.all(enr.map((e) => resolveInclude('enrollment', e, nested, models)));
      out.enrollments = enr;
    } else if (rel === 'student') {
      out.student = await models.user.findUnique({ where: { id: record.studentId } });
    } else if (rel === 'teacher') {
      out.teacher = await models.user.findUnique({ where: { id: record.teacherId } });
    }
  }
  return out;
}

/**
 * Build a simple model store keyed by `keyField` (default "id").
 * `defaults` is applied to `create` calls to emulate Prisma schema defaults.
 */
function createModelStore({ keyField = 'id', defaults = () => ({}), autoKey = true } = {}) {
  const store = new Map();

  return {
    _store: store,

    async findUnique({ where } = {}) {
      if (!where) return null;
      const [key, value] = Object.entries(where)[0];
      if (key === keyField) {
        return clone(store.get(value) ?? null);
      }
      for (const record of store.values()) {
        if (matchesWhere(record, where)) return clone(record);
      }
      return null;
    },

    async findFirst({ where } = {}) {
      for (const record of store.values()) {
        if (matchesWhere(record, where || {})) return clone(record);
      }
      return null;
    },

    async findMany({ where } = {}) {
      const all = [...store.values()];
      const filtered = where ? all.filter((r) => matchesWhere(r, where)) : all;
      return filtered.map(clone);
    },

    async create({ data }) {
      const record = { ...defaults(), ...data };
      if (autoKey && record[keyField] === undefined) {
        record[keyField] = cuid();
      }
      store.set(record[keyField], record);
      return clone(record);
    },

    async update({ where, data }) {
      const [key, value] = Object.entries(where)[0];
      let existing;
      let storeKey;
      if (key === keyField) {
        existing = store.get(value);
        storeKey = value;
      } else {
        for (const [k, r] of store.entries()) {
          if (matchesWhere(r, where)) {
            existing = r;
            storeKey = k;
            break;
          }
        }
      }
      if (!existing) {
        const err = new Error(`Record not found for update (${JSON.stringify(where)})`);
        err.code = 'P2025';
        throw err;
      }
      const updated = applyUpdateData(existing, data);
      store.set(storeKey, updated);
      return clone(updated);
    },

    async upsert({ where, create, update }) {
      const [key, value] = Object.entries(where)[0];
      const existing = key === keyField ? store.get(value) : [...store.values()].find((r) => matchesWhere(r, where));

      if (existing) {
        const storeKey = key === keyField ? value : existing[keyField];
        const updated = applyUpdateData(existing, update);
        store.set(storeKey, updated);
        return clone(updated);
      }

      const record = { ...defaults(), ...create };
      if (record[keyField] === undefined) {
        record[keyField] = key === keyField ? value : cuid();
      }
      store.set(record[keyField], record);
      return clone(record);
    },

    async delete({ where }) {
      const [key, value] = Object.entries(where)[0];
      if (key === keyField) {
        const existing = store.get(value);
        if (!existing) {
          const err = new Error('Record not found for delete');
          err.code = 'P2025';
          throw err;
        }
        store.delete(value);
        return clone(existing);
      }
      for (const [k, r] of store.entries()) {
        if (matchesWhere(r, where)) {
          store.delete(k);
          return clone(r);
        }
      }
      const err = new Error('Record not found for delete');
      err.code = 'P2025';
      throw err;
    },

    async count({ where } = {}) {
      const all = [...store.values()];
      return (where ? all.filter((r) => matchesWhere(r, where)) : all).length;
    },

    // Test-only helper for direct inspection/seeding without going through
    // the Prisma-shaped API.
    _reset() {
      store.clear();
    },
  };
}

export function createFakePrisma() {
  const models = {
    user: createModelStore({
      defaults: () => ({
        role: 'STUDENT',
        blocked: false,
        level: 'A1',
        xp: 0,
        coins: 0,
        teacherId: null,
        locale: 'ru',
        createdAt: new Date(),
      }),
    }),
    refreshToken: createModelStore({
      defaults: () => ({ revoked: false, createdAt: new Date() }),
    }),
    attempt: createModelStore({
      defaults: () => ({ createdAt: new Date() }),
    }),
    unlock: createModelStore({
      defaults: () => ({ createdAt: new Date() }),
    }),
    material: createModelStore({
      defaults: () => ({ createdAt: new Date() }),
    }),
    setting: createModelStore({
      keyField: 'key',
      autoKey: false,
      defaults: () => ({}),
    }),
    adminLog: createModelStore({
      defaults: () => ({ createdAt: new Date() }),
    }),
    // Phase 10 — cabinets / journal
    class: createModelStore({ defaults: () => ({ createdAt: new Date() }) }),
    enrollment: createModelStore({ defaults: () => ({ createdAt: new Date() }) }),
    parentLink: createModelStore({ defaults: () => ({ createdAt: new Date() }) }),
    journalEntry: createModelStore({ defaults: () => ({ topic: '', mark: null, comment: '', createdAt: new Date() }) }),
  };

  // Wrap the relational models so findMany/findUnique/findFirst honor
  // `orderBy` and `include` (the base store ignores both).
  function wrapRel(name) {
    const base = models[name];
    return {
      ...base,
      async findMany(args = {}) {
        let rows = await base.findMany({ where: args.where });
        if (args.orderBy) rows = applyOrderBy(rows, args.orderBy);
        if (args.include) rows = await Promise.all(rows.map((r) => resolveInclude(name, r, args.include, models)));
        return rows;
      },
      async findUnique(args = {}) {
        const r = await base.findUnique({ where: args.where });
        return r && args.include ? resolveInclude(name, r, args.include, models) : r;
      },
      async findFirst(args = {}) {
        const r = await base.findFirst({ where: args.where });
        return r && args.include ? resolveInclude(name, r, args.include, models) : r;
      },
    };
  }

  const client = {
    ...models,
    // relational models with include/orderBy support (override the base stores)
    class: wrapRel('class'),
    enrollment: wrapRel('enrollment'),
    parentLink: wrapRel('parentLink'),
    journalEntry: wrapRel('journalEntry'),

    async $transaction(arg) {
      // Only the callback form is used by the route code in this project.
      if (typeof arg === 'function') {
        // The in-memory store has no real atomicity concerns (single JS
        // event loop, synchronous Map mutation), so we simply invoke the
        // callback with the same client shape as `tx`.
        return arg(client);
      }
      // Array form: run sequentially and return results array.
      const results = [];
      for (const p of arg) {
        results.push(await p);
      }
      return results;
    },

    async $disconnect() {
      // no-op for the fake
    },

    async $connect() {
      // no-op for the fake
    },

    _resetAll() {
      for (const model of Object.values(models)) {
        model._reset();
      }
    },
  };

  return client;
}
