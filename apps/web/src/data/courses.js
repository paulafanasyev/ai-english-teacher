// Phase 11 — multi-course framework: languages + school subjects.
// Delivery per course: 'full' (this app), 'external' (its own demo),
// 'course' (built-in multi-unit course), or 'soon' (roadmap).
// A course of status 'course' has `units[]`; each unit = vocab pack + phrases + auto quiz.
// New courses = add an entry here (+ units); the catalog & runner adapt automatically.

// Word:   { w: <target>, ru, en, emoji }
// Phrase: { src: <target>, ru, en }
const U = (id, emoji, title, pack, phrases) => ({ id, emoji, title, pack, phrases });

const spanishUnits = [
  U('es1', '👋', { ru: 'Приветствия', en: 'Greetings' },
    [
      { w: 'hola', ru: 'привет', en: 'hello', emoji: '👋' }, { w: 'gracias', ru: 'спасибо', en: 'thank you', emoji: '🙏' },
      { w: 'por favor', ru: 'пожалуйста', en: 'please', emoji: '🤲' }, { w: 'adiós', ru: 'пока', en: 'goodbye', emoji: '👋' },
      { w: 'sí', ru: 'да', en: 'yes', emoji: '✅' }, { w: 'no', ru: 'нет', en: 'no', emoji: '❌' },
      { w: 'buenos días', ru: 'доброе утро', en: 'good morning', emoji: '🌅' }, { w: 'amigo', ru: 'друг', en: 'friend', emoji: '🧑‍🤝‍🧑' },
    ],
    [
      { src: 'Hola, ¿cómo estás?', ru: 'Привет, как дела?', en: 'Hello, how are you?' },
      { src: 'Me llamo Ana.', ru: 'Меня зовут Ана.', en: 'My name is Ana.' },
      { src: 'Muchas gracias.', ru: 'Большое спасибо.', en: 'Thank you very much.' },
    ]),
  U('es2', '🍽️', { ru: 'Еда и напитки', en: 'Food & drink' },
    [
      { w: 'agua', ru: 'вода', en: 'water', emoji: '💧' }, { w: 'pan', ru: 'хлеб', en: 'bread', emoji: '🍞' },
      { w: 'leche', ru: 'молоко', en: 'milk', emoji: '🥛' }, { w: 'café', ru: 'кофе', en: 'coffee', emoji: '☕' },
      { w: 'manzana', ru: 'яблоко', en: 'apple', emoji: '🍎' }, { w: 'comida', ru: 'еда', en: 'food', emoji: '🍽️' },
      { w: 'fruta', ru: 'фрукт', en: 'fruit', emoji: '🍇' }, { w: 'queso', ru: 'сыр', en: 'cheese', emoji: '🧀' },
    ],
    [
      { src: 'Quiero un café, por favor.', ru: 'Я хочу кофе, пожалуйста.', en: 'I want a coffee, please.' },
      { src: 'El agua está fría.', ru: 'Вода холодная.', en: 'The water is cold.' },
      { src: 'Me gusta la fruta.', ru: 'Мне нравятся фрукты.', en: 'I like fruit.' },
    ]),
  U('es3', '🏠', { ru: 'Дом и семья', en: 'Home & family' },
    [
      { w: 'casa', ru: 'дом', en: 'house', emoji: '🏠' }, { w: 'familia', ru: 'семья', en: 'family', emoji: '👨‍👩‍👧' },
      { w: 'madre', ru: 'мама', en: 'mother', emoji: '👩' }, { w: 'padre', ru: 'папа', en: 'father', emoji: '👨' },
      { w: 'niño', ru: 'ребёнок', en: 'child', emoji: '🧒' }, { w: 'perro', ru: 'собака', en: 'dog', emoji: '🐕' },
      { w: 'puerta', ru: 'дверь', en: 'door', emoji: '🚪' }, { w: 'silla', ru: 'стул', en: 'chair', emoji: '🪑' },
    ],
    [
      { src: 'Esta es mi casa.', ru: 'Это мой дом.', en: 'This is my house.' },
      { src: 'Tengo una familia grande.', ru: 'У меня большая семья.', en: 'I have a big family.' },
      { src: 'El perro está en casa.', ru: 'Собака дома.', en: 'The dog is at home.' },
    ]),
  U('es4', '✈️', { ru: 'Путешествия и числа', en: 'Travel & numbers' },
    [
      { w: 'uno', ru: 'один', en: 'one', emoji: '1️⃣' }, { w: 'dos', ru: 'два', en: 'two', emoji: '2️⃣' },
      { w: 'tres', ru: 'три', en: 'three', emoji: '3️⃣' }, { w: 'coche', ru: 'машина', en: 'car', emoji: '🚗' },
      { w: 'tren', ru: 'поезд', en: 'train', emoji: '🚆' }, { w: 'ciudad', ru: 'город', en: 'city', emoji: '🏙️' },
      { w: 'playa', ru: 'пляж', en: 'beach', emoji: '🏖️' }, { w: 'sol', ru: 'солнце', en: 'sun', emoji: '☀️' },
    ],
    [
      { src: 'Voy a la ciudad.', ru: 'Я еду в город.', en: "I'm going to the city." },
      { src: 'El tren llega a las dos.', ru: 'Поезд прибывает в два.', en: 'The train arrives at two.' },
      { src: 'Vamos a la playa.', ru: 'Идём на пляж.', en: "Let's go to the beach." },
    ]),
];

