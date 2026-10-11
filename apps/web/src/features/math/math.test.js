// Run: npm test   (from apps/web; uses the built-in node:test runner, no dependencies)
import test from 'node:test';
import assert from 'node:assert/strict';
import { Q } from './rational.js';
import { parse, evaluate } from './parser.js';
import { check, toQ } from './checker.js';
import { makeProblem, makeSet, TOPICS } from './problems.js';
import * as S from './socratic.js';

const ev = (s, x) => evaluate(parse(s), x === undefined ? {} : { x: Q.of(x) }).toString();

test('exact arithmetic, no float errors', () => {
  assert.equal(ev('0,1+0,2'), '3/10');
  assert.equal(ev('2+3*4'), '14');
  assert.equal(ev('(2+3)*4'), '20');
  assert.equal(ev('2^3^2'), '512');
  assert.equal(ev('-2^2'), '-4');
  assert.equal(ev('3:4'), '3/4');
  assert.equal(ev('6÷4'), '3/2');
  assert.equal(ev('2x+1', 3), '7');
  assert.equal(ev('2(x+3)', 1), '8');
  assert.equal(ev('(x+1)(x-1)', 3), '8');
  assert.equal(ev('х²', 4), '16'); // Cyrillic х + superscript
  assert.equal(ev('−5 × 2'), '-10');
});

test('number answers with equivalence and diagnostics', () => {
  const a = { kind: 'number', value: '3/4', requireReduced: true };
  assert.equal(check(a, '3/4').status, 'correct');
  assert.equal(check(a, '0,75').status, 'correct');
  assert.equal(check(a, '6/8').status, 'partial');
  assert.equal(check(a, '-3/4').note.ru, 'Почти! Проверь знак.');
  assert.equal(check(a, '4/3').note.ru, 'Похоже, дробь перевёрнута.');
  assert.equal(check(a, 'abc').status, 'invalid');
  assert.equal(check(a, '1/0').status, 'invalid');
  assert.equal(check(a, '').status, 'invalid');
  assert.equal(check({ kind: 'number', value: '7' }, 'x = 7').status, 'correct');
  assert.equal(check({ kind: 'number', value: '2.5' }, '2,5').status, 'correct');
  assert.match(check({ kind: 'number', value: '2.5' }, '25').note.ru, /запятая/);
});

test('roots answers', () => {
  const a = { kind: 'roots', values: ['2', '-3'] };
  assert.equal(check(a, '2; -3').status, 'correct');
  assert.equal(check(a, 'x1 = -3; x2 = 2').status, 'correct');
  assert.equal(check(a, '-3 и 2').status, 'correct');
  assert.equal(check(a, '2').status, 'partial');
  assert.equal(check(a, '2; 3').status, 'wrong');
  assert.equal(check(a, '5').status, 'wrong');
});

test('expression equivalence is exact (no probe tricks)', () => {
  const z = { kind: 'expr', value: '0' };
  assert.equal(check(z, '(x+3)*(x+1)*x*(2*x-1)*(x-2)*(x-5)*(3*x-7)*(x-11)').status, 'wrong');
  assert.equal(check({ kind: 'expr', value: 'x^2-1' }, '(x+1)(x-1)').status, 'correct');
  assert.equal(check({ kind: 'expr', value: 'x+1' }, '(x^2-1)/x').status, 'invalid');
  assert.equal(check({ kind: 'expr', value: 'x/2' }, '0,5x').status, 'correct');
});

test('mixed numbers and limits', () => {
  assert.equal(check({ kind: 'number', value: '3/2' }, '1 1/2').status, 'correct');
  assert.equal(check({ kind: 'number', value: '11/2' }, '1 1/2').status, 'wrong');
  assert.equal(check({ kind: 'number', value: '-3/2' }, '−1 1/2').status, 'correct');
  assert.equal(check({ kind: 'number', value: '1' }, '1' + '0'.repeat(100000)).status, 'invalid');
  assert.equal(check({ kind: 'number', value: '1' }, '10^10000').status, 'invalid');
  assert.equal(check({ kind: 'number', value: '1' }, '('.repeat(150) + '1' + ')'.repeat(150)).status, 'invalid');
});

test('expression equivalence', () => {
  const a = { kind: 'expr', value: '2*x+6', forbidParens: true };
  assert.equal(check(a, '2x+6').status, 'correct');
  assert.equal(check(a, '6+2x').status, 'correct');
  assert.equal(check(a, '2(x+3)').status, 'partial');
  assert.equal(check(a, '2x+5').status, 'wrong');
});

