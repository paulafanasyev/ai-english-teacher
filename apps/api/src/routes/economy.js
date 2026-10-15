import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);

// Server-side caps prevent a compromised/modified client from awarding
// itself unlimited currency via this endpoint: per call and per user per day.
const MAX_XP_PER_CALL = 200;
const MAX_COINS_PER_CALL = 100;
export const MAX_XP_PER_DAY = 3000;
export const MAX_COINS_PER_DAY = 1500;

// userId -> { day, xp, coins }. In-memory is enough for the single-instance
// self-hosted deployment; use a shared store if the API is ever scaled out.
const earnedToday = new Map();
function dayKey() { return new Date().toISOString().slice(0, 10); }
function budgetFor(userId) {
  const day = dayKey();
  let b = earnedToday.get(userId);
  if (!b || b.day !== day) { b = { day, xp: 0, coins: 0 }; earnedToday.set(userId, b); }
  if (earnedToday.size > 50_000) {
    for (const [k, v] of earnedToday) if (v.day !== day) earnedToday.delete(k);
  }
  return b;
}
export function _resetEarnBudgets() { earnedToday.clear(); }

const earnSchema = z.object({
  xp: z.number().int().min(0).max(MAX_XP_PER_CALL),
  coins: z.number().int().min(0).max(MAX_COINS_PER_CALL),
});

// POST /api/economy/earn
router.post('/earn', validate({ body: earnSchema }), async (req, res, next) => {
  try {
    const budget = budgetFor(req.user.id);
    const xp = Math.max(0, Math.min(req.body.xp, MAX_XP_PER_DAY - budget.xp));
    const coins = Math.max(0, Math.min(req.body.coins, MAX_COINS_PER_DAY - budget.coins));
    budget.xp += xp;
    budget.coins += coins;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        xp: { increment: xp },
        coins: { increment: coins },
      },
    });

    res.json({ xp: updated.xp, coins: updated.coins, capped: xp < req.body.xp || coins < req.body.coins });
  } catch (err) {
    next(err);
  }
});

const spendSchema = z.object({
  itemType: z.string().trim().min(1).max(60),
  itemId: z.string().trim().min(1).max(120),
  price: z.number().int().min(1).max(1_000_000),
});

// POST /api/economy/spend — transactional; 400 if insufficient coins, 409 if already owned.
// NOTE: the price still comes from the client; a server-side catalog is the real fix.
router.post('/spend', validate({ body: spendSchema }), async (req, res, next) => {
  try {
    const { itemType, itemId, price } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: req.user.id } });
      if (!user) {
        const err = new Error('User not found');
        err.status = 404;
        throw err;
      }

      const owned = await tx.unlock.findFirst({ where: { userId: req.user.id, itemType, itemId } });
      if (owned) {
        const err = new Error('Item already unlocked');
        err.status = 409;
        throw err;
      }

      if (user.coins < price) {
        const err = new Error('Insufficient coins');
        err.status = 400;
        throw err;
      }

      const updatedUser = await tx.user.update({
        where: { id: req.user.id },
        data: { coins: { decrement: price } },
      });

      const unlock = await tx.unlock.create({
        data: {
          userId: req.user.id,
          itemType,
          itemId,
        },
      });

      return { coins: updatedUser.coins, unlock };
    });

    res.json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
});

// GET /api/economy/unlocks
router.get('/unlocks', async (req, res, next) => {
  try {
    const unlocks = await prisma.unlock.findMany({ where: { userId: req.user.id } });
    res.json({ unlocks });
  } catch (err) {
    next(err);
  }
});

export default router;
