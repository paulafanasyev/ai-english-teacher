// Task generation engine — builds every task on the fly from the content
// corpus, adapted to the student's CEFR level and chosen topic. All tasks are
// auto-checked with instant feedback. No external APIs.
import { vocabulary, grammar, listening, shuffle, pickOne, LEVELS } from '../data/index.js';

const nearLevels = (level) => {
  const i = LEVELS.indexOf(level);
  return [level, LEVELS[i - 1], LEVELS[i + 1]].filter(Boolean);
};

function vocabPool(level, topic) {
  let pool = vocabulary.filter((w) => w.level === level && (!topic || topic === 'any' ? true : w.topic === topic));
  if (pool.length < 8) pool = vocabulary.filter((w) => nearLevels(level).includes(w.level) && (!topic || topic === 'any' ? true : w.topic === topic));
  if (pool.length < 8) pool = vocabulary.filter((w) => nearLevels(level).includes(w.level));
  return pool;
}
const trOf = (w, locale) => (locale === 'vi' ? w.vi : w.ru);

/* ---------------- generators ---------------- */
function genVocab(level, topic, locale) {
  const pool = vocabPool(level, topic);
  const word = pickOne(pool);
  const distract = shuffle(pool.filter((w) => w.id !== word.id && w.pos === word.pos).concat(shuffle(pool.filter((w) => w.id !== word.id)))).slice(0, 3);
  const reverse = Math.random() < 0.4;
  const options = shuffle([word, ...distract]);
  return {
    type: reverse ? 'vocabRev' : 'vocab',
    topic: word.topic, level,
    word: reverse ? trOf(word, locale) : word.en,
    example: word.exEn,
    options: options.map((w) => (reverse ? w.en : trOf(w, locale))),
    answer: options.indexOf(word),
    explain: `${word.en} — ${trOf(word, locale)}. ${word.exEn}`,
  };
}

