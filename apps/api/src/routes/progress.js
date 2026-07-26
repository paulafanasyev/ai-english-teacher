import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);

const attemptSchema = z.object({
  taskType: z.string().trim().min(1).max(60),
  topic: z.string().trim().min(1).max(120),
  level: z.string().trim().min(1).max(10),
  correct: z.boolean(),
  durationMs: z.number().int().min(0).max(3_600_000),
});

// POST /api/progress/attempt
router.post('/attempt', validate({ body: attemptSchema }), async (req, res, next) => {
  try {
    const attempt = await prisma.attempt.create({
      data: {
        userId: req.user.id,
        taskType: req.body.taskType,
        topic: req.body.topic,
        level: req.body.level,
        correct: req.body.correct,
        durationMs: req.body.durationMs,
      },
    });

    res.status(201).json({ attempt });
  } catch (err) {
    next(err);
  }
});

function dayKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

// GET /api/progress/stats
router.get('/stats', async (req, res, next) => {
  try {
    const attempts = await prisma.attempt.findMany({ where: { userId: req.user.id } });

    const byTaskType = {};
    const byTopic = {};

    for (const attempt of attempts) {
      if (!byTaskType[attempt.taskType]) {
        byTaskType[attempt.taskType] = { total: 0, correct: 0 };
      }
      byTaskType[attempt.taskType].total += 1;
      if (attempt.correct) byTaskType[attempt.taskType].correct += 1;

      if (!byTopic[attempt.topic]) {
        byTopic[attempt.topic] = { total: 0, correct: 0 };
      }
      byTopic[attempt.topic].total += 1;
      if (attempt.correct) byTopic[attempt.topic].correct += 1;
    }

    const accuracyByTaskType = Object.fromEntries(
      Object.entries(byTaskType).map(([key, { total, correct }]) => [
        key,
        { total, correct, accuracy: total > 0 ? correct / total : 0 },
      ]),
    );

    const accuracyByTopic = Object.fromEntries(
      Object.entries(byTopic).map(([key, { total, correct }]) => [
        key,
        { total, correct, accuracy: total > 0 ? correct / total : 0 },
      ]),
    );

    // XP timeline (last 30 days): the schema records cumulative xp on User
    // and does not log a per-event xp delta, so there is no ground-truth
    // "xp granted on day D" value to read back. We derive a deterministic,
    // per-day xp figure from that day's own Attempt rows using the same
    // flat per-correct-answer rate the client-side economy UI assumes
    // (XP_PER_CORRECT_ATTEMPT), which gives a reproducible, chartable xp
    // timeline without inventing a new table outside the given schema.
    // `attempts`/`correct` are included alongside it for callers that want
    // the raw activity/accuracy signal instead of (or in addition to) xp.
    const XP_PER_CORRECT_ATTEMPT = 10;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentAttempts = attempts.filter((a) => new Date(a.createdAt) >= thirtyDaysAgo);

    const timelineMap = {};
    for (const attempt of recentAttempts) {
      const key = dayKey(attempt.createdAt);
      if (!timelineMap[key]) {
        timelineMap[key] = { date: key, xp: 0, attempts: 0, correct: 0 };
      }
      timelineMap[key].attempts += 1;
      if (attempt.correct) {
        timelineMap[key].correct += 1;
        timelineMap[key].xp += XP_PER_CORRECT_ATTEMPT;
      }
    }

    const timeline = Object.values(timelineMap).sort((a, b) => (a.date < b.date ? -1 : 1));

    res.json({
      accuracyByTaskType,
      accuracyByTopic,
      timeline,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
