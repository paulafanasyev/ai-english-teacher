import demoUrls from './assetUrls.demo.json';

// Published Pages builds use the repository's local media. Remote demo media is
// opt-in only, so a production build never depends on a hyperagent host.
const PUBLISHED = import.meta.env.VITE_REMOTE_ASSETS === '1' && import.meta.env.VITE_PUBLISHED === '1';

export const spriteUrl = (id) => (PUBLISHED ? demoUrls.avatars[id] : `assets/avatars/${id}.webp`);
export const greetingUrl = (id) => (PUBLISHED ? demoUrls.voices[id] : `assets/voice/${id}.mp3`);
// Intro video matches the interface language (en / ru / vi)
export const introVideoUrl = (locale = 'en') => {
  const lang = ['en', 'ru', 'vi'].includes(locale) ? locale : 'en';
  return PUBLISHED ? (demoUrls.introVideo[lang] || demoUrls.introVideo.en) : `assets/video/intro-${lang}.mp4`;
};

// Sprite sheet layout (2×2): TL neutral · TR talking · BL happy · BR encouraging
export const TEACHERS = [
  { id: 'emma',  name: 'Emma',  emoji: '☀️', bg: '#FBE3CF', accent: '#E9A23B', gender: 'f',
    voice: { pitch: 1.12, rate: 1.0 },
    tagline: { en: 'Warm & supportive', ru: 'Тёплая и поддерживающая', vi: 'Ấm áp và tận tình' },
    greeting: "Hi! I'm Emma, your English teacher. Learning English is like making a new friend — let's have some fun together!" },
  { id: 'james', name: 'James', emoji: '🎧', bg: '#DCEFE3', accent: '#3E9B6C', gender: 'm',
    voice: { pitch: 0.85, rate: 0.97 },
    tagline: { en: 'Calm & confident', ru: 'Спокойный и уверенный', vi: 'Điềm tĩnh và tự tin' },
    greeting: "Hello there! My name is James. Step by step, word by word — we're going to make English feel easy." },
  { id: 'sofia', name: 'Sofia', emoji: '💃', bg: '#D9E8F5', accent: '#C0533E', gender: 'f',
    voice: { pitch: 1.02, rate: 1.02 },
    tagline: { en: 'Bold & inspiring', ru: 'Смелая и вдохновляющая', vi: 'Mạnh mẽ và truyền cảm hứng' },
    greeting: "Hola — I mean, hello! I'm Sofia. Every mistake is a step forward, so don't be shy. Let's speak English!" },
  { id: 'alex',  name: 'Alex',  emoji: '⚡', bg: '#D8E9F7', accent: '#D96A2B', gender: 'm',
    voice: { pitch: 1.05, rate: 1.1 },
    tagline: { en: 'Energetic & fun', ru: 'Энергичный и заводной', vi: 'Năng động và hài hước' },
    greeting: "Hey! Alex here! Ready to level up your English like a video game? Let's go — first quest starts now!" },
  { id: 'linh',  name: 'Linh',  emoji: '🌿', bg: '#F7E2E4', accent: '#3E7CA6', gender: 'f',
    voice: { pitch: 1.08, rate: 1.0 },
    tagline: { en: 'Graceful guide', ru: 'Изящный проводник', vi: 'Người dẫn đường duyên dáng' },
    greeting: "Xin chào — and hello! I'm Linh. I learned English just like you, and now I'll show you the way!" },
  { id: 'minh',  name: 'Minh',  emoji: '🌟', bg: '#F7EFC9', accent: '#2F7FB0', gender: 'm',
    voice: { pitch: 0.94, rate: 0.98 },
    tagline: { en: 'Patient & practical', ru: 'Терпеливый и практичный', vi: 'Kiên nhẫn và thực tế' },
    greeting: "Xin chào! I'm Minh. I learned English right here in Vietnam, step by step — and I'll help you speak it with confidence. Let's begin!" },
];

export const teacherById = (id) => TEACHERS.find((t) => t.id === id) || TEACHERS[0];
