import test from 'node:test';
import assert from 'node:assert/strict';
import { checkText } from './grammarCheck.js';

const fixes = (s) => checkText(s).map((f) => f.fix);

test('articles follow the sound, not the letter', () => {
  for (const ok of ['a university', 'an hour', 'an honest boy', 'a one-way ticket', 'a European city', 'a useful tool', 'a unicorn']) {
    assert.deepEqual(fixes(ok), [], ok);
  }
  assert.deepEqual(fixes('I ate a apple'), ['an apple']);
  assert.deepEqual(fixes('an cat'), ['a cat']);
  assert.deepEqual(fixes('an hotel'), ['a hotel']);
});

test('third person -s', () => {
  assert.deepEqual(fixes('She like cats'), ['She likes']);
  assert.deepEqual(fixes('he study hard'), ['he studies']);
  assert.deepEqual(fixes('it go'), ['it goes']);
});

test('correct sentences are left alone', () => {
  assert.deepEqual(fixes('My sister and I like to swim.'), []);
  assert.deepEqual(fixes('He has a cat and an umbrella.'), []);
});
