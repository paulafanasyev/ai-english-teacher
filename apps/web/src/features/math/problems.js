// Problem generators for grades 5-9 (Russian school programme, ОГЭ-oriented).
// Every problem carries a 3-step hint ladder: question → hint → worked step,
// and a full solution that is shown only after the student has tried.
import { Q } from './rational.js';

export function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
const nz = (r, lo, hi) => { let v = 0; while (v === 0) v = int(r, lo, hi); return v; };
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const L = (ru, en) => ({ ru, en, vi: en });
const H = (q) => q.toHuman();
const sg = (n) => (n < 0 ? `− ${-n}` : `+ ${n}`); // signed term for display
const par = (n) => (n < 0 ? `(${String(n).replace('-', '−')})` : String(n));

export const TOPICS = {
  5: [
    { id: 'frac_same', title: L('Дроби с одинаковым знаменателем', 'Fractions, same denominator') },
    { id: 'order_ops', title: L('Порядок действий', 'Order of operations') },
    { id: 'decimals', title: L('Десятичные дроби', 'Decimals') },
  ],
  6: [
    { id: 'frac_diff', title: L('Дроби с разными знаменателями', 'Fractions, different denominators') },
    { id: 'negatives', title: L('Отрицательные числа', 'Negative numbers') },
    { id: 'proportion', title: L('Пропорции', 'Proportions') },
  ],
  7: [
    { id: 'linear', title: L('Линейные уравнения', 'Linear equations') },
    { id: 'expand', title: L('Раскрытие скобок', 'Expanding brackets') },
    { id: 'powers', title: L('Степени', 'Powers') },
  ],
  8: [
    { id: 'quadratic', title: L('Квадратные уравнения', 'Quadratic equations') },
    { id: 'linear', title: L('Линейные уравнения (повторение)', 'Linear equations (review)') },
  ],
  9: [
    { id: 'percent', title: L('Проценты (ОГЭ)', 'Percentages') },
    { id: 'progression', title: L('Арифметическая прогрессия', 'Arithmetic progression') },
    { id: 'quadratic', title: L('Квадратные уравнения (ОГЭ)', 'Quadratic equations') },
  ],
};

