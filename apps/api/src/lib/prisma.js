// Prisma client singleton with a test-injection hook.
//
// In production, `prisma` is a real @prisma/client PrismaClient instance
// connected to PostgreSQL via DATABASE_URL.
//
// In tests, `setPrismaForTests(fakePrisma)` swaps the exported instance for
// an in-memory fake so the full test suite can run without a live database.
// Because ESM module exports are live bindings for named exports but a
// mutable object reference is required here, we expose a small proxy object
// (`db`) whose internal `current` pointer can be swapped, plus a `prisma`
// export that always forwards to whatever is current. This lets route code
// written as `import { prisma } from '../lib/prisma.js'` transparently use
// the swapped-in fake because `prisma` is a Proxy, not a snapshot.

import { PrismaClient } from '@prisma/client';

let current;

function createRealClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

// Lazily create the real client only when actually used. This avoids
// requiring a DATABASE_URL / live DB connection during tests, since tests
// call setPrismaForTests() before any route touches `prisma`.
function getCurrent() {
  if (!current) {
    current = createRealClient();
  }
  return current;
}

/**
 * Swap the active Prisma-like client for a fake implementation.
 * Used exclusively by tests. Pass `null`/`undefined` to reset back to a
 * fresh real client (rarely needed).
 */
export function setPrismaForTests(fakeClient) {
  current = fakeClient ?? undefined;
}

// A Proxy that always forwards property access to whatever client is
// currently active. This means `import { prisma } from './lib/prisma.js'`
// anywhere in the codebase automatically observes swaps made via
// setPrismaForTests(), even though the import binding itself never changes.
export const prisma = new Proxy(
  {},
  {
    get(_target, prop, receiver) {
      const client = getCurrent();
      const value = client[prop];
      if (typeof value === 'function') {
        return value.bind(client);
      }
      return value;
    },
    has(_target, prop) {
      return prop in getCurrent();
    },
  },
);

export default prisma;
