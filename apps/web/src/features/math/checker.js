// Deterministic answer checker. The language model never decides "right or wrong":
// correctness is decided here with exact arithmetic.
import { Q, MathError } from './rational.js';
import { MAX_INPUT, MAX_DIGITS, parse, evaluate, hasVar, normalize } from './parser.js';

const msg = (ru, en) => ({ ru, en, vi: en });

// Mixed number «1 1/2» (school notation): whole part, space, proper fraction.
const MIXED = /^([−–-]?)\s*(\d+)\s+(\d+)\s*\/\s*(\d+)$/;

export function parseNumber(input) {
  const raw = String(input ?? '').trim();
  if (raw.length > MAX_INPUT) throw new MathError('long');
  const m = MIXED.exec(raw);
  if (m) {
    if ([m[2], m[3], m[4]].some((x) => x.length > MAX_DIGITS)) throw new MathError('long');
    const den = BigInt(m[4]), num = BigInt(m[3]), whole = BigInt(m[2]);
    if (den === 0n) throw new MathError('div0');
    if (num >= den) throw new MathError('syntax');
    return new Q((m[1] ? -1n : 1n) * (whole * den + num), den);
  }
  const ast = parse(input);
  if (hasVar(ast)) throw new MathError('var');
  return evaluate(ast);
}

function splitRoots(input) {
  let s = String(input ?? '').toLowerCase();
  s = s.replace(/x\s*[₁₂12]?\s*=/g, ' ').replace(/х\s*[₁₂12]?\s*=/g, ' ');
  return s.split(/;|\s+(?:и|или|and|or)\s+|,\s+|\s{2,}/).map((t) => t.trim()).filter(Boolean);
}

function isUnreducedFraction(input) {
  const m = /^-?(\d+)\/(\d+)$/.exec(normalize(input));
  if (!m) return false;
  let a = BigInt(m[1]), b = BigInt(m[2]);
  while (b) [a, b] = [b, a % b];
  return a > 1n;
}

// Exact polynomial canonical form: Map(degree → Q). Supports + − × ^(natural) and
// division by a constant. Anything else (x in a denominator) is reported as unsupported,
// so a wrong answer can never be accepted by luck.
const MAX_DEG = 12;
function toPoly(ast) {
  if (ast.num) return new Map([[0, ast.num]]);
  if (ast.v) return new Map([[1, new Q(1n)]]);
  const a = toPoly(ast.a);
  switch (ast.op) {
    case 'neg': return mapCoef(a, (q) => q.neg());
    case '+': return addP(a, toPoly(ast.b));
    case '-': return addP(a, mapCoef(toPoly(ast.b), (q) => q.neg()));
    case '*': return mulP(a, toPoly(ast.b));
    case '/': {
      const b = toPoly(ast.b);
      if (degree(b) > 0) throw new MathError('var_div');
      const k = b.get(0) || new Q(0n);
      if (k.eq(0)) throw new MathError('div0');
      return mapCoef(a, (q) => q.div(k));
    }
    case '^': {
      const b = toPoly(ast.b);
      if (degree(b) > 0) throw new MathError('var_pow');
      const e = b.get(0) || new Q(0n);
      if (!e.isInt() || e.n < 0n || e.n > BigInt(MAX_DEG)) throw new MathError('big_pow');
      let r = new Map([[0, new Q(1n)]]);
      for (let i = 0n; i < e.n; i++) r = mulP(r, a);
      return r;
    }
    default: throw new MathError('op');
  }
}
function clean(p) { for (const [k, v] of p) if (v.eq(0)) p.delete(k); return p; }
function degree(p) { let d = 0; for (const [k, v] of p) if (!v.eq(0) && k > d) d = k; return d; }
function mapCoef(p, f) { const r = new Map(); for (const [k, v] of p) r.set(k, f(v)); return clean(r); }
function addP(a, b) { const r = new Map(a); for (const [k, v] of b) r.set(k, (r.get(k) || new Q(0n)).add(v)); return clean(r); }
function mulP(a, b) {
  const r = new Map();
  for (const [i, x] of a) for (const [j, y] of b) {
    if (i + j > MAX_DEG) throw new MathError('big_pow');
    r.set(i + j, (r.get(i + j) || new Q(0n)).add(x.mul(y)));
  }
  return clean(r);
}
function equivalent(astA, astB) {
  const a = toPoly(astA), b = toPoly(astB);
  if (a.size !== b.size) return false;
  for (const [k, v] of a) { const w = b.get(k); if (!w || !w.eq(v)) return false; }
  return true;
}

