import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';
import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from '../lib/jwt.js';

const router = Router();

const BCRYPT_COST = 12;

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(120),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(128),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const logoutSchema = z.object({
  refreshToken: z.string().min(1),
});

async function issueTokenPair(user) {
  const accessToken = signAccessToken(user);
  const { raw, tokenHash, expiresAt } = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
      revoked: false,
    },
  });

  return { accessToken, refreshToken: raw };
}

function publicUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

// POST /api/auth/register
router.post('/register', validate({ body: registerSchema }), async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Registration can be closed via admin Setting("registrationOpen").
    const registrationSetting = await prisma.setting.findUnique({
      where: { key: 'registrationOpen' },
    });
    if (registrationSetting && registrationSetting.value === 'false') {
      return res.status(403).json({ error: 'Registration is currently closed' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
    });

    const tokens = await issueTokenPair(user);

    res.status(201).json({ user: publicUser(user), ...tokens });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', validate({ body: loginSchema }), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.blocked) {
      return res.status(403).json({ error: 'Account is blocked' });
    }

    const tokens = await issueTokenPair(user);

    res.json({ user: publicUser(user), ...tokens });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh — rotate refresh token, revoke the old one.
router.post('/refresh', validate({ body: refreshSchema }), async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const tokenHash = hashRefreshToken(refreshToken);

    const stored = await prisma.refreshToken.findFirst({ where: { tokenHash } });

    // Wrap `expiresAt` in `new Date(...)` explicitly rather than comparing
    // it directly against `new Date()`: a Date compared with `<` against a
    // string operand coerces via `Date.prototype.toString()` (not
    // `toISOString()`), which does NOT sort chronologically. Normalizing
    // both sides to Date instances makes this correct regardless of whether
    // the underlying client returns Date objects or serialized strings.
    if (!stored || stored.revoked || new Date(stored.expiresAt).getTime() < Date.now()) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const user = await prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    if (user.blocked) {
      return res.status(403).json({ error: 'Account is blocked' });
    }

    // Revoke the presented token (rotation: one-time use).
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });

    const tokens = await issueTokenPair(user);

    res.json({ user: publicUser(user), ...tokens });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout — revoke the presented refresh token.
router.post('/logout', validate({ body: logoutSchema }), async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const tokenHash = hashRefreshToken(refreshToken);

    const stored = await prisma.refreshToken.findFirst({ where: { tokenHash } });

    if (stored && !stored.revoked) {
      await prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revoked: true },
      });
    }

    // Always respond 200 regardless of whether the token existed, to avoid
    // leaking token validity information.
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
