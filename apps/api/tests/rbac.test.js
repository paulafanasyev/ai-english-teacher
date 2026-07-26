import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

import { setPrismaForTests } from '../src/lib/prisma.js';
import { createFakePrisma } from './helpers/fakePrisma.js';
import { createApp } from '../src/app.js';

let app;
let fakePrisma;

beforeEach(() => {
  fakePrisma = createFakePrisma();
  setPrismaForTests(fakePrisma);
  app = createApp();
});

async function registerAndLogin(overrides = {}) {
  const email = overrides.email || 'user@example.com';
  const password = overrides.password || 'password123';
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password, name: overrides.name || 'Test User' });
  return { accessToken: res.body.accessToken, user: res.body.user };
}

describe('Role-based access control', () => {
  it('returns 403 when a STUDENT calls an ADMIN-only route', async () => {
    const { accessToken } = await registerAndLogin();

    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(403);
  });

  it('allows an ADMIN to access admin routes', async () => {
    const { accessToken, user } = await registerAndLogin({ email: 'admin@example.com' });

    // Promote to ADMIN directly in the store (bootstrapping scenario).
    await fakePrisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } });

    // Need a fresh token carrying the ADMIN role claim.
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'password123' });

    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
  });

  it('rejects requests without an Authorization header with 401', async () => {
    const res = await request(app).get('/api/me');
    expect(res.status).toBe(401);
  });
});