function genericDiagnosis(got, exp) {
  if (!exp.eq(0) && got.eq(exp.neg())) return msg('Почти! Проверь знак.', 'Almost! Check the sign.');
  if (!exp.eq(0) && (got.eq(exp.mul(10)) || got.eq(exp.div(10)) || got.eq(exp.mul(100)) || got.eq(exp.div(100))))
    return msg('Цифры верные, проверь, где стоит запятая.', 'Right digits: check the decimal point.');
  if (!exp.eq(0) && !exp.eq(1) && !exp.eq(-1) && got.eq(new Q(exp.d, exp.n)))
    return msg('Похоже, дробь перевёрнута.', 'Looks like the fraction is upside down.');
  return null;
}

/**
 * check(problem.answer, userInput) → { status: 'correct'|'partial'|'wrong'|'invalid', note?, mistake? }
 * answer kinds:
 *  { kind:'number', value:'3/4', requireReduced?:true, mistakes?:[{value, note}] }
 *  { kind:'roots', values:['2','-3'] }
 *  { kind:'expr', value:'2x+6', forbidParens?:true }
 */
export function check(answer, input) {
  const raw = String(input ?? '').trim();
  if (!raw) return { status: 'invalid', note: msg('Введи ответ.', 'Type an answer.') };
  if (raw.length > MAX_INPUT) return { status: 'invalid', note: msg('Слишком длинная запись.', 'That input is too long.') };
  try {
    if (answer.kind === 'number') {
      const exp = Q.of(answer.value instanceof Q ? answer.value : toQ(answer.value));
      const got = parseNumber(raw.replace(/^x\s*=/i, '').replace(/^х\s*=/i, ''));
      if (got.eq(exp)) {
        if (answer.requireReduced && isUnreducedFraction(raw))
          return { status: 'partial', note: msg('Верно, но дробь можно сократить.', 'Correct, but reduce the fraction.') };
        return { status: 'correct' };
      }
      for (const m of answer.mistakes || []) if (got.eq(toQ(m.value))) return { status: 'wrong', mistake: m.id, note: m.note };
      return { status: 'wrong', note: genericDiagnosis(got, exp) };
    }
    if (answer.kind === 'roots') {
      const exp = answer.values.map(toQ);
      const parts = splitRoots(raw);
      if (!parts.length) return { status: 'invalid', note: msg('Введи корни через «;».', 'Enter roots separated by «;».') };
      const got = parts.map(parseNumber);
      const uniq = got.filter((g, i) => got.findIndex((h) => h.eq(g)) === i);
      const hit = uniq.filter((g) => exp.some((e) => e.eq(g)));
      const extra = uniq.length - hit.length;
      if (hit.length === exp.length && extra === 0) return { status: 'correct' };
      if (hit.length > 0 && extra === 0)
        return { status: 'partial', note: msg(`Верно, но корней ${exp.length}. Найди остальные.`, `Right, but there are ${exp.length} roots. Find the rest.`) };
      if (hit.length > 0) return { status: 'wrong', note: msg('Один корень верный, а другой нет. Подставь его в уравнение.', 'One root is right, the other is not. Substitute it back.') };
      return { status: 'wrong', note: msg('Подставь свой ответ в уравнение: получается верное равенство?', 'Plug your answer back in: does the equation hold?') };
    }
    if (answer.kind === 'expr') {
      const exp = parse(answer.value), got = parse(raw);
      if (equivalent(exp, got)) {
        if (answer.forbidParens && /\(/.test(normalize(raw)))
          return { status: 'partial', note: msg('Значение верное, но нужно раскрыть скобки.', 'Same value, but open the brackets.') };
        return { status: 'correct' };
      }
      return { status: 'wrong', note: msg('Проверь при x = 1: совпадает ли твоё выражение с исходным?', 'Test with x = 1: does your expression match the original?') };
    }
    throw new MathError('kind');
  } catch (e) {
    if (e instanceof MathError) {
      if (e.code === 'div0') return { status: 'invalid', note: msg('На ноль делить нельзя.', 'You cannot divide by zero.') };
      if (e.code === 'long') return { status: 'invalid', note: msg('Слишком длинная запись.', 'That input is too long.') };
      if (e.code === 'var_div' || e.code === 'var_pow') return { status: 'invalid', note: msg('Запиши ответ как многочлен, без деления на x.', 'Write the answer as a polynomial, without dividing by x.') };
      return { status: 'invalid', note: msg('Не понимаю запись. Пример: 3/4, −2,5, 2x+6.', "Can't read that. Examples: 3/4, −2.5, 2x+6.") };
    }
    throw e;
  }
}

export function toQ(v) {
  if (v instanceof Q) return v;
  const s = String(v);
  if (/^-?\d+\/\d+$/.test(s)) { const [a, b] = s.split('/'); return new Q(BigInt(a), BigInt(b)); }
  return Q.of(s);
}
