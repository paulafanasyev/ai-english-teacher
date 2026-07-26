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

async function makeAdmin() {
  const email = 'settingsadmin@example.com';
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'password123', name: 'Settings Admin' });

  await fakePrisma.user.update({
    where: { id: registerRes.body.user.id },
    data: { role: 'ADMIN' },
  });

  const loginRes = await request(app).post('/api/auth/login').send({ email, password: 'password123' });
  return loginRes.body.accessToken;
}

describe('Admin settings roundtrip', () => {
  it('writes a setting via PUT and reads it back via GET', async () => {
    const accessToken = await makeAdmin();

    const putRes = await request(app)
      .put('/api/admin/settings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ key: 'gamesEnabled', value: 'true' });

    expect(putRes.status).toBe(200);
    expect(putRes.body.setting).toEqual({ key: 'gamesEnabled', value: 'true' });

    const getRes = await request(app)
      .get('/api/admin/settings')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(getRes.status).toBe(200);
    const found = getRes.body.settings.find((s) => s.key === 'gamesEnabled');
    expect(found).toBeTruthy();
    expect(found.value).toBe('true');
  });

  it('rejects unknown setting keys with 400', async () => {
    const accessToken = await makeAdmin();

    const res = await request(app)
      .put('/api/admin/settings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ key: 'notARealSetting', value: 'true' });

    expect(res.status).toBe(400);
  });
});
