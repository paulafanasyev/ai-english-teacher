// Phase 11 — multi-course framework: languages + school subjects.
// Delivery per course: 'full' (this app), 'external' (its own demo),
// 'course' (built-in multi-unit course), or 'soon' (roadmap).
// A course of status 'course' has `units[]`; each unit = vocab pack + phrases + auto quiz.
// New courses = add an entry here (+ units); the catalog & runner adapt automatically.

// Word:   { w: <target>, ru, en, emoji }   (vi UI falls back to the en gloss)
// Phrase: { src: <target>, ru, en }
const U = (id, emoji, title, pack, phrases) => ({ id, emoji, title, pack, phrases });

const spanishUnits = [
  U('es1', '👋', { ru: 'Приветствия', en: 'Greetings', vi: 'Chào hỏi' },
    [
      { w: 'hola', ru: 'привет', en: 'hello', vi: "Xin chào", emoji: '👋' }, { w: 'gracias', ru: 'спасибо', en: 'thank you', vi: "Cảm ơn", emoji: '🙏' },
      { w: 'por favor', ru: 'пожалуйста', en: 'please', vi: "Làm ơn", emoji: '🤲' }, { w: 'adiós', ru: 'пока', en: 'goodbye', vi: "Tạm biệt", emoji: '👋' },
      { w: 'sí', ru: 'да', en: 'yes', vi: "Có", emoji: '✅' }, { w: 'no', ru: 'нет', en: 'no', vi: "Không", emoji: '❌' },
      { w: 'buenos días', ru: 'доброе утро', en: 'good morning', vi: "Chào buổi sáng", emoji: '🌅' }, { w: 'amigo', ru: 'друг', en: 'friend', vi: "Bạn", emoji: '🧑‍🤝‍🧑' },
    ],
    [
      { src: 'Hola, ¿cómo estás?', ru: 'Привет, как дела?', en: 'Hello, how are you?', vi: "Xin chào, bạn khỏe không?" },
      { src: 'Me llamo Ana.', ru: 'Меня зовут Ана.', en: 'My name is Ana.', vi: "Tên tôi là Ana." },
      { src: 'Muchas gracias.', ru: 'Большое спасибо.', en: 'Thank you very much.', vi: "Cảm ơn rất nhiều." },
    ]),
  U('es2', '🍽️', { ru: 'Еда и напитки', en: 'Food & drink', vi: 'Đồ ăn & thức uống' },
    [
      { w: 'agua', ru: 'вода', en: 'water', vi: "Nước", emoji: '💧' }, { w: 'pan', ru: 'хлеб', en: 'bread', vi: "Bánh mì", emoji: '🍞' },
      { w: 'leche', ru: 'молоко', en: 'milk', vi: "Sữa", emoji: '🥛' }, { w: 'café', ru: 'кофе', en: 'coffee', vi: "Cà phê", emoji: '☕' },
      { w: 'manzana', ru: 'яблоко', en: 'apple', vi: "Táo", emoji: '🍎' }, { w: 'comida', ru: 'еда', en: 'food', vi: "Đồ ăn", emoji: '🍽️' },
      { w: 'fruta', ru: 'фрукт', en: 'fruit', vi: "Trái cây", emoji: '🍇' }, { w: 'queso', ru: 'сыр', en: 'cheese', vi: "Phô mai", emoji: '🧀' },
    ],
    [
      { src: 'Quiero un café, por favor.', ru: 'Я хочу кофе, пожалуйста.', en: 'I want a coffee, please.', vi: "Cho tôi một cà phê, làm ơn." },
      { src: 'El agua está fría.', ru: 'Вода холодная.', en: 'The water is cold.', vi: "Nước lạnh." },
      { src: 'Me gusta la fruta.', ru: 'Мне нравятся фрукты.', en: 'I like fruit.', vi: "Tôi thích trái cây." },
    ]),
  U('es3', '🏠', { ru: 'Дом и семья', en: 'Home & family', vi: 'Nhà & gia đình' },
    [
      { w: 'casa', ru: 'дом', en: 'house', vi: "Nhà", emoji: '🏠' }, { w: 'familia', ru: 'семья', en: 'family', vi: "Gia đình", emoji: '👨‍👩‍👧' },
      { w: 'madre', ru: 'мама', en: 'mother', vi: "Mẹ", emoji: '👩' }, { w: 'padre', ru: 'папа', en: 'father', vi: "Bố", emoji: '👨' },
      { w: 'niño', ru: 'ребёнок', en: 'child', vi: "Trẻ em", emoji: '🧒' }, { w: 'perro', ru: 'собака', en: 'dog', vi: "Chó", emoji: '🐕' },
      { w: 'puerta', ru: 'дверь', en: 'door', vi: "Cửa", emoji: '🚪' }, { w: 'silla', ru: 'стул', en: 'chair', vi: "Ghế", emoji: '🪑' },
    ],
    [
      { src: 'Esta es mi casa.', ru: 'Это мой дом.', en: 'This is my house.', vi: "Đây là nhà của tôi." },
      { src: 'Tengo una familia grande.', ru: 'У меня большая семья.', en: 'I have a big family.', vi: "Tôi có một gia đình lớn." },
      { src: 'El perro está en casa.', ru: 'Собака дома.', en: 'The dog is at home.', vi: "Con chó ở nhà." },
    ]),
  U('es4', '✈️', { ru: 'Путешествия и числа', en: 'Travel & numbers', vi: 'Du lịch & số đếm' },
    [
      { w: 'uno', ru: 'один', en: 'one', vi: "Một", emoji: '1️⃣' }, { w: 'dos', ru: 'два', en: 'two', vi: "Hai", emoji: '2️⃣' },
      { w: 'tres', ru: 'три', en: 'three', vi: "Ba", emoji: '3️⃣' }, { w: 'coche', ru: 'машина', en: 'car', vi: "Xe hơi", emoji: '🚗' },
      { w: 'tren', ru: 'поезд', en: 'train', vi: "Tàu hỏa", emoji: '🚆' }, { w: 'ciudad', ru: 'город', en: 'city', vi: "Thành phố", emoji: '🏙️' },
      { w: 'playa', ru: 'пляж', en: 'beach', vi: "Bãi biển", emoji: '🏖️' }, { w: 'sol', ru: 'солнце', en: 'sun', vi: "Mặt trời", emoji: '☀️' },
    ],
    [
      { src: 'Voy a la ciudad.', ru: 'Я еду в город.', en: "I'm going to the city.", vi: "Tôi đi đến thành phố." },
      { src: 'El tren llega a las dos.', ru: 'Поезд прибывает в два.', en: 'The train arrives at two.', vi: "Tàu đến lúc hai giờ." },
      { src: 'Vamos a la playa.', ru: 'Идём на пляж.', en: "Let's go to the beach.", vi: "Chúng ta đi biển nào." },
    ]),
];

