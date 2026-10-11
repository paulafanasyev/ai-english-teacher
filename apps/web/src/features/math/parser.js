// Tiny safe expression parser: numbers, x, + - * / : ^, parentheses, implicit multiplication.
// Never uses eval. Returns an AST evaluated with exact rationals (see rational.js).
import { Q, MathError } from './rational.js';

const SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' };

export const MAX_INPUT = 256;
export const MAX_DIGITS = 40;

export function normalize(input) {
  let s = String(input ?? '');
  if (s.length > MAX_INPUT) throw new MathError('long');
  s = s.toLowerCase();
  s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) => '^' + [...m].map((c) => SUP[c]).join(''));
  s = s.replace(/[−–—]/g, '-').replace(/[×·∙*]/g, '*').replace(/[÷:]/g, '/');
  s = s.replace(/[хx]/g, 'x'); // Cyrillic «х» is a very common typo for x
  s = s.replace(/(\d),(\d)/g, '$1.$2'); // decimal comma
  s = s.replace(/\s+/g, '');
  return s;
}

function tokenize(s) {
  const out = []; let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/[0-9.]/.test(c)) {
      let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++;
      const raw = s.slice(i, j);
      if (raw.length > MAX_DIGITS) throw new MathError('long');
      if ((raw.match(/\./g) || []).length > 1 || raw === '.') throw new MathError('syntax');
      out.push({ t: 'num', v: raw }); i = j; continue;
    }
    if (c === 'x') { out.push({ t: 'var' }); i++; continue; }
    if ('+-*/^()'.includes(c)) { out.push({ t: c }); i++; continue; }
    throw new MathError('char');
  }
  if (out.length > 200) throw new MathError('long');
  return out;
}

export function parse(input) {
  const s = normalize(input);
  if (!s) throw new MathError('empty');
  const toks = tokenize(s); let p = 0;
  const peek = () => toks[p]; const take = () => toks[p++];
  const startsPrimary = (k) => k && (k.t === 'num' || k.t === 'var' || k.t === '(');

  function expr() {
    let node = term();
    while (peek() && (peek().t === '+' || peek().t === '-')) { const op = take().t; node = { op, a: node, b: term() }; }
    return node;
  }
  function term() {
    let node = unary();
    for (;;) {
      const k = peek();
      if (k && (k.t === '*' || k.t === '/')) { take(); node = { op: k.t, a: node, b: unary() }; continue; }
      if (startsPrimary(k)) { node = { op: '*', a: node, b: power(), implicit: true }; continue; }
      return node;
    }
  }
  function unary() {
    const k = peek();
    if (k && k.t === '-') { take(); return { op: 'neg', a: unary() }; }
    if (k && k.t === '+') { take(); return unary(); }
    return power();
  }
  function power() {
    const base = primary();
    if (peek() && peek().t === '^') { take(); return { op: '^', a: base, b: unary() }; }
    return base;
  }
  function primary() {
    const k = take();
    if (!k) throw new MathError('syntax');
    if (k.t === 'num') return { num: Q.parseDecimal(k.v.startsWith('.') ? '0' + k.v : k.v) };
    if (k.t === 'var') return { v: 'x' };
    if (k.t === '(') { const e = expr(); if (!peek() || take().t !== ')') throw new MathError('paren'); return e; }
    throw new MathError('syntax');
  }
  const ast = expr();
  if (p !== toks.length) throw new MathError('syntax');
  return ast;
}

export function hasVar(ast) {
  if (!ast) return false;
  if (ast.v) return true;
  return hasVar(ast.a) || hasVar(ast.b);
}

export function evaluate(ast, env = {}) {
  if (ast.num) return ast.num;
  if (ast.v) { if (!env.x) throw new MathError('var'); return env.x; }
  const a = evaluate(ast.a, env);
  switch (ast.op) {
    case 'neg': return a.neg();
    case '+': return a.add(evaluate(ast.b, env));
    case '-': return a.sub(evaluate(ast.b, env));
    case '*': return a.mul(evaluate(ast.b, env));
    case '/': return a.div(evaluate(ast.b, env));
    case '^': return a.pow(evaluate(ast.b, env));
    default: throw new MathError('op');
  }
}
