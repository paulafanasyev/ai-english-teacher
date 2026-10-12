import vocabularyRaw from './generated/vocabulary.json';
import grammarRaw from './generated/grammar.json';
import listeningRaw from './generated/listening.json';
import questRaw from './generated/story/quest.json';
import scenariosRaw from './generated/story/scenarios.json';
import phrasesRaw from './generated/story/phrases.json';

// The app is Russian/English only. Generated packs may still carry legacy
// "vi" fields until `node scripts/strip-vi.mjs` is run; drop them on load so
// nothing Vietnamese reaches the UI.
export function stripVi(value) {
  if (Array.isArray(value)) return value.map(stripVi);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, item] of Object.entries(value)) {
      if (key === 'vi') continue;
      out[key] = stripVi(item);
    }
    return out;
  }
  return value;
}

const vocabulary = stripVi(vocabularyRaw);
const grammar = stripVi(grammarRaw);
const quest = stripVi(questRaw);
const scenarios = stripVi(scenariosRaw);
const phrases = stripVi(phrasesRaw);

// Normalize dialogues to the engine shape regardless of source field names:
// lines → {s, t}; questions → {q:{en,ru}, options, answer}
const listening = stripVi(listeningRaw).map((d) => ({
  ...d,
  lines: d.lines.map((ln) => ({ s: ln.s ?? ln.speaker ?? 'A', t: ln.t ?? ln.en ?? ln.text ?? '' })),
  questions: d.questions.map((qq) => ({
    q: qq.q && typeof qq.q === 'object' ? qq.q : { en: qq.en ?? qq.q ?? '', ru: qq.ru ?? '' },
    options: qq.options,
    answer: qq.answer,
  })),
}));

export { vocabulary, grammar, listening, quest, scenarios, phrases };

export const LEVELS = ['A1', 'A2', 'B1', 'B2'];
export const TOPICS = ['basics', 'family', 'food', 'travel', 'school', 'hobbies', 'nature', 'city', 'shopping', 'work', 'technology', 'feelings'];

export const shuffle = (arr) => [...arr].sort(() => 0.5 - Math.random());
export const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const praise = () => pickOne(phrases.praise);
export const encourage = () => pickOne(phrases.encourage);
export const greetingFor = (name) => pickOne(phrases.greetings).split('{name}').join(name || 'friend');
