// JWT helpers: explicit HS256, short-lived access tokens, longer-lived
// refresh tokens. Refresh tokens are opaque random strings whose HASH is
// persisted (never the raw token), so a leaked database dump cannot be
// replayed as a valid refresh token.

import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

const ALGORITHM = 'HS256';
export const ACCESS_TOKEN_TTL = '15m';
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  return secret;
}

/**
 * Sign a short-lived access token carrying minimal claims.
 */
export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
    },
    getSecret(),
    { algorithm: ALGORITHM, expiresIn: ACCESS_TOKEN_TTL },
  );
}

/**
 * Verify an access token. Algorithm is pinned explicitly to prevent
 * alg-confusion attacks (e.g. "none" or RS256-with-public-key-as-HMAC-secret).
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, getSecret(), { algorithms: [ALGORITHM] });
}

/**
 * Generate a new opaque refresh token (raw value to hand to the client) plus
 * its SHA-256 hash (the only thing persisted server-side).
 */
export function generateRefreshToken() {
  const raw = crypto.randomBytes(48).toString('hex');
  const tokenHash = hashRefreshToken(raw);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  return { raw, tokenHash, expiresAt };
}

export function hashRefreshToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}
