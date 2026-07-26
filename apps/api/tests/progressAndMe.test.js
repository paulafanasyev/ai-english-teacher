import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

import { setPrismaForTests } from '../src/lib/prisma.js';
import { createFakePrisma } from './helpers/fakePrisma.js';
import { createApp } from '../src/app.js';

let app;

beforeEach(() => {
  setPrismaForTests(createFakePrisma());
  app = createApp();
});

async function registerAndLogin(email = 'progress@example.com') {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'password123', name: 'Progress User' });
  return res.body.accessToken;
}

describe('Progress + Me routes', () => {
  it('records attempts and computes accuracy/timeline stats', async () => {
    const accessToken = await registerAndLogin();

    await request(app)
      .post('/api/progress/attempt')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ taskType: 'gap-task', topic: 'travel', level: 'A2', correct: true, durationMs: 4200 });

    await request(app)
      .post('/api/progress/attempt')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ taskType: 'gap-task', topic: 'travel', level: 'A2', correct: false, durationMs: 5300 });

    const statsRes = await request(app)
      .get('/api/progress/stats')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(statsRes.status).toBe(200);
    expect(statsRes.body.accuracyByTaskType['gap-task'].total).toBe(2);
    expect(statsRes.body.accuracyByTaskType['gap-task'].correct).toBe(1);
    expect(statsRes.body.accuracyByTaskType['gap-task'].accuracy).toBe(0.5);
    expect(statsRes.body.accuracyByTopic['travel'].total).toBe(2);
    expect(Array.isArray(statsRes.body.timeline)).toBe(true);
    expect(statsRes.body.timeline).toHaveLength(1);
    expect(statsRes.body.timeline[0]).toMatchObject({ attempts: 2, correct: 1, xp: 10 });

    const summaryRes = await request(app)
      .get('/api/me/summary')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.accuracy).toBe(0.5);
    expect(summaryRes.body.totalAttempts).toBe(2);
  });

  it('rejects an invalid attempt body with 400', async () => {
    const accessToken = await registerAndLogin('progress2@example.com');

    const res = await request(app)
      .post('/api/progress/attempt')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ taskType: '', topic: 'travel', level: 'A2', correct: 'yes', durationMs: -5 });

    expect(res.status).toBe(400);
  });

  it('updates profile fields via PATCH /api/me', async () => {
    const accessToken = await registerAndLogin('progress3@example.com');

    const res = await request(app)
      .patch('/api/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'New Name', locale: 'en' });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('New Name');
    expect(res.body.user.locale).toBe('en');
  });
});
