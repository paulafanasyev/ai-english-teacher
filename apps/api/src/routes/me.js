import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);

function publicUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

// GET /api/me
router.get('/', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

const patchSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  locale: z.string().trim().min(2).max(10).optional(),
  teacherId: z.string().trim().min(1).max(64).nullable().optional(),
  level: z.string().trim().min(1).max(10).optional(),
});

// PATCH /api/me
router.patch('/', validate({ body: patchSchema }), async (req, res, next) => {
  try {
    const data = req.body;
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data,
    });

    res.json({ user: publicUser(updated) });
  } catch (err) {
    next(err);
  }
});

// GET /api/me/summary — xp, coins, overall accuracy
router.get('/summary', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const attempts = await prisma.attempt.findMany({ where: { userId: req.user.id } });
    const total = attempts.length;
    const correctCount = attempts.filter((a) => a.correct).length;
    const accuracy = total > 0 ? correctCount / total : 0;

    res.json({
      xp: user.xp,
      coins: user.coins,
      accuracy,
      totalAttempts: total,
      correctAttempts: correctCount,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
