import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

import { setPrismaForTests } from '../src/lib/prisma.js';
import { createFakePrisma } from './helpers/fakePrisma.js';
import { createApp } from '../src/app.js';
import { hashRefreshToken } from '../src/lib/jwt.js';

let app;
let fakePrisma;

beforeEach(() => {
  fakePrisma = createFakePrisma();
  setPrismaForTests(fakePrisma);
  app = createApp();
});

describe('Auth flow', () => {
  it('registers, logs in, refreshes, and logs out successfully (happy path)', async () => {
    const email = 'student@example.com';
    const password = 'SuperSecret1';

    // Register
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email, password, name: 'Ada Student' });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.user.email).toBe(email);
    expect(registerRes.body.user.passwordHash).toBeUndefined();
    expect(registerRes.body.accessToken).toBeTruthy();
    expect(registerRes.body.refreshToken).toBeTruthy();

    // Login
    const loginRes = await request(app).post('/api/auth/login').send({ email, password });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.accessToken).toBeTruthy();
    expect(loginRes.body.refreshToken).toBeTruthy();

    const firstRefreshToken = loginRes.body.refreshToken;

    // Refresh — rotates the token
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: firstRefreshToken });
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.accessToken).toBeTruthy();
    expect(refreshRes.body.refreshToken).toBeTruthy();
    expect(refreshRes.body.refreshToken).not.toBe(firstRefreshToken);

    // Old refresh token must now be rejected (rotation + revocation)
    const reuseOldRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: firstRefreshToken });
    expect(reuseOldRes.status).toBe(401);

    // Logout with the NEW refresh token
    const newRefreshToken = refreshRes.body.refreshToken;
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken: newRefreshToken });
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);

    // Using the logged-out refresh token should now fail
    const postLogoutRefresh = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: newRefreshToken });
    expect(postLogoutRefresh.status).toBe(401);
  });

  it('rejects duplicate email registration with 409', async () => {
    const payload = { email: 'dupe@example.com', password: 'password123', name: 'Dupe One' };

    const first = await request(app).post('/api/auth/register').send(payload);
    expect(first.status).toBe(201);

    const second = await request(app).post('/api/auth/register').send(payload);
    expect(second.status).toBe(409);
  });

  it('rejects login with wrong password with 401', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'wrongpw@example.com', password: 'correctPassword1', name: 'Someone' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrongpw@example.com', password: 'incorrectPassword' });

    expect(res.status).toBe(401);
  });

  it('rejects login for a blocked user with 403', async () => {
    const email = 'blocked@example.com';
    const password = 'password123';

    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email, password, name: 'Blocked User' });

    // Simulate an admin having blocked the user directly in the store.
    await fakePrisma.user.update({
      where: { id: registerRes.body.user.id },
      data: { blocked: true },
    });

    const loginRes = await request(app).post('/api/auth/login').send({ email, password });
    expect(loginRes.status).toBe(403);
  });

  it('rejects an expired refresh token with 401 (regression: Date vs string comparison)', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'expired@example.com', password: 'password123', name: 'Expired User' });

    // Manually insert an already-expired refresh token directly into the
    // store, bypassing issueTokenPair (which always sets a future
    // expiresAt). This exercises the exact comparison in
    // src/routes/auth.js's /refresh handler.
    const rawToken = 'raw-expired-token-value';
    await fakePrisma.refreshToken.create({
      data: {
        userId: registerRes.body.user.id,
        tokenHash: hashRefreshToken(rawToken),
        expiresAt: new Date(Date.now() - 60_000), // 1 minute in the past
        revoked: false,
      },
    });

    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: rawToken });
    expect(res.status).toBe(401);
  });

  it('rejects invalid registration body with 400 (zod validation)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'short', name: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(Array.isArray(res.body.details)).toBe(true);
    expect(res.body.details.length).toBeGreaterThan(0);
  });
});