const germanUnits = [
  U('de1', '👋', { ru: 'Приветствия', en: 'Greetings', vi: 'Chào hỏi' },
    [
      { w: 'hallo', ru: 'привет', en: 'hello', vi: "Xin chào", emoji: '👋' }, { w: 'danke', ru: 'спасибо', en: 'thank you', vi: "Cảm ơn", emoji: '🙏' },
      { w: 'bitte', ru: 'пожалуйста', en: 'please', vi: "Làm ơn", emoji: '🤲' }, { w: 'tschüss', ru: 'пока', en: 'bye', vi: "Tạm biệt", emoji: '👋' },
      { w: 'ja', ru: 'да', en: 'yes', vi: "Có", emoji: '✅' }, { w: 'nein', ru: 'нет', en: 'no', vi: "Không", emoji: '❌' },
      { w: 'guten Morgen', ru: 'доброе утро', en: 'good morning', vi: "Chào buổi sáng", emoji: '🌅' }, { w: 'Freund', ru: 'друг', en: 'friend', vi: "Bạn", emoji: '🧑‍🤝‍🧑' },
    ],
    [
      { src: "Hallo, wie geht's?", ru: 'Привет, как дела?', en: 'Hello, how are you?', vi: "Xin chào, bạn khỏe không?" },
      { src: 'Ich heiße Anna.', ru: 'Меня зовут Анна.', en: 'My name is Anna.', vi: "Tên tôi là Anna." },
      { src: 'Vielen Dank!', ru: 'Большое спасибо!', en: 'Thank you very much!', vi: "Cảm ơn rất nhiều!" },
    ]),
  U('de2', '🍽️', { ru: 'Еда и напитки', en: 'Food & drink', vi: 'Đồ ăn & thức uống' },
    [
      { w: 'Wasser', ru: 'вода', en: 'water', vi: "Nước", emoji: '💧' }, { w: 'Brot', ru: 'хлеб', en: 'bread', vi: "Bánh mì", emoji: '🍞' },
      { w: 'Milch', ru: 'молоко', en: 'milk', vi: "Sữa", emoji: '🥛' }, { w: 'Kaffee', ru: 'кофе', en: 'coffee', vi: "Cà phê", emoji: '☕' },
      { w: 'Apfel', ru: 'яблоко', en: 'apple', vi: "Táo", emoji: '🍎' }, { w: 'Essen', ru: 'еда', en: 'food', vi: "Đồ ăn", emoji: '🍽️' },
      { w: 'Käse', ru: 'сыр', en: 'cheese', vi: "Phô mai", emoji: '🧀' }, { w: 'Obst', ru: 'фрукты', en: 'fruit', vi: "Trái cây", emoji: '🍇' },
    ],
    [
      { src: 'Ich möchte einen Kaffee, bitte.', ru: 'Я хочу кофе, пожалуйста.', en: "I'd like a coffee, please.", vi: "Tôi muốn một cà phê, làm ơn." },
      { src: 'Das Wasser ist kalt.', ru: 'Вода холодная.', en: 'The water is cold.', vi: "Nước lạnh." },
      { src: 'Ich mag Obst.', ru: 'Мне нравятся фрукты.', en: 'I like fruit.', vi: "Tôi thích trái cây." },
    ]),
  U('de3', '🏠', { ru: 'Дом и семья', en: 'Home & family', vi: 'Nhà & gia đình' },
    [
      { w: 'Haus', ru: 'дом', en: 'house', vi: "Nhà", emoji: '🏠' }, { w: 'Familie', ru: 'семья', en: 'family', vi: "Gia đình", emoji: '👨‍👩‍👧' },
      { w: 'Mutter', ru: 'мама', en: 'mother', vi: "Mẹ", emoji: '👩' }, { w: 'Vater', ru: 'папа', en: 'father', vi: "Bố", emoji: '👨' },
      { w: 'Kind', ru: 'ребёнок', en: 'child', vi: "Trẻ em", emoji: '🧒' }, { w: 'Hund', ru: 'собака', en: 'dog', vi: "Chó", emoji: '🐕' },
      { w: 'Tür', ru: 'дверь', en: 'door', vi: "Cửa", emoji: '🚪' }, { w: 'Stuhl', ru: 'стул', en: 'chair', vi: "Ghế", emoji: '🪑' },
    ],
    [
      { src: 'Das ist mein Haus.', ru: 'Это мой дом.', en: 'This is my house.', vi: "Đây là nhà của tôi." },
      { src: 'Ich habe eine große Familie.', ru: 'У меня большая семья.', en: 'I have a big family.', vi: "Tôi có một gia đình lớn." },
      { src: 'Der Hund ist zu Hause.', ru: 'Собака дома.', en: 'The dog is at home.', vi: "Con chó ở nhà." },
    ]),
  U('de4', '✈️', { ru: 'Путешествия и числа', en: 'Travel & numbers', vi: 'Du lịch & số đếm' },
    [
      { w: 'eins', ru: 'один', en: 'one', vi: "Một", emoji: '1️⃣' }, { w: 'zwei', ru: 'два', en: 'two', vi: "Hai", emoji: '2️⃣' },
      { w: 'drei', ru: 'три', en: 'three', vi: "Ba", emoji: '3️⃣' }, { w: 'Auto', ru: 'машина', en: 'car', vi: "Xe hơi", emoji: '🚗' },
      { w: 'Zug', ru: 'поезд', en: 'train', vi: "Tàu hỏa", emoji: '🚆' }, { w: 'Stadt', ru: 'город', en: 'city', vi: "Thành phố", emoji: '🏙️' },
      { w: 'Strand', ru: 'пляж', en: 'beach', vi: "Bãi biển", emoji: '🏖️' }, { w: 'Sonne', ru: 'солнце', en: 'sun', vi: "Mặt trời", emoji: '☀️' },
    ],
    [
      { src: 'Ich fahre in die Stadt.', ru: 'Я еду в город.', en: "I'm going to the city.", vi: "Tôi đi đến thành phố." },
      { src: 'Der Zug kommt um zwei.', ru: 'Поезд прибывает в два.', en: 'The train comes at two.', vi: "Tàu đến lúc hai giờ." },
      { src: 'Wir gehen zum Strand.', ru: 'Идём на пляж.', en: "We're going to the beach.", vi: "Chúng tôi đi biển nào." },
    ]),
];

