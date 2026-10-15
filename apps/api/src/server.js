// Process entrypoint: loads env, creates the Express app, and starts
// listening. Kept minimal so app.js remains testable in isolation.

import 'dotenv/config';
import { createApp } from './app.js';
import { assertJwtSecret } from './lib/jwt.js';

// Fail fast: without a strong JWT_SECRET every login would fail (or, worse,
// tokens could be forged), so do not start listening at all.
try {
  assertJwtSecret();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error(`[startup] ${err.message}`);
  process.exit(1);
}

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

const app = createApp();

const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`AI English Teacher API listening on port ${PORT}`);
});

function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`Received ${signal}, shutting down gracefully...`);
  server.close(() => {
    process.exit(0);
  });
  // Force-exit if graceful shutdown hangs.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default server;
