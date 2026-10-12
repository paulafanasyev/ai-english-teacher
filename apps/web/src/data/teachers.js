import demoUrls from './assetUrls.demo.json';

// Published Pages builds use the repository's local media. Remote demo media is
// opt-in only, so a production build never depends on a hyperagent host.
const PUBLISHED = import.meta.env.VITE_REMOTE_ASSETS === '1' && import.meta.env.VITE_PUBLISHED === '1';

export const spriteUrl = (id) => (PUBLISHED ? demoUrls.avatars[id] : `assets/avatars/${id}.webp`);
export const greetingUrl = (id) => (PUBLISHED ? demoUrls.voices[id] : `assets/voice/${id}.mp3`);
// Intro video matches the interface language (ru / en)
export const introVideoUrl = (locale = 'ru') => {
  const lang = ['en', 'ru'].includes(locale) ? locale : 'ru';
  return PUBLISHED ? (demoUrls.introVideo[lang] || demoUrls.introVideo.ru) : `assets/video/intro-${lang}.mp4`;
};

// Sprite sheet layout (2×2): TL neutral · TR talking · BL happy · BR encouraging
export const TEACHERS = [
  { id: 'emma',  name: 'Emma',  emoji: '☀️', bg: '#FBE3CF', accent: '#E9A23B', gender: 'f',
    voice: { pitch: 1.12, rate: 1.0 },
    tagline: { en: 'Warm & supportive', ru: 'Тёплая и поддерживающая' },
    greeting: "Hi! I'm Emma, your English teacher. Learning English is like making a new friend — let's have some fun together!" },
  { id: 'james', name: 'James', emoji: '🎧', bg: '#DCEFE3', accent: '#3E9B6C', gender: 'm',
    voice: { pitch: 0.85, rate: 0.97 },
    tagline: { en: 'Calm & confident', ru: 'Спокойный и уверенный' },
    greeting: "Hello there! My name is James. Step by step, word by word — we're going to make English feel easy." },
  { id: 'sofia', name: 'Sofia', emoji: '💃', bg: '#D9E8F5', accent: '#C0533E', gender: 'f',
    voice: { pitch: 1.02, rate: 1.02 },
    tagline: { en: 'Bold & inspiring', ru: 'Смелая и вдохновляющая' },
    greeting: "Hola — I mean, hello! I'm Sofia. Every mistake is a step forward, so don't be shy. Let's speak English!" },
  { id: 'alex',  name: 'Alex',  emoji: '⚡', bg: '#D8E9F7', accent: '#D96A2B', gender: 'm',
    voice: { pitch: 1.05, rate: 1.1 },
    tagline: { en: 'Energetic & fun', ru: 'Энергичный и заводной' },
    greeting: "Hey! Alex here! Ready to level up your English like a video game? Let's go — first quest starts now!" },
];

// Unknown or removed teacher ids (e.g. old saved choices) fall back to Emma.
export const teacherById = (id) => TEACHERS.find((t) => t.id === id) || TEACHERS[0];
