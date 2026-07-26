// The teacher's conversational "brain" — fully offline.
//  - Scenario sessions: scripted situations with forgiving keyword matching.
//  - Free chat: intent patterns + reflective follow-up questions + gentle
//    grammar correction via engine/grammarCheck.
import { phrases, pickOne, praise, encourage } from '../data/index.js';
import { checkText } from './grammarCheck.js';

const normalize = (s) => (s || '').toLowerCase().replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim();
const wordCount = (s) => normalize(s).split(' ').filter(Boolean).length;

/* ---------------- scenario sessions ---------------- */
export function createScenarioSession(scenario) {
  let idx = 0;
  let tries = 0;
  return {
    scenario,
    get step() { return scenario.steps[idx]; },
    get index() { return idx; },
    get total() { return scenario.steps.length; },
    get done() { return idx >= scenario.steps.length; },
    submit(answerRaw) {
      const step = scenario.steps[idx];
      const ans = normalize(answerRaw);
      const groups = step.expect?.any || [];
      const matched = groups.every((group) => group.some((k) => ans.includes(k))) && wordCount(answerRaw) >= (step.expect?.minWords || 1);
      const errors = checkText(answerRaw);
      if (matched) {
        idx++; tries = 0;
        return { ok: true, say: step.good || praise(), errors, done: idx >= scenario.steps.length };
      }
      tries++;
      const say = tries >= 2
        ? `${encourage()} For example: ${hintToExample(step)}`
        : `${encourage()} ${extraNudge(step)}`;
      return { ok: false, say, errors, done: false, showHint: true };
    },
  };
}
const hintToExample = (step) => (step.hint?.en || '').replace(/^say:\s*/i, '').trim() || 'try again!';
const extraNudge = () => pickOne(['Try once more!', 'You can do it!', 'One more try!', "Don't worry, try again!"]);

/* ---------------- free chat ---------------- */
const INTENTS = [
  { re: /\b(hi|hello|hey|good (morning|afternoon|evening))\b/, replies: ['Hello hello! Great to see you.', 'Hey there! I was waiting for you.'] },
  { re: /how are you/, replies: ["I'm wonderful, thank you for asking!", "I'm great — teaching you makes me happy!"] },
  { re: /\bmy name is (\w+)|i'?m (\w+)\b/, cap: true, replies: ['What a lovely name, {cap}!', 'Nice to meet you, {cap}!'] },
  { re: /\bi (like|love|enjoy) ([\w ]{2,25})/, cap: 2, replies: ['{cap}? That sounds fun! Why do you like it?', 'Oh, {cap} is a great choice! How often do you do it?'] },
  { re: /\bi (hate|don'?t like) ([\w ]{2,25})/, cap: 2, replies: ["Really? What don't you like about {cap}?", "That's okay — we all have different tastes. What do you like instead?"] },
  { re: /\bi (am|feel) (tired|sad|bored|angry)/, replies: ["I'm sorry to hear that. A little English can cheer you up! What happened?", 'Oh no! Tell me about it — talking helps.'] },
  { re: /\bi (am|feel) (happy|great|good|fine|excited)/, replies: ["That's wonderful! What made your day so good?", 'Yay! Happy students learn faster. What are you excited about?'] },
  { re: /\bfrom (russia|vietnam|moscow|hanoi|saigon|ho chi minh)/, cap: 1, replies: ['{cap} — how interesting! What is your favorite place there?'] },
  { re: /\b(school|homework|lesson|teacher|class)\b/, replies: ['School stories! What is your favorite subject?', 'Tell me more about your school day.'] },
  { re: /\b(game|games|play|minecraft|roblox|football|soccer)\b/, replies: ['A fellow player! What do you play most often?', 'Games are a great way to practice English too! Which one is your favorite?'] },
  { re: /\b(music|song|sing|band|kpop|rock|rap)\b/, replies: ['Music! What song is in your head right now?', 'I love music too. Who is your favorite singer?'] },
  { re: /\b(cat|dog|pet|hamster|parrot)\b/, replies: ['Aww! What is your pet like? Describe it in English!', 'Pets are the best. What is its name?'] },
  { re: /\b(movie|film|series|anime|cartoon)\b/, replies: ['Nice! What did you watch recently?', 'Movies are great for English. What is your favorite one?'] },
  { re: /\b(food|pizza|sushi|pho|ice cream|hungry)\b/, replies: ['Mmm, now I am hungry too! What is your favorite dish?', 'Food talk! Can you describe your favorite meal?'] },
  { re: /\b(weather|rain|sunny|hot|cold|snow)\b/, replies: ['What is the weather like outside your window right now?'] },
  { re: /\b(thank you|thanks)\b/, replies: ["You're very welcome!", 'Any time, my friend!'] },
  { re: /\b(bye|goodbye|see you)\b/, replies: ['See you soon! Come back for more English magic.', 'Goodbye! You did great today.'] },
  { re: /\?$/, replies: ["Good question! Hmm… I think you can answer it in English yourself — try!", "Interesting question! What do YOU think?"] },
];

const FOLLOW_UPS = [
  'What did you do today?', 'Do you have a pet?', 'What music do you like?',
  'What is your dream trip?', 'What did you eat for breakfast?', 'Do you play any sports?',
  'What is your favorite season, and why?', 'What movie did you watch last?',
  'If you could visit any country, where would you go?', 'What makes you laugh?',
  'What do you usually do on weekends?', 'Which superpower would you choose?',
];
const ACKS = ['Nice!', 'I see!', 'Interesting!', 'Cool!', 'Got it!', 'Lovely!'];

export function createFreeChat() {
  const asked = new Set();
  let turns = 0;
  const nextQuestion = () => {
    const left = FOLLOW_UPS.filter((q) => !asked.has(q));
    const q = pickOne(left.length ? left : FOLLOW_UPS);
    asked.add(q);
    return q;
  };
  return {
    opener(name) {
      return pickOne(phrases.greetings).split('{name}').join(name || 'friend') + ' ' + nextQuestion();
    },
    reply(textRaw) {
      turns++;
      const text = normalize(textRaw);
      const errors = checkText(textRaw);
      let correction = null;
      if (errors.length) {
        const e = errors[0];
        correction = { ...e, say: (phrases.correction.en || 'Small fix: say "{fix}".').split('{fix}').join(e.fix) };
      }
      let base = null;
      for (const intent of INTENTS) {
        const m = text.match(intent.re);
        if (m) {
          let reply = pickOne(intent.replies);
          if (intent.cap) {
            const capture = (typeof intent.cap === 'number' ? m[intent.cap] : (m[1] || m[2] || '')).trim();
            reply = reply.split('{cap}').join(capture || 'that');
          }
          base = reply;
          break;
        }
      }
      if (!base) {
        base = wordCount(textRaw) >= 4
          ? `${pickOne(ACKS)} ${pickOne(['Tell me more!', 'Why do you think so?', 'That sounds interesting.'])}`
          : `${pickOne(ACKS)}`;
      }
      const askMore = !base.includes('?') && (turns % 2 === 1 || wordCount(textRaw) < 4);
      const say = [correction?.say, base, askMore ? nextQuestion() : null].filter(Boolean).join(' ');
      return { say, correction, errors };
    },
    farewell() { return pickOne(phrases.sessionEnd); },
  };
}