const frenchUnits = [
  U('fr1', '👋', { ru: 'Приветствия', en: 'Greetings', vi: 'Chào hỏi' },
    [
      { w: 'bonjour', ru: 'привет', en: 'hello', vi: "Xin chào", emoji: '👋' }, { w: 'merci', ru: 'спасибо', en: 'thank you', vi: "Cảm ơn", emoji: '🙏' },
      { w: "s'il vous plaît", ru: 'пожалуйста', en: 'please', vi: "Làm ơn", emoji: '🤲' }, { w: 'au revoir', ru: 'до свидания', en: 'goodbye', vi: "Tạm biệt", emoji: '👋' },
      { w: 'oui', ru: 'да', en: 'yes', vi: "Có", emoji: '✅' }, { w: 'non', ru: 'нет', en: 'no', vi: "Không", emoji: '❌' },
      { w: 'bonsoir', ru: 'добрый вечер', en: 'good evening', vi: "Chào buổi tối", emoji: '🌆' }, { w: 'ami', ru: 'друг', en: 'friend', vi: "Bạn", emoji: '🧑‍🤝‍🧑' },
    ],
    [
      { src: 'Bonjour, comment ça va ?', ru: 'Привет, как дела?', en: 'Hello, how are you?', vi: "Xin chào, bạn khỏe không?" },
      { src: "Je m'appelle Anna.", ru: 'Меня зовут Анна.', en: 'My name is Anna.', vi: "Tên tôi là Anna." },
      { src: 'Merci beaucoup !', ru: 'Большое спасибо!', en: 'Thank you very much!', vi: "Cảm ơn rất nhiều!" },
    ]),
  U('fr2', '🍽️', { ru: 'Еда и напитки', en: 'Food & drink', vi: 'Đồ ăn & thức uống' },
    [
      { w: 'eau', ru: 'вода', en: 'water', vi: "Nước", emoji: '💧' }, { w: 'pain', ru: 'хлеб', en: 'bread', vi: "Bánh mì", emoji: '🍞' },
      { w: 'lait', ru: 'молоко', en: 'milk', vi: "Sữa", emoji: '🥛' }, { w: 'café', ru: 'кофе', en: 'coffee', vi: "Cà phê", emoji: '☕' },
      { w: 'pomme', ru: 'яблоко', en: 'apple', vi: "Táo", emoji: '🍎' }, { w: 'nourriture', ru: 'еда', en: 'food', vi: "Đồ ăn", emoji: '🍽️' },
      { w: 'fromage', ru: 'сыр', en: 'cheese', vi: "Phô mai", emoji: '🧀' }, { w: 'fruit', ru: 'фрукт', en: 'fruit', vi: "Trái cây", emoji: '🍇' },
    ],
    [
      { src: "Je voudrais un café, s'il vous plaît.", ru: 'Я хочу кофе, пожалуйста.', en: "I'd like a coffee, please.", vi: "Tôi muốn một cà phê, làm ơn." },
      { src: "L'eau est froide.", ru: 'Вода холодная.', en: 'The water is cold.', vi: "Nước lạnh." },
      { src: "J'aime les fruits.", ru: 'Мне нравятся фрукты.', en: 'I like fruit.', vi: "Tôi thích trái cây." },
    ]),
  U('fr3', '🏠', { ru: 'Дом и семья', en: 'Home & family', vi: 'Nhà & gia đình' },
    [
      { w: 'maison', ru: 'дом', en: 'house', vi: "Nhà", emoji: '🏠' }, { w: 'famille', ru: 'семья', en: 'family', vi: "Gia đình", emoji: '👨‍👩‍👧' },
      { w: 'mère', ru: 'мама', en: 'mother', vi: "Mẹ", emoji: '👩' }, { w: 'père', ru: 'папа', en: 'father', vi: "Bố", emoji: '👨' },
      { w: 'enfant', ru: 'ребёнок', en: 'child', vi: "Trẻ em", emoji: '🧒' }, { w: 'chien', ru: 'собака', en: 'dog', vi: "Chó", emoji: '🐕' },
      { w: 'porte', ru: 'дверь', en: 'door', vi: "Cửa", emoji: '🚪' }, { w: 'chaise', ru: 'стул', en: 'chair', vi: "Ghế", emoji: '🪑' },
    ],
    [
      { src: "C'est ma maison.", ru: 'Это мой дом.', en: 'This is my house.', vi: "Đây là nhà của tôi." },
      { src: "J'ai une grande famille.", ru: 'У меня большая семья.', en: 'I have a big family.', vi: "Tôi có một gia đình lớn." },
      { src: 'Le chien est à la maison.', ru: 'Собака дома.', en: 'The dog is at home.', vi: "Con chó ở nhà." },
    ]),
  U('fr4', '✈️', { ru: 'Путешествия и числа', en: 'Travel & numbers', vi: 'Du lịch & số đếm' },
    [
      { w: 'un', ru: 'один', en: 'one', vi: "Một", emoji: '1️⃣' }, { w: 'deux', ru: 'два', en: 'two', vi: "Hai", emoji: '2️⃣' },
      { w: 'trois', ru: 'три', en: 'three', vi: "Ba", emoji: '3️⃣' }, { w: 'voiture', ru: 'машина', en: 'car', vi: "Xe hơi", emoji: '🚗' },
      { w: 'train', ru: 'поезд', en: 'train', vi: "Tàu hỏa", emoji: '🚆' }, { w: 'ville', ru: 'город', en: 'city', vi: "Thành phố", emoji: '🏙️' },
      { w: 'plage', ru: 'пляж', en: 'beach', vi: "Bãi biển", emoji: '🏖️' }, { w: 'soleil', ru: 'солнце', en: 'sun', vi: "Mặt trời", emoji: '☀️' },
    ],
    [
      { src: 'Je vais en ville.', ru: 'Я еду в город.', en: "I'm going to the city.", vi: "Tôi đi đến thành phố." },
      { src: 'Le train arrive à deux heures.', ru: 'Поезд прибывает в два.', en: 'The train arrives at two.', vi: "Tàu đến lúc hai giờ." },
      { src: 'On va à la plage.', ru: 'Идём на пляж.', en: "Let's go to the beach.", vi: "Chúng ta đi biển nào." },
    ]),
];

