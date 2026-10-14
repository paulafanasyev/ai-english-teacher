// Svetlana's homework check without the local AI model (and the shared shape of a check).
// With the AI model enabled the same shape comes from the `check_homework` task in ai/tasks.js.
import { checkText } from '../../engine/grammarCheck.js';

const s = (v, max = 400) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

export const MARKS = [5, 4, 3, 2];
export const validMark = (v) => (MARKS.includes(Number(v)) ? Number(v) : null);

// Normalizes a check object coming from storage or from the model.
export function sanitizeCheck(c) {
  if (!isObj(c)) return null;
  const fixes = (Array.isArray(c.fixes) ? c.fixes : [])
    .filter(isObj)
    .map((f) => ({ wrong: s(f.wrong, 160), right: s(f.right, 160), why: s(f.why, 240) }))
    .filter((f) => f.wrong || f.right)
    .slice(0, 6);
  const verdict = s(c.verdict, 600);
  if (!verdict) return null;
  return { mark: validMark(c.mark), verdict, fixes, advice: s(c.advice, 400), source: c.source === 'llm' ? 'llm' : 'fallback', at: Number.isFinite(c.at) ? c.at : 0 };
}

const norm = (v) => String(v || '').toLowerCase().replace(/ё/g, 'е').replace(/,/g, '.').replace(/[\s"'«»]/g, '').replace(/[.;:!?]+$/, '');
const latinWords = (t) => (String(t).match(/[a-z']+/gi) || []).length;
const isEnglish = (subject, answer) => /иностран|англ|english/i.test(subject || '') || latinWords(answer) >= 3;

function compareExpected(expected, answer) {
  const e = norm(expected);
  if (!e) return null;
  const lines = String(answer).split(/\n+/).map(norm).filter(Boolean);
  const last = lines[lines.length - 1] || '';
  const whole = norm(answer);
  if (last === e || last.endsWith(`=${e}`) || last.endsWith(`:${e}`) || whole === e) return true;
  // Several expected answers like "x=2; y=3": every part must be present.
  const parts = String(expected).split(/[;\n]+/).map(norm).filter(Boolean);
  if (parts.length > 1 && parts.every((p) => whole.includes(p))) return true;
  return false;
}

// Rule-based check: English grammar rules, comparison with the teacher's answer, basic completeness.
export function checkHomeworkLocal({ subject = '', task = '', answer = '', expected = '' } = {}) {
  const text = String(answer || '').trim();
  const at = Date.now();
  if (!text) return { mark: null, verdict: 'Ответа нет: напиши решение и сдай ещё раз.', fixes: [], advice: '', source: 'fallback', at };
  const fixes = [];
  const notes = [];
  let mark = null;

  const match = compareExpected(expected, text);
  if (match === true) { mark = 5; notes.push('Ответ совпадает с ответом учителя.'); }
  else if (match === false) { mark = 2; notes.push('Ответ не совпадает с ответом учителя. Проверь решение ещё раз.'); }

  if (isEnglish(subject, text)) {
    checkText(text).forEach((e) => fixes.push({ wrong: e.wrong, right: e.fix, why: e.tip?.ru || e.tip?.en || '' }));
    const words = latinWords(text);
    if (match === null) {
      mark = fixes.length === 0 ? (words >= 8 ? 5 : 4) : fixes.length === 1 ? 4 : 3;
      notes.push(fixes.length ? `Нашла ошибок: ${fixes.length}. Посмотри исправления ниже.` : 'Типичных ошибок не нашла.');
    } else if (fixes.length) notes.push(`Нашла ошибок в английском: ${fixes.length}.`);
  }

  if (mark === null) notes.push('Без ответа учителя и без ИИ я не могу точно проверить решение: оценку поставит учитель.');
  const short = text.split(/\s+/).length < 3 && !/\d/.test(text);
  return {
    mark,
    verdict: notes.join(' '),
    fixes,
    advice: short ? 'Ответ очень короткий: распиши решение подробнее.' : 'Это предварительная проверка. Включи локальный ИИ в настройках, тогда я разберу ответ подробнее.',
    source: 'fallback',
    at,
  };
}