test('every generator: own answer passes, solution text exists, 3 hints', () => {
  for (const [grade, list] of Object.entries(TOPICS)) {
    for (const t of list) {
      for (let seed = 1; seed <= 300; seed++) {
        const p = makeProblem({ grade: +grade, topic: t.id, seed });
        assert.equal(p.hints.length, 3, p.id);
        assert.ok(p.prompt.ru && p.prompt.en && p.solution.ru, p.id);
        const ans = p.answer.kind === 'roots' ? p.answer.values.join('; ') : p.answer.kind === 'expr' ? p.answer.value : p.answer.value;
        const res = check(p.answer, ans);
        assert.equal(res.status, 'correct', `${p.id}: ${ans} → ${JSON.stringify(res)}`);
        for (const m of p.answer.mistakes || []) {
          if (check(p.answer, m.value).status === 'correct') continue; // mistake coincides with answer for this seed
          assert.equal(check(p.answer, m.value).status, 'wrong', `${p.id} mistake ${m.id}`);
        }
        assert.ok(!/NaN|undefined|Infinity/.test(JSON.stringify(p)), p.id);
      }
    }
  }
});

test('deterministic by seed', () => {
  assert.deepEqual(makeProblem({ grade: 7, topic: 'linear', seed: 42 }), makeProblem({ grade: 7, topic: 'linear', seed: 42 }));
  assert.equal(makeSet({ grade: 6, count: 5, seed: 9 }).length, 5);
});

test('socratic ladder: no free answers', () => {
  const p = { answer: { kind: 'number', value: '5' }, hints: ['h1', 'h2', 'h3'], keywords: ['перенос'] };
  let s = S.start(p);
  assert.equal(S.canReveal(s), false);
  assert.equal(S.canHint(s), true);
  s = S.hint(s); assert.equal(s.hintLevel, 1);
  assert.equal(S.canHint(s), false, 'needs an attempt before hint 2');
  s = S.attempt(s, '4'); assert.equal(s.solved, false);
  s = S.hint(s); s = S.attempt(s, '3'); s = S.hint(s);
  assert.equal(s.hintLevel, 3);
  assert.equal(S.canReveal(s), false, 'needs an attempt after hint 3');
  s = S.attempt(s, '1');
  assert.equal(S.canReveal(s), true);
  s = S.reveal(s); assert.equal(s.revealed, true); assert.equal(s.xp, 0);
});

test('socratic XP and explanation', () => {
  const p = { answer: { kind: 'number', value: '5' }, hints: ['a', 'b', 'c'], keywords: ['перенос'] };
  let s = S.attempt(S.start(p), '5');
  assert.equal(s.xp, 10);
  assert.equal(S.explain(s, 'ок').ok, false);
  const r = S.explain(s, 'Сделал перенос числа вправо со сменой знака');
  assert.equal(r.ok, true); assert.equal(r.state.xp, 13);
  let w = S.start(p); w = S.attempt(w, '1'); w = S.attempt(w, '2');
  assert.equal(w.suggestHint, true);
  w = S.hint(w); w = S.attempt(w, '5'); assert.equal(w.xp, 7);
  assert.equal(S.attempt(S.start(p), 'abc').attempts, 0, 'invalid input is not an attempt');
});

test('hint 3 never states the final answer as a result', () => {
  for (const [grade, list] of Object.entries(TOPICS)) for (const tp of list) for (let seed = 0; seed < 400; seed++) {
    const p = makeProblem({ grade: +grade, topic: tp.id, seed });
    if (p.answer.kind !== 'number') continue;
    const ans = toQ(p.answer.value).toHuman();
    const h = p.hints[2].ru;
    // the answer must not appear as «= answer» at the end of a hint sentence
    const esc = ans.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.ok(!new RegExp('= ' + esc + '(?![\\d,/]| [−+·])').test(h), `${p.id}: ${h}`);
  }
});

test('regression: known leak shapes are gone', () => {
  for (let seed = 0; seed < 3000; seed++) {
    const o = makeProblem({ grade: 5, topic: 'order_ops', seed });
    assert.ok(!/(?:^|\s)(\d+) \+ (\d+) − (?:\1|\2)\.$/.test(o.hints[2].ru), o.hints[2].ru);
    const n = makeProblem({ grade: 6, topic: 'negatives', seed });
    assert.notEqual(n.answer.value, '0', n.prompt.ru);
    const w = makeProblem({ grade: 7, topic: 'powers', seed });
    assert.ok(!/= \d+¹\.$/.test(w.hints[2].ru), w.hints[2].ru);
  }
  assert.equal(check({ kind: 'number', value: '0' }, '1'.repeat(41) + ' 1/2').status, 'invalid');
  assert.equal(check({ kind: 'roots', values: ['1', '2'] }, '1;2;'.repeat(100)).status, 'invalid');
});
