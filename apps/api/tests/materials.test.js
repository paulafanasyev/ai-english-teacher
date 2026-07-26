import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

import { setPrismaForTests } from '../src/lib/prisma.js';
import { createFakePrisma } from './helpers/fakePrisma.js';
import { createApp } from '../src/app.js';
import { generateTasksFromText } from '../src/lib/taskGenerator.js';

let app;
let fakePrisma;

beforeEach(() => {
  fakePrisma = createFakePrisma();
  setPrismaForTests(fakePrisma);
  app = createApp();
});

async function makeAdmin() {
  const email = 'materialsadmin@example.com';
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'password123', name: 'Materials Admin' });

  await fakePrisma.user.update({
    where: { id: registerRes.body.user.id },
    data: { role: 'ADMIN' },
  });

  const loginRes = await request(app).post('/api/auth/login').send({ email, password: 'password123' });
  return loginRes.body.accessToken;
}

const SAMPLE_TEXT = `The quick brown fox jumps over the lazy dog every single morning near the river.
The fox enjoys running through the forest because the forest is quiet and peaceful in the morning.
Dogs and foxes rarely interact, but this particular dog and fox have become close friends over the years.
Every morning the fox visits the dog before returning to the forest to rest.`;

describe('Materials generate-tasks determinism', () => {
  it('produces identical output when called twice on the same underlying text (pure function)', () => {
    const first = generateTasksFromText(SAMPLE_TEXT);
    const second = generateTasksFromText(SAMPLE_TEXT);

    expect(first).toEqual(second);
    expect(first.vocabCards.length).toBeGreaterThan(0);
    expect(first.gapTasks.length).toBeGreaterThan(0);
  });

  it('produces identical output across two separate materials with the same text, via the HTTP route', async () => {
    const accessToken = await makeAdmin();

    const materialA = await fakePrisma.material.create({
      data: { ownerId: 'x', filename: 'a.txt', mime: 'text/plain', text: SAMPLE_TEXT },
    });
    const materialB = await fakePrisma.material.create({
      data: { ownerId: 'x', filename: 'b.txt', mime: 'text/plain', text: SAMPLE_TEXT },
    });

    const resA = await request(app)
      .post(`/api/materials/${materialA.id}/generate-tasks`)
      .set('Authorization', `Bearer ${accessToken}`);
    const resB = await request(app)
      .post(`/api/materials/${materialB.id}/generate-tasks`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(resA.status).toBe(200);
    expect(resB.status).toBe(200);
    expect(resA.body).toEqual(resB.body);
    expect(resA.body.vocabCards.length).toBeGreaterThan(0);
    expect(resA.body.gapTasks.length).toBeGreaterThan(0);
  });

  it('filters out stopwords from vocab cards and blanks a content word in gap tasks', () => {
    const { vocabCards, gapTasks } = generateTasksFromText(SAMPLE_TEXT);

    const stopwordLike = new Set(['the', 'and', 'over', 'this', 'have']);
    for (const card of vocabCards) {
      expect(stopwordLike.has(card.word)).toBe(false);
    }

    for (const task of gapTasks) {
      expect(task.sentence).toContain('_____');
      expect(task.sentence.toLowerCase()).not.toContain(task.answer.toLowerCase() + ' ');
    }
  });

  it('returns 404 for generate-tasks on a nonexistent material id', async () => {
    const accessToken = await makeAdmin();

    const res = await request(app)
      .post('/api/materials/does-not-exist/generate-tasks')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
  });
});
