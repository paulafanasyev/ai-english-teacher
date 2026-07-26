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

async function registerAndLogin(email = 'econ@example.com') {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'password123', name: 'Econ User' });
  return { accessToken: res.body.accessToken, user: res.body.user };
}

describe('Economy', () => {
  it('rejects spend with insufficient coins with 400', async () => {
    const { accessToken } = await registerAndLogin();

    // User starts with 0 coins by default.
    const res = await request(app)
      .post('/api/economy/spend')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ itemType: 'avatar', itemId: 'wizard-hat', price: 50 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/insufficient/i);
  });

  it('allows spend when the user has enough coins, decrementing balance and recording an Unlock', async () => {
    const { accessToken } = await registerAndLogin('econ2@example.com');

    const earnRes = await request(app)
      .post('/api/economy/earn')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ xp: 50, coins: 100 });

    expect(earnRes.status).toBe(200);
    expect(earnRes.body.coins).toBe(100);

    const spendRes = await request(app)
      .post('/api/economy/spend')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ itemType: 'avatar', itemId: 'wizard-hat', price: 40 });

    expect(spendRes.status).toBe(200);
    expect(spendRes.body.coins).toBe(60);

    const unlocksRes = await request(app)
      .get('/api/economy/unlocks')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(unlocksRes.status).toBe(200);
    expect(unlocksRes.body.unlocks).toHaveLength(1);
    expect(unlocksRes.body.unlocks[0].itemId).toBe('wizard-hat');
  });

  it('enforces server-side caps on earn (max 200 xp / 100 coins per call)', async () => {
    const { accessToken } = await registerAndLogin('econ3@example.com');

    const res = await request(app)
      .post('/api/economy/earn')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ xp: 999, coins: 999 });

    expect(res.status).toBe(400);
  });
});
