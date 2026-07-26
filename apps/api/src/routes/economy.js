import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);

// Server-side caps prevent a compromised/modified client from awarding
// itself unlimited currency via this endpoint.
const MAX_XP_PER_CALL = 200;
const MAX_COINS_PER_CALL = 100;

const earnSchema = z.object({
  xp: z.number().int().min(0).max(MAX_XP_PER_CALL),
  coins: z.number().int().min(0).max(MAX_COINS_PER_CALL),
});

// POST /api/economy/earn
router.post('/earn', validate({ body: earnSchema }), async (req, res, next) => {
  try {
    const { xp, coins } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        xp: { increment: xp },
        coins: { increment: coins },
      },
    });

    res.json({ xp: updated.xp, coins: updated.coins });
  } catch (err) {
    next(err);
  }
});

const spendSchema = z.object({
  itemType: z.string().trim().min(1).max(60),
  itemId: z.string().trim().min(1).max(120),
  price: z.number().int().min(0).max(1_000_000),
});

// POST /api/economy/spend — transactional; 400 if insufficient coins.
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
