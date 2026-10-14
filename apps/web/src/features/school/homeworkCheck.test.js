import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkHomeworkLocal, sanitizeCheck, validMark } from './homeworkCheck.js';

test('empty answer gets no mark', () => {
  const c = checkHomeworkLocal({ subject: 'Математика', answer: '   ' });
  assert.equal(c.mark, null);
  assert.match(c.verdict, /Ответа нет/);
});

test('math answer is compared with the teacher answer', () => {
  assert.equal(checkHomeworkLocal({ subject: 'Математика', answer: '3x = 12\nx = 4', expected: '4' }).mark, 5);
  assert.equal(checkHomeworkLocal({ subject: 'Математика', answer: 'x = 4,5', expected: '4.5' }).mark, 5);
  assert.equal(checkHomeworkLocal({ subject: 'Математика', answer: 'x = 5', expected: '4' }).mark, 2);
  assert.equal(checkHomeworkLocal({ subject: 'Алгебра', answer: 'x = 2, y = 3', expected: 'x=2; y=3' }).mark, 5);
});

test('math without teacher answer is left to the teacher', () => {
  const c = checkHomeworkLocal({ subject: 'Геометрия', answer: 'Площадь равна 24 см²' });
  assert.equal(c.mark, null);
  assert.match(c.verdict, /оценку поставит учитель/);
});

test('English answer is checked with grammar rules', () => {
  const bad = checkHomeworkLocal({ subject: 'Иностранный язык', answer: 'She like music and I want go to the park.' });
  assert.equal(bad.fixes.length, 2);
  assert.equal(bad.mark, 3);
  assert.deepEqual(bad.fixes.map((f) => f.right), ['She likes', 'want to go']);
  const good = checkHomeworkLocal({ subject: 'Иностранный язык', answer: 'She likes music and I want to go to the park.' });
  assert.equal(good.fixes.length, 0);
  assert.equal(good.mark, 5);
});

test('sanitizeCheck keeps only safe fields', () => {
  assert.equal(sanitizeCheck(null), null);
  assert.equal(sanitizeCheck({ mark: 5 }), null);
  const c = sanitizeCheck({ mark: '4', verdict: ' Хорошо ', fixes: [{ wrong: 'a', right: 'b', why: 'c', x: 1 }, 'bad'], source: 'llm', at: 5, extra: 1 });
  assert.deepEqual(c, { mark: 4, verdict: 'Хорошо', fixes: [{ wrong: 'a', right: 'b', why: 'c' }], advice: '', source: 'llm', at: 5 });
  assert.equal(validMark(1), null);
  assert.equal(validMark(3), 3);
});
