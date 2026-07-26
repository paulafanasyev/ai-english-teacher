// Global test setup: runs once before the test suite. Ensures required env
// vars exist so lib/jwt.js and src/app.js behave predictably, without ever
// touching a real database (DATABASE_URL is intentionally NOT required
// because setPrismaForTests() swaps in the in-memory fake before any route
// touches the Prisma client).

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-secret-do-not-use-in-production';
process.env.CORS_ORIGINS = process.env.CORS_ORIGINS || 'http://localhost:3000';
