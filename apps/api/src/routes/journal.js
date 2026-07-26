// Electronic journal: list / create / delete entries with role-scoped access. (Phase 10)
import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth);

function serialize(e) {
  return {
    id: e.id, studentId: e.studentId, classId: e.classId, teacherId: e.teacherId,
    kind: e.kind, topic: e.topic, mark: e.mark, comment: e.comment,
    at: new Date(e.createdAt).getTime(),
    studentName: e.student?.name, teacherName: e.teacher?.name,
  };
}

const listQuery = z.object({
  classId: z.string().trim().optional(),
  studentId: z.string().trim().optional(),
});

// GET /api/journal?classId=&studentId=
router.get('/', validate({ query: listQuery }), async (req, res, next) => {
  try {
    const { classId, studentId } = req.query;
    const where = {};
    if (classId) where.classId = classId;
    if (studentId) where.studentId = studentId;

    const role = req.user.role;
    if (role === 'STUDENT') {
      where.studentId = req.user.id;
    } else if (role === 'PARENT') {
      const links = await prisma.parentLink.findMany({ where: { parentId: req.user.id } });
      const childIds = links.map((l) => l.studentId);
      if (where.studentId) {
        if (!childIds.includes(where.studentId)) return res.status(403).json({ error: 'Forbidden' });
      } else {
        where.studentId = { in: childIds };
      }
    } else if (role === 'TEACHER') {
      const classes = await prisma.class.findMany({ where: { teacherId: req.user.id }, include: { enrollments: true } });
      const myClassIds = classes.map((c) => c.id);
      const myStudentIds = [...new Set(classes.flatMap((c) => c.enrollments.map((e) => e.studentId)))];
      if (where.classId && !myClassIds.includes(where.classId)) return res.status(403).json({ error: 'Forbidden' });
      if (where.studentId && !myStudentIds.includes(where.studentId)) return res.status(403).json({ error: 'Forbidden' });
      if (!where.classId && !where.studentId) where.studentId = { in: myStudentIds };
    } // ADMIN: unrestricted

    const entries = await prisma.journalEntry.findMany({
      where, orderBy: { createdAt: 'desc' }, include: { student: true, teacher: true },
    });
    res.json(entries.map(serialize));
  } catch (err) { next(err); }
});

const createBody = z.object({
  studentId: z.string().trim().min(1),
  classId: z.string().trim().nullable().optional(),
  kind: z.enum(['lesson', 'quiz', 'homework', 'note']),
  topic: z.string().trim().max(60).optional().default(''),
  mark: z.coerce.number().int().min(2).max(5).nullable().optional(),
  comment: z.string().trim().max(500).optional().default(''),
});

// POST /api/journal
router.post('/', requireRole('TEACHER', 'ADMIN'), validate({ body: createBody }), async (req, res, next) => {
  try {
    const { studentId, classId, kind, topic, mark, comment } = req.body;
    if (req.user.role === 'TEACHER') {
      const classes = await prisma.class.findMany({ where: { teacherId: req.user.id }, include: { enrollments: true } });
      const ok = classes.some((c) => c.enrollments.some((e) => e.studentId === studentId));
      if (!ok) return res.status(403).json({ error: 'Student not in your class' });
    }
    const entry = await prisma.journalEntry.create({
      data: {
        studentId, classId: classId || null, teacherId: req.user.id, kind,
        topic: topic || '', mark: kind === 'note' ? null : (mark ?? null), comment: comment || '',
      },
    });
    res.status(201).json(serialize(entry));
  } catch (err) { next(err); }
});

const idParams = z.object({ id: z.string().trim().min(1) });

// DELETE /api/journal/:id
router.delete('/:id', requireRole('TEACHER', 'ADMIN'), validate({ params: idParams }), async (req, res, next) => {
  try {
    const entry = await prisma.journalEntry.findUnique({ where: { id: req.params.id } });
    if (!entry) return res.status(404).json({ error: 'Not found' });
    if (req.user.role === 'TEACHER' && entry.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await prisma.journalEntry.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
