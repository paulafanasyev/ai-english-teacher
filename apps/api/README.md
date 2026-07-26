# AI English Teacher — Backend API

Production backend for the "AI English Teacher" app: Node.js (ESM) + Express
+ Prisma ORM (PostgreSQL) + JWT auth. Designed to be shipped in a source zip
and self-hosted; a separate browser demo talks to this API.

## Requirements

- Node.js 18+ (tested on Node 20/24)
- PostgreSQL 14+ (for actual running/serving; **not** required to run the test suite)
- Docker + Docker Compose (optional, recommended for self-hosting)

## Quick start (local, no Docker)

```bash
cd apps/api
cp .env.example .env        # then edit .env with real values
npm install
npx prisma generate
npx prisma migrate deploy   # applies migrations to the DB in DATABASE_URL
npm run seed                # creates admin + 12 demo students
npm run dev                 # starts with --watch on http://localhost:4000
```

## Environment variables

All variables are documented in [`.env.example`](./.env.example):

| Variable | Required | Default | Notes |
|---|---|---|---|
| `PORT` | no | `4000` | HTTP port the API listens on |
| `NODE_ENV` | no | — | Set to `production` in deployed environments (suppresses stack traces in error responses) |
| `DATABASE_URL` | yes | — | PostgreSQL connection string, e.g. `postgresql://user:pass@host:5432/db?schema=public` |
| `JWT_SECRET` | yes | — | HMAC signing secret for JWTs. Generate with `openssl rand -hex 64`. Never commit a real value. |
| `CORS_ORIGINS` | yes | — | Comma-separated allowlist of browser origins allowed to call this API |
| `SEED_ADMIN_EMAIL` | no | `admin@example.com` | Email used by `prisma/seed.js` for the admin account |
| `SEED_ADMIN_PASSWORD` | no | `ChangeMe_123` | Password used by `prisma/seed.js` for the admin account — **change this** before/immediately after seeding a real deployment |

## Database: migrate & seed

```bash
npx prisma migrate dev --name init   # first time, creates a migration + applies it (dev)
npx prisma migrate deploy            # applies existing migrations (prod/CI)
npm run seed                         # idempotent: safe to re-run
```

The seed script (`prisma/seed.js`) creates:
- One `ADMIN` user from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.
- Default `Setting` rows (`avatarGenerationEnabled`, `gamesEnabled`, `listeningEnabled`, `registrationOpen`, all `"true"`).
- 12 demo `STUDENT` users, each with a simulated 30-day practice history (`Attempt` rows) with an upward accuracy trend, and `xp`/`coins` totals derived from that history.

## Running with Docker Compose

From the **repo root** (one level up from `apps/api`):

```bash
cp .env.example .env    # repo-root .env for docker-compose.yml — edit it
docker compose up -d --build
docker compose exec api npm run seed   # optional, one-time
```

This starts:
- `postgres` (postgres:16-alpine) with a named volume and a healthcheck.
- `api`, built from `apps/api/Dockerfile`, which waits for postgres to be
  healthy, runs `prisma migrate deploy`, then starts the server.
- `adminer` (optional; only started with `docker compose --profile tools up`), a lightweight DB admin UI for local/dev use. **Do not run this in production** — see `SECURITY_AUDIT.md`.

## Backups

```bash
./scripts/backup.sh                        # dumps + gzips into backups/, keeps newest 14
./scripts/restore.sh backups/<file>.sql.gz  # restores a backup (destructive, asks for confirmation)
```

See the commented cron example at the bottom of `scripts/backup.sh` for
scheduling nightly backups. See `SECURITY_AUDIT.md` for the full backup
verification and off-site-copy checklist.

## Tests

The test suite runs **without any live database**. `src/lib/prisma.js`
exposes a `setPrismaForTests()` hook that swaps the Prisma client for an
in-memory fake (`tests/helpers/fakePrisma.js`) implementing the subset of the
Prisma Client API the routes use (findUnique/findFirst/findMany/create/
update/upsert/delete/$transaction). Route code is unaware of the swap — it
always imports `{ prisma }` from `src/lib/prisma.js` normally.

```bash
npm test          # runs the full vitest + supertest suite once
npm run test:watch
```

## API reference