const germanUnits = [
  U('de1', '👋', { ru: 'Приветствия', en: 'Greetings' },
    [
      { w: 'hallo', ru: 'привет', en: 'hello', emoji: '👋' }, { w: 'danke', ru: 'спасибо', en: 'thank you', emoji: '🙏' },
      { w: 'bitte', ru: 'пожалуйста', en: 'please', emoji: '🤲' }, { w: 'tschüss', ru: 'пока', en: 'bye', emoji: '👋' },
      { w: 'ja', ru: 'да', en: 'yes', emoji: '✅' }, { w: 'nein', ru: 'нет', en: 'no', emoji: '❌' },
      { w: 'guten Morgen', ru: 'доброе утро', en: 'good morning', emoji: '🌅' }, { w: 'Freund', ru: 'друг', en: 'friend', emoji: '🧑‍🤝‍🧑' },
    ],
    [
      { src: "Hallo, wie geht's?", ru: 'Привет, как дела?', en: 'Hello, how are you?' },
      { src: 'Ich heiße Anna.', ru: 'Меня зовут Анна.', en: 'My name is Anna.' },
      { src: 'Vielen Dank!', ru: 'Большое спасибо!', en: 'Thank you very much!' },
    ]),
  U('de2', '🍽️', { ru: 'Еда и напитки', en: 'Food & drink' },
    [
      { w: 'Wasser', ru: 'вода', en: 'water', emoji: '💧' }, { w: 'Brot', ru: 'хлеб', en: 'bread', emoji: '🍞' },
      { w: 'Milch', ru: 'молоко', en: 'milk', emoji: '🥛' }, { w: 'Kaffee', ru: 'кофе', en: 'coffee', emoji: '☕' },
      { w: 'Apfel', ru: 'яблоко', en: 'apple', emoji: '🍎' }, { w: 'Essen', ru: 'еда', en: 'food', emoji: '🍽️' },
      { w: 'Käse', ru: 'сыр', en: 'cheese', emoji: '🧀' }, { w: 'Obst', ru: 'фрукты', en: 'fruit', emoji: '🍇' },
    ],
    [
      { src: 'Ich möchte einen Kaffee, bitte.', ru: 'Я хочу кофе, пожалуйста.', en: "I'd like a coffee, please." },
      { src: 'Das Wasser ist kalt.', ru: 'Вода холодная.', en: 'The water is cold.' },
      { src: 'Ich mag Obst.', ru: 'Мне нравятся фрукты.', en: 'I like fruit.' },
    ]),
  U('de3', '🏠', { ru: 'Дом и семья', en: 'Home & family' },
    [
      { w: 'Haus', ru: 'дом', en: 'house', emoji: '🏠' }, { w: 'Familie', ru: 'семья', en: 'family', emoji: '👨‍👩‍👧' },
      { w: 'Mutter', ru: 'мама', en: 'mother', emoji: '👩' }, { w: 'Vater', ru: 'папа', en: 'father', emoji: '👨' },
      { w: 'Kind', ru: 'ребёнок', en: 'child', emoji: '🧒' }, { w: 'Hund', ru: 'собака', en: 'dog', emoji: '🐕' },
      { w: 'Tür', ru: 'дверь', en: 'door', emoji: '🚪' }, { w: 'Stuhl', ru: 'стул', en: 'chair', emoji: '🪑' },
    ],
    [
      { src: 'Das ist mein Haus.', ru: 'Это мой дом.', en: 'This is my house.' },
      { src: 'Ich habe eine große Familie.', ru: 'У меня большая семья.', en: 'I have a big family.' },
      { src: 'Der Hund ist zu Hause.', ru: 'Собака дома.', en: 'The dog is at home.' },
    ]),
  U('de4', '✈️', { ru: 'Путешествия и числа', en: 'Travel & numbers' },
    [
      { w: 'eins', ru: 'один', en: 'one', emoji: '1️⃣' }, { w: 'zwei', ru: 'два', en: 'two', emoji: '2️⃣' },
      { w: 'drei', ru: 'три', en: 'three', emoji: '3️⃣' }, { w: 'Auto', ru: 'машина', en: 'car', emoji: '🚗' },
      { w: 'Zug', ru: 'поезд', en: 'train', emoji: '🚆' }, { w: 'Stadt', ru: 'город', en: 'city', emoji: '🏙️' },
      { w: 'Strand', ru: 'пляж', en: 'beach', emoji: '🏖️' }, { w: 'Sonne', ru: 'солнце', en: 'sun', emoji: '☀️' },
    ],
    [
      { src: 'Ich fahre in die Stadt.', ru: 'Я еду в город.', en: "I'm going to the city." },
      { src: 'Der Zug kommt um zwei.', ru: 'Поезд прибывает в два.', en: 'The train comes at two.' },
      { src: 'Wir gehen zum Strand.', ru: 'Идём на пляж.', en: "We're going to the beach." },
    ]),
];