function genGap(level, topic, locale) {
  const pool = vocabPool(level, topic).filter((w) => w.exEn && w.exEn.toLowerCase().includes(w.en.toLowerCase()));
  if (!pool.length) return genVocab(level, topic, locale);
  const word = pickOne(pool);
  const re = new RegExp(`\\b${word.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  const sentence = word.exEn.replace(re, '___');
  if (!sentence.includes('___')) return genVocab(level, topic, locale);
  const distract = shuffle(vocabPool(level, null).filter((w2) => w2.id !== word.id && w2.pos === word.pos)).slice(0, 3);
  const options = shuffle([word, ...distract]);
  return {
    type: 'gap', topic: word.topic, level,
    sentence, hint: trOf(word, locale),
    options: options.map((w) => w.en),
    answer: options.indexOf(word),
    explain: `${word.exEn} (${word.en} — ${trOf(word, locale)})`,
  };
}

function genMatch(level, topic, locale) {
  const pool = shuffle(vocabPool(level, topic)).slice(0, 5);
  return {
    type: 'match', topic: topic || 'any', level,
    pairs: pool.map((w) => ({ id: w.id, a: w.en, b: trOf(w, locale) })),
  };
}

function genGrammar(level, topic, locale) {
  let pool = grammar.filter((g) => g.level === level);
  if (!pool.length) pool = grammar.filter((g) => nearLevels(level).includes(g.level));
  const g = pickOne(pool);
  const base = { topic: g.topic, level: g.level, explainObj: g.explain, gid: g.id };
  if (g.type === 'choose') return { ...base, type: 'choose', sentence: g.sentence, options: g.options, answer: g.answer };
  if (g.type === 'reorder') return { ...base, type: 'reorder', words: shuffle(g.words), correct: g.correct };
  return { ...base, type: 'findError', sentence: g.sentence, errorIndex: g.errorIndex, correction: g.correction };
}

function genListening(level) {
  let pool = listening.filter((l) => l.level === level);
  if (!pool.length) pool = listening.filter((l) => nearLevels(level).includes(l.level));
  const d = pickOne(pool);
  return { type: 'listening', topic: 'listening', level: d.level, dialogue: d };
}

function genWriting(level, topic, locale) {
  const pool = vocabPool(level, topic).filter((w) => w.en.length >= 3 && !w.en.includes(' '));
  const word = pickOne(pool);
  return {
    type: 'writing', topic: word.topic, level,
    prompt: trOf(word, locale), answerText: word.en, example: word.exEn,
    explain: `${word.en} — ${trOf(word, locale)}`,
  };
}

function genSpeaking(level, topic) {
  const pool = grammar.filter((g) => g.type === 'reorder' && nearLevels(level).includes(g.level));
  const sentence = pool.length && Math.random() < 0.6 ? pickOne(pool).correct : pickOne(vocabPool(level, topic)).exEn;
  return { type: 'speaking', topic: topic || 'any', level, sentence };
}

function genFromMaterial(mat, locale) {
  if (mat.gaps.length && (Math.random() < 0.6 || !mat.reorders.length)) {
    const g = pickOne(mat.gaps);
    return { type: 'gap', topic: 'custom', level: 'custom', sentence: g.sentence, options: g.options, answer: g.options.indexOf(g.answer), explain: g.sentence.replace('___', g.answer) };
  }
  const r = pickOne(mat.reorders);
  return { type: 'reorder', topic: 'custom', level: 'custom', words: shuffle(r.words), correct: r.correct, explainObj: null };
}

/* ---------------- lesson assembly ---------------- */
export function generateLesson({ level = 'A1', topic = 'any', count = 8, locale = 'ru', settings = {}, materialTasks = null }) {
  const tasks = [];
  if (topic === 'custom' && materialTasks && (materialTasks.gaps.length || materialTasks.reorders.length)) {
    for (let i = 0; i < count; i++) tasks.push({ id: 't' + i, ...genFromMaterial(materialTasks, locale) });
    return tasks;
  }
  const gens = [
    () => genVocab(level, topic, locale),
    () => genGap(level, topic, locale),
    () => genMatch(level, topic, locale),
    () => genGrammar(level, topic, locale),
    () => genWriting(level, topic, locale),
    () => genGrammar(level, topic, locale),
  ];
  if (settings.listeningEnabled !== false) gens.push(() => genListening(level));
  gens.push(() => genSpeaking(level, topic));
  let order = [];
  while (order.length < count) order = order.concat(shuffle(gens));
  order = order.slice(0, count);
  for (let i = 0; i < count; i++) {
    try { tasks.push({ id: 't' + i, ...order[i]() }); }
    catch { tasks.push({ id: 't' + i, ...genVocab(level, topic, locale) }); }
  }
  return tasks;
}

export const singleTask = (type, { level = 'A1', topic = 'any', locale = 'ru' } = {}) => {
  const map = {
    vocab: () => genVocab(level, topic, locale), gap: () => genGap(level, topic, locale),
    match: () => genMatch(level, topic, locale), grammar: () => genGrammar(level, topic, locale),
    listening: () => genListening(level), writing: () => genWriting(level, topic, locale),
    speaking: () => genSpeaking(level, topic),
  };
  return { id: 'q' + Math.random().toString(36).slice(2, 7), ...(map[type] || map.vocab)() };
};

/* ---------------- checking ---------------- */
const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9' ]/g, '').replace(/\s+/g, ' ').trim();

export function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[m][n];
}

export function speechScore(target, transcript) {
  const tw = norm(target).split(' ').filter(Boolean);
  const heard = norm(transcript);
  const hw = heard.split(' ').filter(Boolean);
  if (!tw.length) return { score: 0, missed: [] };
  let hit = 0; const missed = [];
  for (const w of tw) {
    const ok = hw.some((h) => h === w || (w.length > 3 && levenshtein(h, w) <= 1));
    if (ok) hit++; else missed.push(w);
  }
  return { score: hit / tw.length, missed };
}

// answer: index for option tasks; string for writing/reorder/speaking; {mistakes} for match
export function checkTask(task, answer) {
  switch (task.type) {
    case 'vocab': case 'vocabRev': case 'gap': case 'choose':
      return { correct: answer === task.answer, correctText: task.options[task.answer] };
    case 'findError': {
      const words = task.sentence.split(' ');
      return { correct: answer === task.errorIndex, correctText: `${words[task.errorIndex]} → ${task.correction}` };
    }
    case 'reorder': {
      const ok = norm(answer) === norm(task.correct);
      return { correct: ok, correctText: task.correct };
    }
    case 'writing': {
      const a = norm(answer), b = norm(task.answerText);
      const ok = a === b || (b.length > 4 && levenshtein(a, b) <= 1);
      return { correct: ok, correctText: task.answerText };
    }
    case 'speaking': {
      const { score, missed } = speechScore(task.sentence, answer);
      return { correct: score >= 0.7, correctText: task.sentence, score, missed };
    }
    case 'match':
      return { correct: (answer?.mistakes ?? 99) <= 2, correctText: '' };
    case 'listening': {
      const ok = (answer?.correct ?? 0) === task.dialogue.questions.length;
      return { correct: ok, correctText: '' };
    }
    default:
      return { correct: false, correctText: '' };
  }
}
