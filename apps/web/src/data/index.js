import vocabulary from './generated/vocabulary.json';
import grammar from './generated/grammar.json';
import listeningRaw from './generated/listening.json';

// Normalize dialogues to the engine shape regardless of source field names:
// lines → {s, t}; questions → {q:{en,ru,vi}, options, answer}
const listening = listeningRaw.map((d) => ({
  ...d,
  lines: d.lines.map((ln) => ({ s: ln.s ?? ln.speaker ?? 'A', t: ln.t ?? ln.en ?? ln.text ?? '' })),
  questions: d.questions.map((qq) => ({
    q: qq.q && typeof qq.q === 'object' ? qq.q : { en: qq.en ?? qq.q ?? '', ru: qq.ru ?? '', vi: qq.vi ?? '' },
    options: qq.options,
    answer: qq.answer,
  })),
}));
import quest from './generated/story/quest.json';
import scenarios from './generated/story/scenarios.json';
import phrases from './generated/story/phrases.json';

export { vocabulary, grammar, listening, quest, scenarios, phrases };

export const LEVELS = ['A1', 'A2', 'B1', 'B2'];
export const TOPICS = ['basics', 'family', 'food', 'travel', 'school', 'hobbies', 'nature', 'city', 'shopping', 'work', 'technology', 'feelings'];

export const shuffle = (arr) => [...arr].sort(() => 0.5 - Math.random());
export const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const praise = () => pickOne(phrases.praise);
export const encourage = () => pickOne(phrases.encourage);
export const greetingFor = (name) => pickOne(phrases.greetings).split('{name}').join(name || 'friend');