const frenchUnits = [
  U('fr1', '👋', { ru: 'Приветствия', en: 'Greetings' },
    [
      { w: 'bonjour', ru: 'привет', en: 'hello', emoji: '👋' }, { w: 'merci', ru: 'спасибо', en: 'thank you', emoji: '🙏' },
      { w: "s'il vous plaît", ru: 'пожалуйста', en: 'please', emoji: '🤲' }, { w: 'au revoir', ru: 'до свидания', en: 'goodbye', emoji: '👋' },
      { w: 'oui', ru: 'да', en: 'yes', emoji: '✅' }, { w: 'non', ru: 'нет', en: 'no', emoji: '❌' },
      { w: 'bonsoir', ru: 'добрый вечер', en: 'good evening', emoji: '🌆' }, { w: 'ami', ru: 'друг', en: 'friend', emoji: '🧑‍🤝‍🧑' },
    ],
    [
      { src: 'Bonjour, comment ça va ?', ru: 'Привет, как дела?', en: 'Hello, how are you?' },
      { src: "Je m'appelle Anna.", ru: 'Меня зовут Анна.', en: 'My name is Anna.' },
      { src: 'Merci beaucoup !', ru: 'Большое спасибо!', en: 'Thank you very much!' },
    ]),
  U('fr2', '🍽️', { ru: 'Еда и напитки', en: 'Food & drink' },
    [
      { w: 'eau', ru: 'вода', en: 'water', emoji: '💧' }, { w: 'pain', ru: 'хлеб', en: 'bread', emoji: '🍞' },
      { w: 'lait', ru: 'молоко', en: 'milk', emoji: '🥛' }, { w: 'café', ru: 'кофе', en: 'coffee', emoji: '☕' },
      { w: 'pomme', ru: 'яблоко', en: 'apple', emoji: '🍎' }, { w: 'nourriture', ru: 'еда', en: 'food', emoji: '🍽️' },
      { w: 'fromage', ru: 'сыр', en: 'cheese', emoji: '🧀' }, { w: 'fruit', ru: 'фрукт', en: 'fruit', emoji: '🍇' },
    ],
    [
      { src: "Je voudrais un café, s'il vous plaît.", ru: 'Я хочу кофе, пожалуйста.', en: "I'd like a coffee, please." },
      { src: "L'eau est froide.", ru: 'Вода холодная.', en: 'The water is cold.' },
      { src: "J'aime les fruits.", ru: 'Мне нравятся фрукты.', en: 'I like fruit.' },
    ]),
  U('fr3', '🏠', { ru: 'Дом и семья', en: 'Home & family' },
    [
      { w: 'maison', ru: 'дом', en: 'house', emoji: '🏠' }, { w: 'famille', ru: 'семья', en: 'family', emoji: '👨‍👩‍👧' },
      { w: 'mère', ru: 'мама', en: 'mother', emoji: '👩' }, { w: 'père', ru: 'папа', en: 'father', emoji: '👨' },
      { w: 'enfant', ru: 'ребёнок', en: 'child', emoji: '🧒' }, { w: 'chien', ru: 'собака', en: 'dog', emoji: '🐕' },
      { w: 'porte', ru: 'дверь', en: 'door', emoji: '🚪' }, { w: 'chaise', ru: 'стул', en: 'chair', emoji: '🪑' },
    ],
    [
      { src: "C'est ma maison.", ru: 'Это мой дом.', en: 'This is my house.' },
      { src: "J'ai une grande famille.", ru: 'У меня большая семья.', en: 'I have a big family.' },
      { src: 'Le chien est à la maison.', ru: 'Собака дома.', en: 'The dog is at home.' },
    ]),
  U('fr4', '✈️', { ru: 'Путешествия и числа', en: 'Travel & numbers' },
    [
      { w: 'un', ru: 'один', en: 'one', emoji: '1️⃣' }, { w: 'deux', ru: 'два', en: 'two', emoji: '2️⃣' },
      { w: 'trois', ru: 'три', en: 'three', emoji: '3️⃣' }, { w: 'voiture', ru: 'машина', en: 'car', emoji: '🚗' },
      { w: 'train', ru: 'поезд', en: 'train', emoji: '🚆' }, { w: 'ville', ru: 'город', en: 'city', emoji: '🏙️' },
      { w: 'plage', ru: 'пляж', en: 'beach', emoji: '🏖️' }, { w: 'soleil', ru: 'солнце', en: 'sun', emoji: '☀️' },
    ],
    [
      { src: 'Je vais en ville.', ru: 'Я еду в город.', en: "I'm going to the city." },
      { src: 'Le train arrive à deux heures.', ru: 'Поезд прибывает в два.', en: 'The train arrives at two.' },
      { src: 'On va à la plage.', ru: 'Идём на пляж.', en: "Let's go to the beach." },
    ]),
];

