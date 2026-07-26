// Parent cabinet: linked children and their diary. (Phase 10)
import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { summarize } from './teacher.js';

const router = Router();
router.use(requireAuth, requireRole('PARENT', 'ADMIN'));

// GET /api/parent/children
router.get('/children', async (req, res, next) => {
  try {
    const links = await prisma.parentLink.findMany({
      where: req.user.role === 'ADMIN' ? {} : { parentId: req.user.id },
      include: { student: true },
    });
    const ids = links.map((l) => l.studentId);
    const attempts = await prisma.attempt.findMany({ where: { userId: { in: ids } } });
    res.json(links.map((l) => summarize(l.student, attempts)));
  } catch (err) { next(err); }
});

const childParams = z.object({ id: z.string().trim().min(1) });

// GET /api/parent/children/:id/diary
router.get('/children/:id/diary', validate({ params: childParams }), async (req, res, next) => {
  try {
    if (req.user.role === 'PARENT') {
      const link = await prisma.parentLink.findFirst({ where: { parentId: req.user.id, studentId: req.params.id } });
      if (!link) return res.status(403).json({ error: 'Not your child' });
    }
    const child = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!child) return res.status(404).json({ error: 'Not found' });
    const attempts = await prisma.attempt.findMany({ where: { userId: child.id } });
    const entries = await prisma.journalEntry.findMany({
      where: { studentId: child.id }, orderBy: { createdAt: 'desc' }, include: { teacher: true },
    });
    res.json({
      summary: summarize(child, attempts),
      entries: entries.map((e) => ({
        id: e.id, kind: e.kind, topic: e.topic, mark: e.mark, comment: e.comment,
        at: new Date(e.createdAt).getTime(), teacherName: e.teacher?.name,
      })),
    });
  } catch (err) { next(err); }
});

export default router;