const GEN = {
  frac_same(r) {
    const n = int(r, 5, 15), a = int(r, 1, n - 2), b = int(r, 1, n - a - 1);
    const sum = new Q(BigInt(a + b), BigInt(n));
    return {
      prompt: L(`Вычисли: ${a}/${n} + ${b}/${n}`, `Compute: ${a}/${n} + ${b}/${n}`),
      answer: { kind: 'number', value: sum.toString(), requireReduced: true,
        mistakes: [{ id: 'add_denoms', value: `${a + b}/${2 * n}`, note: L('Знаменатели не складывают! Знаменатель остаётся прежним.', "Don't add denominators: the denominator stays the same.") }] },
      hints: [
        L('Что общего у этих дробей? Что тогда происходит со знаменателем?', 'What do these fractions share? What happens to the denominator then?'),
        L(`Знаменатель ${n} остаётся прежним. А что тогда делать с числителями?`, `The denominator ${n} stays. So what do you do with the numerators?`),
        L(`Сложи числители: ${a} + ${b}. Затем проверь, можно ли сократить получившуюся дробь.`, `Add the numerators: ${a} + ${b}. Then check whether the result can be reduced.`),
      ],
      solution: L(`${a}/${n} + ${b}/${n} = ${a + b}/${n} = ${sum.toString()}`, `${a}/${n} + ${b}/${n} = ${a + b}/${n} = ${sum.toString()}`),
      keywords: ['знаменат', 'числител', 'denominator', 'numerator'],
    };
  },
  order_ops(r) {
    const a = int(r, 2, 20), b = int(r, 2, 9), c = int(r, 2, 9); let d = int(r, 1, 15); while (d === a || d === b * c) d = d >= 15 ? 1 : d + 1;
    const v = a + b * c - d;
    return {
      prompt: L(`Вычисли: ${a} + ${b} · ${c} − ${d}`, `Compute: ${a} + ${b} · ${c} − ${d}`),
      answer: { kind: 'number', value: String(v),
        mistakes: [{ id: 'left_to_right', value: String((a + b) * c - d), note: L('Умножение выполняется раньше сложения.', 'Multiplication comes before addition.') }] },
      hints: [
        L('Какое действие здесь выполняется первым?', 'Which operation goes first here?'),
        L(`Сначала умножение: ${b} · ${c}.`, `Multiplication first: ${b} · ${c}.`),
        L(`${b} · ${c} = ${b * c}. Теперь ${a} + ${b * c} − ${d}.`, `${b} · ${c} = ${b * c}. Now ${a} + ${b * c} − ${d}.`),
      ],
      solution: L(`${b} · ${c} = ${b * c}; ${a} + ${b * c} = ${a + b * c}; ${a + b * c} − ${d} = ${v}`, `${b} · ${c} = ${b * c}; ${a} + ${b * c} = ${a + b * c}; ${a + b * c} − ${d} = ${v}`),
      keywords: ['умнож', 'сначала', 'порядок', 'multipl', 'first'],
    };
  },
  decimals(r) {
    const a = new Q(BigInt(int(r, 11, 999)), 10n), b = new Q(BigInt(int(r, 11, 999)), 100n);
    const s = a.add(b);
    return {
      prompt: L(`Вычисли: ${H(a)} + ${H(b)}`, `Compute: ${H(a).replace(',', '.')} + ${H(b).replace(',', '.')}`),
      answer: { kind: 'number', value: s.toString() },
      hints: [
        L('Как правильно записать числа столбиком, чтобы складывать десятичные дроби?', 'How do you line up decimals in a column?'),
        L('Запятая под запятой. Допиши ноль, чтобы знаков после запятой стало поровну.', 'Point under point. Add a zero so both have the same number of decimal places.'),
        L(`${H(a)}0 + ${H(b)}: складывай как обычные числа, запятую снеси вниз.`, `${H(a).replace(',', '.')}0 + ${H(b).replace(',', '.')}: add as whole numbers, bring the point down.`),
      ],
      solution: L(`${H(a)} + ${H(b)} = ${H(s)}`, `${H(a).replace(',', '.')} + ${H(b).replace(',', '.')} = ${H(s).replace(',', '.')}`),
      keywords: ['запят', 'столбик', 'point', 'column'],
    };
  },
  frac_diff(r) {
    const pairs = [[2, 3], [3, 4], [2, 5], [4, 6], [3, 5], [6, 8], [4, 10], [5, 6]];
    const [b, d] = pick(r, pairs), a = int(r, 1, b - 1), c = int(r, 1, d - 1);
    const s = new Q(BigInt(a), BigInt(b)).add(new Q(BigInt(c), BigInt(d)));
    const l = (b * d) / Number(gcdN(b, d));
    return {
      prompt: L(`Вычисли: ${a}/${b} + ${c}/${d}`, `Compute: ${a}/${b} + ${c}/${d}`),
      answer: { kind: 'number', value: s.toString(), requireReduced: true,
        mistakes: [{ id: 'add_across', value: `${a + c}/${b + d}`, note: L('Числители и знаменатели между собой не складывают. Нужен общий знаменатель.', 'You cannot add tops and bottoms. Find a common denominator.') }] },
      hints: [
        L('Можно ли сразу сложить дроби с разными знаменателями? Что для этого нужно?', 'Can you add fractions with different denominators directly? What do you need?'),
        L(`Найди наименьшее общее кратное ${b} и ${d}.`, `Find the least common multiple of ${b} and ${d}.`),
        L(`Общий знаменатель ${l}: ${a}/${b} = ${(a * l) / b}/${l}, ${c}/${d} = ${(c * l) / d}/${l}.`, `Common denominator ${l}: ${a}/${b} = ${(a * l) / b}/${l}, ${c}/${d} = ${(c * l) / d}/${l}.`),
      ],
      solution: L(`${a}/${b} + ${c}/${d} = ${(a * l) / b}/${l} + ${(c * l) / d}/${l} = ${(a * l) / b + (c * l) / d}/${l}${s.toString() === `${(a * l) / b + (c * l) / d}/${l}` ? '' : ' = ' + s.toString()}`, `${a}/${b} + ${c}/${d} = ${(a * l) / b + (c * l) / d}/${l}${s.toString() === `${(a * l) / b + (c * l) / d}/${l}` ? '' : ' = ' + s.toString()}`),
      keywords: ['общий знаменат', 'нок', 'common denominator', 'lcm'],
    };
  },
  negatives(r) {
    const a = nz(r, -20, 20); let b = nz(r, -20, 20); if (b === a) b = a === 20 ? -19 : a + 1; let c = nz(r, -9, 9); if (Math.abs(c) === 1) c *= int(r, 2, 6);
    const v = (a - b) * c;
    return {
      prompt: L(`Вычисли: (${a} − ${par(b)}) · ${par(c)}`.replace(/-/g, '−'), `Compute: (${a} − ${par(b)}) · ${par(c)}`.replace(/-/g, '−')),
      answer: { kind: 'number', value: String(v) },
      hints: [
        L('Что делаем сначала: скобки или умножение? И что значит «минус минус»?', 'What first: brackets or multiplication? And what does "minus a negative" mean?'),
        L(`Вычитание отрицательного числа = сложение: ${a} − ${par(b)} = ${a} + ${par(-b)}.`.replace(/-/g, '−'), `Subtracting a negative is adding: ${a} − ${par(b)} = ${a} + ${par(-b)}.`.replace(/-/g, '−')),
        L(`Посчитай скобку, затем умножь на ${par(c)}. Правило знаков: «плюс на минус» даёт минус, «минус на минус» даёт плюс.`.replace(/(^|[\s(])-(\d)/g, '$1−$2'), `Compute the bracket, then multiply by ${par(c)}. Sign rule: plus × minus = minus, minus × minus = plus.`.replace(/(^|[\s(])-(\d)/g, '$1−$2')),
      ],
      solution: L(`(${a} − ${par(b)}) · ${par(c)} = ${par(a - b)} · ${par(c)} = ${v}`.replace(/-/g, '−'), `= ${par(a - b)} · ${par(c)} = ${v}`.replace(/-/g, '−')),
      keywords: ['знак', 'минус', 'sign', 'minus'],
    };
  },
  proportion(r) {
    const k = int(r, 2, 6), b = int(r, 2, 9), a = int(r, 1, 12), c = b * k, x = a * k;
    return {
      prompt: L(`Реши пропорцию: ${a} / ${b} = x / ${c}`, `Solve: ${a} / ${b} = x / ${c}`),
      answer: { kind: 'number', value: String(x) },
      hints: [
        L('Какое главное свойство пропорции ты знаешь?', 'What is the main property of a proportion?'),
        L('Произведение крайних членов равно произведению средних.', 'The product of the extremes equals the product of the means.'),
        L(`${b} · x = ${a} · ${c}, то есть ${b}x = ${a * c}.`, `${b} · x = ${a} · ${c}, so ${b}x = ${a * c}.`),
      ],
      solution: L(`${b}x = ${a * c}, x = ${a * c} : ${b} = ${x}`, `${b}x = ${a * c}, x = ${x}`),
      keywords: ['крайн', 'средн', 'крест', 'extreme', 'mean', 'cross'],
    };
  },
  linear(r) {
    const a = nz(r, -9, 9) || 2, x = int(r, -10, 10), b = nz(r, -20, 20), c = a * x + b;
    const ax = a === 1 ? 'x' : a === -1 ? '−x' : `${a}x`.replace('-', '−');
    return {
      prompt: L(`Реши уравнение: ${ax} ${sg(b)} = ${String(c).replace('-', '−')}`, `Solve: ${ax} ${sg(b)} = ${String(c).replace('-', '−')}`),
      answer: { kind: 'number', value: String(x),
        mistakes: [{ id: 'no_sign_flip', value: new Q(BigInt(c + b), BigInt(a)).toString(), note: L('При переносе через «=» знак слагаемого меняется на противоположный.', 'When moving a term across "=", flip its sign.') }] },
      hints: [
        L('Что нужно сделать, чтобы слева осталось только слагаемое с x?', 'What do you do so only the x-term stays on the left?'),
        L(`Перенеси ${b} вправо с противоположным знаком.`.replace('-', '−'), `Move ${b} to the right with the opposite sign.`.replace('-', '−')),
        L(`${ax} = ${c} ${sg(-b)}. Посчитай правую часть и раздели обе части на ${par(a)}.`.replace(/-(\d)/g, '−$1'), `${ax} = ${c} ${sg(-b)}. Compute the right side and divide both sides by ${par(a)}.`.replace(/-(\d)/g, '−$1')),
      ],
      solution: L(`${ax} = ${c - b}; x = ${c - b} : ${par(a)} = ${x}`.replace(/-(\d)/g, '−$1'), `${ax} = ${c - b}; x = ${x}`.replace(/-(\d)/g, '−$1')),
      keywords: ['перенос', 'знак', 'раздел', 'move', 'sign', 'divide'],
    };
  },
  expand(r) {
    const k = nz(r, 2, 6), m = nz(r, -7, 7), p = nz(r, -7, 7); let n = nz(r, 2, 5); if (n === k) n = k === 2 ? 3 : k - 1;
    const cx = k - n, c0 = k * m + n * p; // k(x+m) - n(x-p) = (k-n)x + km + np
    const expr = `${k}(x ${sg(m)}) − ${n}(x ${sg(-p)})`;
    const val = `${cx === 1 ? '' : cx === -1 ? '−' : cx}x ${sg(c0)}`;
    return {
      prompt: L(`Раскрой скобки и приведи подобные: ${expr}`, `Expand and simplify: ${expr}`),
      answer: { kind: 'expr', value: `${cx}*x${c0 < 0 ? '-' + -c0 : '+' + c0}`, forbidParens: true },
      hints: [
        L('Как умножить число на скобку? Что происходит со знаками, если перед скобкой минус?', 'How do you multiply a number by a bracket? What happens to signs if there is a minus before it?'),
        L(`${k}(x ${sg(m)}) = ${k}x ${sg(k * m)}; −${n}(x ${sg(-p)}) = −${n}x ${sg(n * p)}.`, `${k}(x ${sg(m)}) = ${k}x ${sg(k * m)}; −${n}(x ${sg(-p)}) = −${n}x ${sg(n * p)}.`),
        L(`Теперь собери x вместе: ${k}x − ${n}x, и числа: ${k * m} ${sg(n * p)}.`, `Now group x: ${k}x − ${n}x, and numbers: ${k * m} ${sg(n * p)}.`),
      ],
      solution: L(`${k}x ${sg(k * m)} − ${n}x ${sg(n * p)} = ${val}`, `= ${val}`),
      keywords: ['подобн', 'скобк', 'знак', 'like terms', 'bracket', 'sign'],
    };
  },
  powers(r) {
    const a = pick(r, [2, 3, 5, 10]), m = int(r, 2, 5), n = int(r, 1, 4), k = int(r, 1, Math.min(m + n - 2, 4));
    const e = m + n - k, v = a ** e, wrongE = Math.max(0, m * n - k);
    return {
      prompt: L(`Вычисли: ${a}^${m} · ${a}^${n} : ${a}^${k}`, `Compute: ${a}^${m} · ${a}^${n} ÷ ${a}^${k}`),
      answer: { kind: 'number', value: String(v),
        mistakes: wrongE === e ? [] : [{ id: 'mul_exps', value: String(a ** wrongE), note: L('При умножении степеней с одинаковым основанием показатели складывают, а не умножают.', 'When multiplying same-base powers, add exponents, don’t multiply them.') }] },
      hints: [
        L('Какое свойство степеней с одинаковым основанием здесь поможет?', 'Which property of same-base powers helps here?'),
        L('При умножении показатели складываются, при делении вычитаются.', 'Multiplying adds exponents, dividing subtracts them.'),
        L(`${a}^(${m} + ${n} − ${k}) = ${a}^${e}.`, `${a}^(${m} + ${n} − ${k}) = ${a}^${e}.`),
      ],
      solution: L(`${a}^${m + n - k} = ${v}`, `${a}^${e} = ${v}`),
      keywords: ['показател', 'основан', 'exponent', 'base'],
    };
  },
  quadratic(r) {
    let r1 = int(r, -9, 9), r2 = int(r, -9, 9); if (r1 === r2) r2 = r1 + int(r, 1, 4);
    const b = -(r1 + r2), c = r1 * r2;
    const bx = b === 0 ? '' : (Math.abs(b) === 1 ? (b < 0 ? '− x ' : '+ x ') : sg(b) + 'x ');
    const eq = `x² ${bx}${c === 0 ? '' : sg(c) + ' '}= 0`;
    const D = b * b - 4 * c;
    return {
      prompt: L(`Реши уравнение: ${eq}. Если корней два, запиши через «;».`, `Solve: ${eq}. If there are two roots, separate them with «;».`),
      answer: { kind: 'roots', values: [String(r1), String(r2)] },
      hints: [
        L('Какой это вид уравнения и какими способами его можно решить?', 'What kind of equation is this and how can it be solved?'),
        L(`Найди дискриминант: D = b² − 4ac, где a = 1, b = ${b}, c = ${c}. Или подбери корни по теореме Виета.`, `Find the discriminant D = b² − 4ac with a = 1, b = ${b}, c = ${c}, or use Vieta’s theorem.`),
        L(`D = ${D}, √D = ${Math.abs(r1 - r2)}. Корни: x = (${-b} ± ${Math.abs(r1 - r2)}) / 2.`, `D = ${D}, √D = ${Math.abs(r1 - r2)}. Roots: x = (${-b} ± ${Math.abs(r1 - r2)}) / 2.`),
      ],
      solution: L(`D = ${D}; x₁ = ${Math.min(r1, r2)}, x₂ = ${Math.max(r1, r2)}. Проверка по Виета: сумма ${r1 + r2}, произведение ${c}.`, `D = ${D}; x₁ = ${Math.min(r1, r2)}, x₂ = ${Math.max(r1, r2)}.`),
      keywords: ['дискриминант', 'виет', 'discriminant', 'vieta'],
    };
  },
  percent(r) {
    const kind = int(r, 0, 1);
    if (kind === 0) {
      const p = pick(r, [5, 10, 12, 15, 20, 25, 30, 40, 75]), N = pick(r, [80, 120, 200, 240, 360, 450, 600, 1200]);
      const v = new Q(BigInt(p * N), 100n);
      return {
        prompt: L(`Найди ${p}% от ${N}.`, `Find ${p}% of ${N}.`),
        answer: { kind: 'number', value: v.toString() },
        hints: [
          L('Что такое 1%? Какую часть числа он составляет?', 'What is 1%? What part of the number is it?'),
          L(`1% от ${N} — это ${N} : 100.`, `1% of ${N} is ${N} ÷ 100.`),
          L(`${N} : 100 · ${p} = ?`, `${N} ÷ 100 × ${p} = ?`),
        ],
        solution: L(`${N} · ${p} / 100 = ${H(v)}`, `${N} × ${p} / 100 = ${H(v).replace(',', '.')}`),
        keywords: ['сотая', '100', 'hundredth'],
      };
    }
    const price = pick(r, [400, 800, 1200, 1500, 2000, 2500]), p = pick(r, [10, 15, 20, 25, 30]);
    const v = price - (price * p) / 100;
    return {
      prompt: L(`Товар стоил ${price} ₽, его цену снизили на ${p}%. Сколько он стоит теперь?`, `An item cost ${price}; its price dropped by ${p}%. What is the new price?`),
      answer: { kind: 'number', value: String(v), mistakes: [{ id: 'only_discount', value: String((price * p) / 100), note: L('Это размер скидки. А сколько стоит товар после неё?', 'That is the discount itself. What is the price after it?') }] },
      hints: [
        L('Сколько процентов от прежней цены останется после скидки?', 'What percent of the old price remains after the discount?'),
        L(`Останется 100% − ${p}% = ${100 - p}%.`, `${100 - p}% remains.`),
        L(`${price} · ${100 - p} / 100 = ?`, `${price} × ${100 - p} / 100 = ?`),
      ],
      solution: L(`${price} · 0,${String(100 - p).padStart(2, '0')} = ${v} ₽`, `${price} × ${(100 - p) / 100} = ${v}`),
      keywords: ['процент', 'остан', 'percent', 'remain'],
    };
  },
  progression(r) {
    const a1 = int(r, -10, 15), d = nz(r, -5, 7), n = int(r, 6, 20), an = a1 + (n - 1) * d;
    return {
      prompt: L(`Арифметическая прогрессия: a₁ = ${a1}, d = ${d}. Найди a${toSub(n)}.`.replace(/= -/g, '= −'), `Arithmetic progression: a₁ = ${a1}, d = ${d}. Find a${toSub(n)}.`.replace(/= -/g, '= −')),
      answer: { kind: 'number', value: String(an), mistakes: [{ id: 'n_not_n_minus_1', value: String(a1 + n * d), note: L('Шагов от a₁ до aₙ на один меньше, чем n: (n − 1)·d.', 'There are n − 1 steps from a₁ to aₙ: (n − 1)·d.') }] },
      hints: [
        L('Какой формулой выражается n-й член арифметической прогрессии?', 'What formula gives the n-th term of an arithmetic progression?'),
        L('aₙ = a₁ + (n − 1)·d.', 'aₙ = a₁ + (n − 1)·d.'),
        L(`a${toSub(n)} = ${a1} + ${n - 1} · ${par(d)}.`.replace(/-/g, '−'), `a${toSub(n)} = ${a1} + ${n - 1} · ${par(d)}.`.replace(/-/g, '−')),
      ],
      solution: L(`a${toSub(n)} = ${a1} + ${n - 1} · ${par(d)} = ${an}`.replace(/-/g, '−'), `= ${an}`.replace(/-/g, '−')),
      keywords: ['формул', 'n − 1', 'n-1', 'formula'],
    };
  },
};

const SUPD = '⁰¹²³⁴⁵⁶⁷⁸⁹';
// Typographic polish for display only: real minus sign, superscript powers.
function prettyStr(s) {
  return s.replace(/(^|[\s(=:±·,])-(?=\d|x)/g, '$1−').replace(/\^(\d+)/g, (_, d) => [...d].map((c) => SUPD[+c]).join(''));
}
function pretty(o) { return { ru: prettyStr(o.ru), en: prettyStr(o.en), vi: prettyStr(o.vi) }; }

function gcdN(a, b) { while (b) [a, b] = [b, a % b]; return a; }
function toSub(n) { return String(n).split('').map((c) => '₀₁₂₃₄₅₆₇₈₉'[+c]).join(''); }

export function makeProblem({ grade, topic, seed }) {
  const r = rng(seed);
  if (!TOPICS[grade]) grade = 7;
  const list = TOPICS[grade];
  const t = list.some((x) => x.id === topic) ? topic : pick(r, list).id;
  const p = GEN[t](r);
  return { id: `${grade}-${t}-${seed}`, grade, topic: t, ...p, prompt: pretty(p.prompt), hints: p.hints.map(pretty), solution: pretty(p.solution) };
}

export function makeSet({ grade, topic = 'any', count = 6, seed = Date.now() }) {
  return Array.from({ length: count }, (_, i) => makeProblem({ grade, topic, seed: (seed + i * 7919) >>> 0 }));
}
