// «Подумай сам» — the hint ladder. Pure state machine, no UI, fully testable.
// Rules:
//  • hint 1 is available any time;
//  • every next hint requires a new attempt after the previous hint;
//  • the full solution unlocks only after hint 3 AND one more attempt;
//  • XP drops with each hint, so thinking pays off.
import { check } from './checker.js';

export const XP_BY_HINTS = [10, 7, 4, 2];
export const EXPLAIN_BONUS = 3;

export function start(problem) {
  return { problem, attempts: 0, hintLevel: 0, attemptsSinceHint: 0, wrongStreak: 0, solved: false, revealed: false, last: null, xp: 0, explained: false };
}

export function canHint(s) {
  if (s.solved || s.revealed || s.hintLevel >= 3) return false;
  return s.hintLevel === 0 || s.attemptsSinceHint > 0;
}

export function canReveal(s) { return !s.solved && !s.revealed && s.hintLevel >= 3 && s.attemptsSinceHint > 0; }

export function attempt(s, input) {
  if (s.solved || s.revealed) return s;
  const res = check(s.problem.answer, input);
  if (res.status === 'invalid') return { ...s, last: res };
  const n = { ...s, attempts: s.attempts + 1, attemptsSinceHint: s.attemptsSinceHint + 1, last: res };
  if (res.status === 'correct') { n.solved = true; n.wrongStreak = 0; n.xp = XP_BY_HINTS[Math.min(3, s.hintLevel)]; }
  else n.wrongStreak = s.wrongStreak + 1;
  n.suggestHint = !n.solved && n.wrongStreak >= 2 && canHint(n);
  return n;
}

export function hint(s) {
  if (!canHint(s)) return s;
  return { ...s, hintLevel: s.hintLevel + 1, attemptsSinceHint: 0, wrongStreak: 0, suggestHint: false };
}

export function reveal(s) {
  if (!canReveal(s)) return s;
  return { ...s, revealed: true, xp: 0 };
}

// After a correct answer the student may explain the idea in own words.
// Deterministic check: long enough and mentions a key idea of this problem.
export function explain(s, text) {
  if (!s.solved || s.explained) return { state: s, ok: false };
  const t = String(text || '').toLowerCase();
  const ok = t.trim().length >= 12 && (s.problem.keywords || []).some((k) => t.includes(k.toLowerCase()));
  return { state: ok ? { ...s, explained: true, xp: s.xp + EXPLAIN_BONUS } : s, ok };
}

export function visibleHints(s) { return s.problem.hints.slice(0, s.hintLevel); }
