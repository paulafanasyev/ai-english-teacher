// Teacher cabinet: classes and class rosters. (Phase 10)
import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth, requireRole('TEACHER', 'ADMIN'));

const DAY = 86400000;

export function summarize(user, attempts) {
  const mine = attempts.filter((a) => a.userId === user.id);
  const correct = mine.filter((a) => a.correct).length;
  const days = new Set(mine.map((a) => Math.floor(new Date(a.createdAt).getTime() / DAY)));
  let streak = 0, cur = Math.floor(Date.now() / DAY);
  while (days.has(cur)) { streak += 1; cur -= 1; }
  const lastActive = mine.length
    ? Math.max(...mine.map((a) => new Date(a.createdAt).getTime()))
    : new Date(user.createdAt).getTime();
  return {
    id: user.id, name: user.name, level: user.level, xp: user.xp, coins: user.coins,
    attempts: mine.length, correct, accuracy: mine.length ? correct / mine.length : 0, streak, lastActive,
  };
}

// GET /api/teacher/classes
router.get('/classes', async (req, res, next) => {
  try {
    const where = req.user.role === 'ADMIN' ? {} : { teacherId: req.user.id };
    const classes = await prisma.class.findMany({ where, include: { enrollments: true } });
    const attempts = await prisma.attempt.findMany({});
    const out = classes.map((c) => {
      const ids = c.enrollments.map((e) => e.studentId);
      const accs = ids.map((id) => {
        const mine = attempts.filter((a) => a.userId === id);
        return mine.length ? mine.filter((a) => a.correct).length / mine.length : 0;
      });
      return { id: c.id, name: c.name, students: ids.length, avgAccuracy: accs.length ? accs.reduce((a, b) => a + b, 0) / accs.length : 0 };
    });
    res.json(out);
  } catch (err) { next(err); }
});

const classParams = z.object({ id: z.string().trim().min(1) });

// GET /api/teacher/classes/:id/roster
router.get('/classes/:id/roster', validate({ params: classParams }), async (req, res, next) => {
  try {
    const cls = await prisma.class.findUnique({
      where: { id: req.params.id },
      include: { enrollments: { include: { student: true } } },
    });
    if (!cls) return res.status(404).json({ error: 'Class not found' });
    if (req.user.role !== 'ADMIN' && cls.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'Not your class' });
    }
    const ids = cls.enrollments.map((e) => e.studentId);
    const attempts = await prisma.attempt.findMany({ where: { userId: { in: ids } } });
    res.json(cls.enrollments.map((e) => summarize(e.student, attempts)));
  } catch (err) { next(err); }
});

export default router;
