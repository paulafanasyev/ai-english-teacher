// Writes an AdminLog row whenever an admin performs a mutating action.
// Intended to be called explicitly at the end of a successful admin mutation
// handler (not as blanket middleware), so `target` can carry a meaningful
// identifier (e.g. the affected user id).

import { prisma } from '../lib/prisma.js';

export async function logAdminAction({ actorId, action, target }) {
  try {
    await prisma.adminLog.create({
      data: {
        actorId,
        action,
        target: String(target),
      },
    });
  } catch (err) {
    // Admin logging must never break the primary request flow.
    // eslint-disable-next-line no-console
    console.error('[adminLog] failed to write AdminLog row:', err.message);
  }
}

/**
 * Express middleware variant: logs after the response has been sent,
 * reading action/target from `res.locals.adminLog` if the handler set it.
 * Attach this globally on the admin router; handlers opt in by setting
 * `res.locals.adminLog = { action, target }` before calling `next()`/responding.
 */
export function adminLogMiddleware(req, res, next) {
  res.on('finish', () => {
    const entry = res.locals.adminLog;
    if (entry && res.statusCode < 400 && req.user) {
      logAdminAction({ actorId: req.user.id, action: entry.action, target: entry.target });
    }
  });
  next();
}