const courseTag = (units) => {
  const words = units.reduce((n, u) => n + u.pack.length, 0);
  return {
    ru: `Курс · ${units.length} юнита · ${words} слов`,
    en: `Course · ${units.length} units · ${words} words`,
    vi: `Khóa học · ${units.length} bài · ${words} từ`,
  };
};

export const COURSES = [
  { id: 'english', kind: 'language', icon: '🇬🇧', status: 'full', route: '/',
    name: { ru: 'Английский', en: 'English', vi: 'Tiếng Anh' },
    tag: { ru: 'Полный курс · 1500 слов, грамматика, аудио, игры', en: 'Full course · 1500 words, grammar, audio, games', vi: 'Khóa đầy đủ · 1500 từ, ngữ pháp, nghe, trò chơi' } },
  { id: 'math', kind: 'subject', icon: '🧮', status: 'external', url: 'https://hyperagent.com/s/AY5vWD3abb1uQEKFiUBmdw',
    name: { ru: 'Математика', en: 'Mathematics', vi: 'Toán học' },
    tag: { ru: 'Демо · 8 тем × 5 уровней', en: 'Demo · 8 topics × 5 levels', vi: 'Demo · 8 chủ đề × 5 cấp độ' } },
  { id: 'spanish', kind: 'language', icon: '🇪🇸', status: 'course',
    name: { ru: 'Испанский', en: 'Spanish', vi: 'Tiếng Tây Ban Nha' },
    tag: courseTag(spanishUnits), units: spanishUnits },
  { id: 'german', kind: 'language', icon: '🇩🇪', status: 'course',
    name: { ru: 'Немецкий', en: 'German', vi: 'Tiếng Đức' },
    tag: courseTag(germanUnits), units: germanUnits },
  { id: 'french', kind: 'language', icon: '🇫🇷', status: 'course',
    name: { ru: 'Французский', en: 'French', vi: 'Tiếng Pháp' },
    tag: courseTag(frenchUnits), units: frenchUnits },
  { id: 'science', kind: 'subject', icon: '🔬', status: 'soon',
    name: { ru: 'Окружающий мир / Наука', en: 'Science', vi: 'Khoa học' },
    tag: { ru: 'Скоро', en: 'Coming soon', vi: 'Sắp có' } },
  { id: 'history', kind: 'subject', icon: '🏛️', status: 'soon',
    name: { ru: 'История', en: 'History', vi: 'Lịch sử' },
    tag: { ru: 'Скоро', en: 'Coming soon', vi: 'Sắp có' } },
];