const courseTag = (units) => {
  const words = units.reduce((n, u) => n + u.pack.length, 0);
  return {
    ru: `Курс · ${units.length} юнита · ${words} слов`,
    en: `Course · ${units.length} units · ${words} words`,
  };
};

export const COURSES = [
  { id: 'english', kind: 'language', icon: '🇬🇧', status: 'full', route: '/',
    name: { ru: 'Английский', en: 'English' },
    tag: { ru: 'Полный курс · 1500 слов, грамматика, аудио, игры', en: 'Full course · 1500 words, grammar, audio, games' } },
  { id: 'math', kind: 'subject', icon: '🧮', status: 'full', route: '/math',
    name: { ru: 'Математика', en: 'Mathematics' },
    tag: { ru: '5–9 класс · задачи с подсказками по шагам', en: 'Grades 5–9 · problems with step-by-step hints' } },
  { id: 'spanish', kind: 'language', icon: '🇪🇸', status: 'course',
    name: { ru: 'Испанский', en: 'Spanish' },
    tag: courseTag(spanishUnits), units: spanishUnits },
  { id: 'german', kind: 'language', icon: '🇩🇪', status: 'course',
    name: { ru: 'Немецкий', en: 'German' },
    tag: courseTag(germanUnits), units: germanUnits },
  { id: 'french', kind: 'language', icon: '🇫🇷', status: 'course',
    name: { ru: 'Французский', en: 'French' },
    tag: courseTag(frenchUnits), units: frenchUnits },
  { id: 'science', kind: 'subject', icon: '🔬', status: 'soon',
    name: { ru: 'Окружающий мир / Наука', en: 'Science' },
    tag: { ru: 'Скоро', en: 'Coming soon' } },
  { id: 'history', kind: 'subject', icon: '🏛️', status: 'soon',
    name: { ru: 'История', en: 'History' },
    tag: { ru: 'Скоро', en: 'Coming soon' } },
];
