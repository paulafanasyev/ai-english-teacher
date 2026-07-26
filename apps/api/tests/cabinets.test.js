// Phase 10 cabinets — RBAC + happy-path coverage for the teacher, journal and
// parent routes. Uses the in-memory fake Prisma (no live DB), mirroring the
// pattern established in rbac.test.js.
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

import { setPrismaForTests } from '../src/lib/prisma.js';
import { createFakePrisma } from './helpers/fakePrisma.js';
import { createApp } from '../src/app.js';

let app;
let fakePrisma;
let teacher, other, parent, admin, s1, s2, s3, cls;

async function makeUser(role, email) {
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'password123', name: role.toLowerCase() });
  const id = reg.body.user.id;
  if (role !== 'STUDENT') {
    await fakePrisma.user.update({ where: { id }, data: { role } });
  }
  // Re-login so the access token carries the updated role claim.
  const login = await request(app).post('/api/auth/login').send({ email, password: 'password123' });
  return { id, token: login.body.accessToken };
}

const auth = (u) => ({ Authorization: `Bearer ${u.token}` });

beforeEach(async () => {
  fakePrisma = createFakePrisma();
  setPrismaForTests(fakePrisma);
  app = createApp();

  teacher = await makeUser('TEACHER', 'teacher@example.com');
  other = await makeUser('TEACHER', 'other@example.com');
  parent = await makeUser('PARENT', 'parent@example.com');
  admin = await makeUser('ADMIN', 'admin@example.com');
  s1 = await makeUser('STUDENT', 's1@example.com'); // in class + parent's child
  s2 = await makeUser('STUDENT', 's2@example.com'); // in class, NOT parent's child
  s3 = await makeUser('STUDENT', 's3@example.com'); // NOT enrolled anywhere

  cls = await fakePrisma.class.create({ data: { name: '5A', teacherId: teacher.id } });
  await fakePrisma.enrollment.create({ data: { classId: cls.id, studentId: s1.id } });
  await fakePrisma.enrollment.create({ data: { classId: cls.id, studentId: s2.id } });
  await fakePrisma.parentLink.create({ data: { parentId: parent.id, studentId: s1.id } });
  await fakePrisma.journalEntry.create({
    data: { studentId: s1.id, classId: cls.id, teacherId: teacher.id, kind: 'lesson', topic: 'basics', mark: 5, comment: 'well done' },
  });
});

describe('Teacher cabinet — /api/teacher', () => {
  it('lets a teacher list their classes with student counts', async () => {
    const res = await request(app).get('/api/teacher/classes').set(auth(teacher));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ name: '5A', students: 2 });
  });

  it('returns a class roster with per-student summaries', async () => {
    const res = await request(app).get(`/api/teacher/classes/${cls.id}/roster`).set(auth(teacher));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.map((s) => s.name).sort()).toEqual(['student', 'student']); // seeded names
    expect(res.body[0]).toHaveProperty('accuracy');
  });

  it("forbids a teacher from viewing another teacher's class roster (403)", async () => {
    const res = await request(app).get(`/api/teacher/classes/${cls.id}/roster`).set(auth(other));
    expect(res.status).toBe(403);
  });

  it('404s for an unknown class', async () => {
    const res = await request(app).get('/api/teacher/classes/does-not-exist/roster').set(auth(teacher));
    expect(res.status).toBe(404);
  });

  it('forbids a STUDENT from the teacher cabinet (403)', async () => {
    const res = await request(app).get('/api/teacher/classes').set(auth(s1));
    expect(res.status).toBe(403);
  });

  it('lets an ADMIN see all classes', async () => {
    const res = await request(app).get('/api/teacher/classes').set(auth(admin));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

describe('Electronic journal — /api/journal', () => {
  it('lets a teacher add an entry for a student in their class (201)', async () => {
    const res = await request(app)
      .post('/api/journal')
      .set(auth(teacher))
      .send({ studentId: s1.id, classId: cls.id, kind: 'homework', topic: 'food', mark: 4, comment: 'ok' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ studentId: s1.id, kind: 'homework', mark: 4 });
  });

  it('forbids a teacher from grading a student not in their class (403)', async () => {
    const res = await request(app)
      .post('/api/journal')
      .set(auth(teacher))
      .send({ studentId: s3.id, kind: 'lesson', topic: 'basics', mark: 5 });
    expect(res.status).toBe(403);
  });

  it('forbids a STUDENT from creating entries (403)', async () => {
    const res = await request(app)
      .post('/api/journal')
      .set(auth(s1))
      .send({ studentId: s1.id, kind: 'lesson', topic: 'basics', mark: 5 });
    expect(res.status).toBe(403);
  });

  it('scopes journal reads for a STUDENT to their own entries', async () => {
    const own = await request(app).get('/api/journal').set(auth(s1));
    expect(own.status).toBe(200);
    expect(own.body.length).toBe(1);
    expect(own.body[0].studentId).toBe(s1.id);

    const none = await request(app).get('/api/journal').set(auth(s2));
    expect(none.status).toBe(200);
    expect(none.body.length).toBe(0);
  });

  it("lets a parent read their child's entries but not another student's", async () => {
    const okRes = await request(app).get(`/api/journal?studentId=${s1.id}`).set(auth(parent));
    expect(okRes.status).toBe(200);
    expect(okRes.body.length).toBe(1);

    const forbidden = await request(app).get(`/api/journal?studentId=${s2.id}`).set(auth(parent));
    expect(forbidden.status).toBe(403);
  });

  it('lets the owning teacher delete an entry but not another teacher', async () => {
    const list = await request(app).get(`/api/journal?classId=${cls.id}`).set(auth(teacher));
    const entryId = list.body[0].id;

    const denied = await request(app).delete(`/api/journal/${entryId}`).set(auth(other));
    expect(denied.status).toBe(403);

    const okDel = await request(app).delete(`/api/journal/${entryId}`).set(auth(teacher));
    expect(okDel.status).toBe(200);
  });
});

describe('Parent cabinet — /api/parent', () => {
  it('lists a parent’s linked children', async () => {
    const res = await request(app).get('/api/parent/children').set(auth(parent));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(s1.id);
  });

  it("returns a child's diary (summary + entries) to the linked parent", async () => {
    const res = await request(app).get(`/api/parent/children/${s1.id}/diary`).set(auth(parent));
    expect(res.status).toBe(200);
    expect(res.body.summary).toMatchObject({ id: s1.id });
    expect(res.body.entries.length).toBe(1);
    expect(res.body.entries[0]).toHaveProperty('teacherName');
  });

  it('forbids a parent from viewing a non-linked child (403)', async () => {
    const res = await request(app).get(`/api/parent/children/${s2.id}/diary`).set(auth(parent));
    expect(res.status).toBe(403);
  });

  it('forbids a TEACHER from the parent cabinet (403)', async () => {
    const res = await request(app).get('/api/parent/children').set(auth(teacher));
    expect(res.status).toBe(403);
  });

  it('lets an ADMIN read any child diary', async () => {
    const res = await request(app).get(`/api/parent/children/${s1.id}/diary`).set(auth(admin));
    expect(res.status).toBe(200);
  });
});

describe('Auth guards', () => {
  it('rejects unauthenticated cabinet requests with 401', async () => {
    for (const path of ['/api/teacher/classes', '/api/journal', '/api/parent/children']) {
      const res = await request(app).get(path);
      expect(res.status).toBe(401);
    }
  });
});
