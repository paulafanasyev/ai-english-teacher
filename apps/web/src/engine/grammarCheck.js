// Lightweight rule-based grammar checker for the student's free text.
// Catches the classic mistakes of RU/VI learners and suggests a friendly fix.
const RULES = [
  { re: /\bi is\b/i, fix: 'I am', tip: { en: 'Use “I am”, not “I is”.', ru: 'С «I» всегда «am»: I am.', vi: 'Với “I” luôn dùng “am”: I am.' } },
  { re: /\bi am agree\b/i, fix: 'I agree', tip: { en: '“Agree” is a verb: I agree.', ru: '«Agree» — глагол: I agree (без am).', vi: '“Agree” là động từ: I agree (không có am).' } },
  { re: /\b(he|she|it) (go|like|want|play|watch|read|eat|study|live|work|have)\b/i, fix: (m) => `${m[1]} ${m[2] === 'have' ? 'has' : m[2] + (/(ch|sh|s|x|o)$/.test(m[2]) ? 'es' : 's')}`, tip: { en: 'After he/she/it add -s.', ru: 'После he/she/it добавляй -s.', vi: 'Sau he/she/it thêm -s.' } },
  { re: /\b(he|she|it) don'?t\b/i, fix: (m) => `${m[1]} doesn't`, tip: { en: 'He/she/it → doesn’t.', ru: 'He/she/it → doesn’t.', vi: 'He/she/it → doesn’t.' } },
  { re: /\ba ([aeiou]\w*)/i, fix: (m) => `an ${m[1]}`, tip: { en: 'Before a vowel sound use “an”.', ru: 'Перед гласным звуком — «an».', vi: 'Trước nguyên âm dùng “an”.' } },
  { re: /\ban ([bcdfghjklmnpqrstvwxyz]\w*)/i, fix: (m) => `a ${m[1]}`, tip: { en: 'Before a consonant sound use “a”.', ru: 'Перед согласным звуком — «a».', vi: 'Trước phụ âm dùng “a”.' } },
  { re: /\bcan to (\w+)/i, fix: (m) => `can ${m[1]}`, tip: { en: 'After “can” no “to”.', ru: 'После «can» нет «to»: can swim.', vi: 'Sau “can” không có “to”.' } },
  { re: /\bwant (go|play|eat|see|watch|buy|read|visit|learn|be)\b/i, fix: (m) => `want to ${m[1]}`, tip: { en: 'Want + to: I want to go.', ru: 'Want + to: I want to go.', vi: 'Want + to: I want to go.' } },
  { re: /\bpeoples\b/i, fix: 'people', tip: { en: '“People” is already plural.', ru: '«People» уже множественное число.', vi: '“People” đã là số nhiều.' } },
  { re: /\bchilds\b/i, fix: 'children', tip: { en: 'Child → children.', ru: 'Child → children.', vi: 'Child → children.' } },
  { re: /\bmans\b/i, fix: 'men', tip: { en: 'Man → men.', ru: 'Man → men.', vi: 'Man → men.' } },
  { re: /\bmore (better|bigger|smaller|easier|faster)\b/i, fix: (m) => m[1], tip: { en: 'No “more” with -er forms.', ru: 'С формами на -er «more» не нужно.', vi: 'Không dùng “more” với dạng -er.' } },
  { re: /\bgood in english\b/i, fix: 'good at English', tip: { en: 'Good AT something.', ru: 'Good AT — «хорош в чём-то».', vi: 'Good AT something.' } },
  { re: /\bi and (my \w+|\w+)\b/i, fix: (m) => `${m[1]} and I`, tip: { en: 'Put yourself last: “... and I”.', ru: 'Себя называют последним: «... and I».', vi: 'Nói về mình sau cùng: “... and I”.' } },
  { re: /\bdon'?t must\b/i, fix: "mustn't", tip: { en: 'Use “mustn’t”, not “don’t must”.', ru: 'Правильно «mustn’t».', vi: 'Dùng “mustn’t”.' } },
  { re: /\bveryy+\b/i, fix: 'very', tip: { en: 'Just “very”.', ru: 'Просто «very».', vi: 'Chỉ cần “very”.' } },
];

export function checkText(text) {
  const found = [];
  for (const rule of RULES) {
    const m = text.match(rule.re);
    if (m) {
      found.push({ wrong: m[0], fix: typeof rule.fix === 'function' ? rule.fix(m) : rule.fix, tip: rule.tip });
      if (found.length >= 2) break;
    }
  }
  return found;
}
