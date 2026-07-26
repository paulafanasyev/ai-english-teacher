import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { logAdminAction } from '../middleware/adminLog.js';

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));

const KNOWN_SETTING_KEYS = [
  'avatarGenerationEnabled',
  'gamesEnabled',
  'listeningEnabled',
  'registrationOpen',
];

function publicUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

const listUsersQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// GET /api/admin/users
router.get('/users', validate({ query: listUsersQuerySchema }), async (req, res, next) => {
  try {
    const { search, page, pageSize } = req.query;

    const allUsers = await prisma.user.findMany({});

    const filtered = search
      ? allUsers.filter((u) => {
          const haystack = `${u.email} ${u.name}`.toLowerCase();
          return haystack.includes(search.toLowerCase());
        })
      : allUsers;

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const pageItems = filtered.slice(start, start + pageSize).map(publicUser);

    res.json({
      users: pageItems,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (err) {
    next(err);
  }
});

const patchUserParamsSchema = z.object({
  id: z.string().trim().min(1),
});

const patchUserBodySchema = z.object({
  blocked: z.boolean().optional(),
  role: z.enum(['STUDENT', 'TEACHER', 'PARENT', 'ADMIN']).optional(),
  level: z.string().trim().min(1).max(10).optional(),
});

// PATCH /api/admin/users/:id
router.patch(
  '/users/:id',
  validate({ params: patchUserParamsSchema, body: patchUserBodySchema }),
  async (req, res, next) => {
    try {
      if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (!existing) {
        return res.status(404).json({ error: 'User not found' });
      }

      const updated = await prisma.user.update({
        where: { id: req.params.id },
        data: req.body,
      });

      await logAdminAction({
        actorId: req.user.id,
        action: 'user.update',
        target: req.params.id,
      });

      res.json({ user: publicUser(updated) });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/admin/users/:id
router.delete(
  '/users/:id',
  validate({ params: patchUserParamsSchema }),
  async (req, res, next) => {
    try {
      const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (!existing) {
        return res.status(404).json({ error: 'User not found' });
      }

      await prisma.user.delete({ where: { id: req.params.id } });

      await logAdminAction({
        actorId: req.user.id,
        action: 'user.delete',
        target: req.params.id,
      });

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },
);

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

function dayKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

// GET /api/admin/analytics
router.get('/analytics', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({});
    const attempts = await prisma.attempt.findMany({});

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Active last 7d = users with at least one attempt in the last 7 days.
    const activeUserIds = new Set(
      attempts
        .filter((a) => new Date(a.createdAt) >= sevenDaysAgo)
        .map((a) => a.userId),
    );

    // Avg accuracy by taskType.
    const byTaskType = {};
    for (const attempt of attempts) {
      if (!byTaskType[attempt.taskType]) {
        byTaskType[attempt.taskType] = { total: 0, correct: 0 };
      }
      byTaskType[attempt.taskType].total += 1;
      if (attempt.correct) byTaskType[attempt.taskType].correct += 1;
    }
    const avgAccuracyByTaskType = Object.fromEntries(
      Object.entries(byTaskType).map(([key, { total, correct }]) => [
        key,
        total > 0 ? correct / total : 0,
      ]),
    );

    // Attempts per day, last 30 days.
    const recentAttempts = attempts.filter((a) => new Date(a.createdAt) >= thirtyDaysAgo);
    const perDayMap = {};
    for (const attempt of recentAttempts) {
      const key = dayKey(attempt.createdAt);
      perDayMap[key] = (perDayMap[key] || 0) + 1;
    }
    const attemptsPerDay = Object.entries(perDayMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));

    // Top 5 topics by attempt count.
    const topicCounts = {};
    for (const attempt of attempts) {
      topicCounts[attempt.topic] = (topicCounts[attempt.topic] || 0) + 1;
    }
    const topTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }));

    const totalCorrect = attempts.filter((a) => a.correct).length;

    res.json({
      totals: {
        users: users.length,
        attempts: attempts.length,
        overallAccuracy: attempts.length > 0 ? totalCorrect / attempts.length : 0,
      },
      activeLast7d: activeUserIds.size,
      avgAccuracyByTaskType,
      attemptsPerDay,
      topTopics,
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

// GET /api/admin/settings
router.get('/settings', async (req, res, next) => {
  try {
    const settings = await prisma.setting.findMany({});
    res.json({ settings });
  } catch (err) {
    next(err);
  }
});

const putSettingSchema = z.object({
  key: z.enum(KNOWN_SETTING_KEYS),
  value: z.string().trim().min(1).max(500),
});

// PUT /api/admin/settings
router.put('/settings', validate({ body: putSettingSchema }), async (req, res, next) => {
  try {
    const { key, value } = req.body;

    const setting = await prisma.setting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });

    await logAdminAction({
      actorId: req.user.id,
      action: 'setting.update',
      target: key,
    });

    res.json({ setting });
  } catch (err) {
    next(err);
  }
});

export default router;