All endpoints are prefixed with `/api`. Authenticated endpoints expect
`Authorization: Bearer <accessToken>`. Admin endpoints additionally require
the caller's JWT to carry `role: ADMIN`.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | none | Liveness check |
| POST | `/api/auth/register` | none | Create account: `{ email, password (min 8), name }` |
| POST | `/api/auth/login` | none | `{ email, password }` → access + refresh tokens |
| POST | `/api/auth/refresh` | none (refresh token in body) | `{ refreshToken }` → rotates and returns a new pair; old token is revoked |
| POST | `/api/auth/logout` | none (refresh token in body) | `{ refreshToken }` → revokes it |
| GET | `/api/me` | user | Current user profile |
| PATCH | `/api/me` | user | Update `{ name?, locale?, teacherId?, level? }` |
| GET | `/api/me/summary` | user | `{ xp, coins, accuracy, totalAttempts, correctAttempts }` |
| POST | `/api/progress/attempt` | user | Record `{ taskType, topic, level, correct, durationMs }` |
| GET | `/api/progress/stats` | user | Accuracy by taskType/topic + 30-day xp timeline (per day: `xp`, `attempts`, `correct`) |
| POST | `/api/economy/earn` | user | `{ xp, coins }`, server-capped at 200 xp / 100 coins per call |
| POST | `/api/economy/spend` | user | `{ itemType, itemId, price }`, transactional, 400 if insufficient coins |
| GET | `/api/economy/unlocks` | user | List the caller's unlocked items |
| GET | `/api/admin/users` | admin | `?search=&page=&pageSize=` paginated user list |
| PATCH | `/api/admin/users/:id` | admin | `{ blocked?, role?, level? }` |
| DELETE | `/api/admin/users/:id` | admin | Delete a user |
| GET | `/api/admin/analytics` | admin | Totals, active-last-7d, accuracy by taskType, attempts/day (30d), top 5 topics |
| GET | `/api/admin/settings` | admin | List all settings |
| PUT | `/api/admin/settings` | admin | `{ key, value }`, key must be one of the known setting keys |
| POST | `/api/materials/upload` | admin | multipart `file` field (pdf/docx/txt, ≤10MB) → stores extracted text |
| GET | `/api/materials` | admin | List materials (metadata only) |
| DELETE | `/api/materials/:id` | admin | Delete a material |
| POST | `/api/materials/:id/generate-tasks` | admin | Deterministic `{ vocabCards, gapTasks }` generated from the material's text, no external API calls |
| GET | `/api/teacher/classes` | teacher/admin | Teacher's classes with student count + avg accuracy |
| GET | `/api/teacher/classes/:id/roster` | teacher/admin | Students of a class with level/xp/accuracy/streak/lastActive |
| GET | `/api/journal` | any auth | Journal entries, role-scoped (student→self · parent→own children · teacher→own classes · admin→all). Filters `?classId=&studentId=` |
| POST | `/api/journal` | teacher/admin | Create entry `{ studentId, classId?, kind (lesson/quiz/homework/note), topic?, mark?(2–5), comment? }` (teacher restricted to own class) |
| DELETE | `/api/journal/:id` | teacher/admin | Delete an entry (teacher only its own) |
| GET | `/api/parent/children` | parent/admin | Linked children with summary (level/xp/accuracy/streak) |
| GET | `/api/parent/children/:id/diary` | parent/admin | Child summary + diary entries (parent restricted to linked children) |

> **Phase 10 (cabinets & journal):** models `Class`, `Enrollment`, `ParentLink`, `JournalEntry` and roles `TEACHER` / `PARENT` were added to `prisma/schema.prisma`. After pulling this version: `npx prisma migrate dev --name phase10_cabinets` (dev) or `npx prisma migrate deploy` (prod), then `npm run seed` — the seed also creates `teacher@demo.example.com` (`Teacher_123`), `parent@demo.example.com` (`Parent_123`), a 6-student class, a parent↔child link and journal entries. RBAC: teachers see only their classes, parents only their linked children (enforced in the routes).

## Security

See [`../../SECURITY_AUDIT.md`](../../SECURITY_AUDIT.md) at the repo root
for the full OWASP Top 10 mapping, residual risks, and production deployment
checklist.
