// Phase 9 — IELTS & TOEFL practice content + score estimation.
// Practice/mock only — NOT official certification (IELTS: British Council/IDP/Cambridge; TOEFL: ETS).

// Objective item banks (auto-graded). Each item: { q, options[], answer, skill }

const READING = [
  {
    passage: 'The city of Copenhagen introduced a comprehensive cycling infrastructure over three decades, adding more than 400 kilometres of dedicated bike lanes. As a result, over 62% of residents now commute by bicycle, reducing carbon emissions significantly. Urban planners worldwide study the city as a model for sustainable transport.',
    items: [
      { q: 'What percentage of Copenhagen residents commute by bicycle?', options: ['42%', '52%', '62%', '72%'], answer: '62%', skill: 'reading' },
      { q: 'How many kilometres of bike lanes were added?', options: ['More than 200 km', 'More than 400 km', 'Exactly 400 km', 'More than 600 km'], answer: 'More than 400 km', skill: 'reading' },
      { q: 'Why do urban planners study Copenhagen?', options: ['Its architecture', 'Its public housing', 'Its sustainable transport model', 'Its tourism industry'], answer: 'Its sustainable transport model', skill: 'reading' },
    ],
  },
  {
    passage: 'Coral reefs cover less than 1% of the ocean floor yet support approximately 25% of all marine species. Rising sea temperatures caused by climate change lead to coral bleaching, a process in which corals expel the algae that give them colour and nutrients. Without intervention, scientists predict that 70–90% of reefs could be destroyed by 2050.',
    items: [
      { q: 'What proportion of the ocean floor do coral reefs cover?', options: ['Less than 1%', 'About 5%', 'About 25%', 'About 50%'], answer: 'Less than 1%', skill: 'reading' },
      { q: 'What causes coral bleaching?', options: ['Overfishing', 'Rising sea temperatures', 'Plastic pollution', 'Ocean acidification alone'], answer: 'Rising sea temperatures', skill: 'reading' },
      { q: 'According to scientists, what could happen to reefs by 2050?', options: ['They will fully recover', '70–90% could be destroyed', '25% could be destroyed', 'They will double in size'], answer: '70–90% could be destroyed', skill: 'reading' },
    ],
  },
  {
    passage: 'The Industrial Revolution, which began in Britain in the mid-18th century, transformed manufacturing from cottage industries to factory-based production. Steam power replaced human and animal labour, enabling mass production and accelerating urbanisation. By 1850, more than half of England\'s population lived in cities for the first time in history.',
    items: [
      { q: 'Where did the Industrial Revolution begin?', options: ['France', 'Germany', 'Britain', 'United States'], answer: 'Britain', skill: 'reading' },
      { q: 'What replaced human and animal labour during this period?', options: ['Wind power', 'Water wheels', 'Steam power', 'Electricity'], answer: 'Steam power', skill: 'reading' },
      { q: 'What happened in England by 1850?', options: ['Most people lived in rural areas', 'Over half the population lived in cities', 'The factory system collapsed', 'Coal use declined'], answer: 'Over half the population lived in cities', skill: 'reading' },
    ],
  },
  {
    passage: 'Remote working became mainstream during the global pandemic of 2020–2021, with millions of employees shifting to home offices practically overnight. Studies conducted afterwards found that many workers reported higher productivity and better work-life balance, while employers noted reduced overhead costs. However, concerns about social isolation and blurred professional boundaries also emerged.',
    items: [
      { q: 'What did many workers report after shifting to remote work?', options: ['Lower productivity', 'Higher productivity and better work-life balance', 'Longer working hours only', 'More stress and no benefits'], answer: 'Higher productivity and better work-life balance', skill: 'reading' },
      { q: 'What benefit did employers notice?', options: ['Increased sales', 'Higher staff turnover', 'Reduced overhead costs', 'Better team communication'], answer: 'Reduced overhead costs', skill: 'reading' },
      { q: 'Which concern arose alongside the benefits?', options: ['Higher commuting costs', 'Social isolation', 'Mandatory overtime', 'Office space shortages'], answer: 'Social isolation', skill: 'reading' },
    ],
  },
  {
    passage: 'Artificial intelligence is increasingly being used in medical diagnostics. Machine learning algorithms trained on millions of X-rays and scans can detect conditions such as pneumonia and early-stage cancer with accuracy comparable to experienced radiologists. Proponents argue this technology can extend quality healthcare to under-served regions where specialist doctors are scarce.',
    items: [
      { q: 'What are the AI algorithms trained on?', options: ['Patient interviews', 'Blood test results only', 'Millions of X-rays and scans', 'Doctor notes'], answer: 'Millions of X-rays and scans', skill: 'reading' },
      { q: 'Whose accuracy is the AI reported to match?', options: ['General practitioners', 'Experienced radiologists', 'Medical students', 'Pharmacists'], answer: 'Experienced radiologists', skill: 'reading' },
      { q: 'How could this technology benefit under-served regions?', options: ['By training more doctors locally', 'By reducing the need for hospitals', 'By extending quality healthcare where specialists are scarce', 'By lowering drug prices'], answer: 'By extending quality healthcare where specialists are scarce', skill: 'reading' },
    ],
  },
  {
    passage: 'Fermented foods have been consumed for thousands of years across cultures, from Korean kimchi to German sauerkraut. The fermentation process, carried out by bacteria and yeasts, preserves food and produces beneficial compounds. Recent research suggests that regularly eating fermented foods may support gut microbiome diversity, which is linked to improved immune function.',
    items: [
      { q: 'Which of the following is an example of a fermented food mentioned in the passage?', options: ['Sushi', 'Kimchi', 'Hummus', 'Pasta'], answer: 'Kimchi', skill: 'reading' },
      { q: 'What carries out the fermentation process?', options: ['Sunlight and heat', 'Bacteria and yeasts', 'Added sugar', 'Chemical preservatives'], answer: 'Bacteria and yeasts', skill: 'reading' },
      { q: 'What health benefit is linked to gut microbiome diversity?', options: ['Lower blood pressure', 'Better vision', 'Improved immune function', 'Stronger bones'], answer: 'Improved immune function', skill: 'reading' },
    ],
  },
  {
    passage: 'The Silk Road was not a single route but a network of trade paths connecting China, Central Asia, the Middle East and Europe from around 200 BCE to the 15th century. Merchants traded silk, spices, precious metals and ideas, facilitating the spread of religions, languages and technologies across continents. Modern historians regard it as one of the most important channels of cross-cultural exchange in antiquity.',
    items: [
      { q: 'What was the Silk Road?', options: ['A single road from China to Rome', 'A network of trade paths', 'An ancient sea route', 'A postal route in Central Asia'], answer: 'A network of trade paths', skill: 'reading' },
      { q: 'Which of these was traded along the Silk Road?', options: ['Coffee and tea only', 'Silk, spices and precious metals', 'Weapons and armour only', 'Grain and livestock'], answer: 'Silk, spices and precious metals', skill: 'reading' },
      { q: 'Why do historians consider the Silk Road important?', options: ['It was the longest road ever built', 'It enabled cross-cultural exchange', 'It unified all Asian empires', 'It started the Industrial Revolution'], answer: 'It enabled cross-cultural exchange', skill: 'reading' },
    ],
  },
];

const USE_OF_ENGLISH = [
  // Conditionals
  { q: 'If I ___ more time, I would travel the world.', options: ['have', 'had', 'will have', 'having'], answer: 'had', skill: 'grammar' },
  { q: 'If she ___ harder, she would have passed the exam.', options: ['studies', 'studied', 'had studied', 'study'], answer: 'had studied', skill: 'grammar' },
  { q: 'Unless you ___ now, you will miss the bus.', options: ['leave', 'left', 'will leave', 'leaving'], answer: 'leave', skill: 'grammar' },
  { q: 'Should he ___ any questions, please direct him to reception.', options: ['have', 'has', 'having', 'had'], answer: 'have', skill: 'grammar' },

  // Perfect and progressive tenses
  { q: 'She has lived here ___ 2019.', options: ['for', 'since', 'from', 'during'], answer: 'since', skill: 'grammar' },
  { q: 'By this time next year, I ___ my degree.', options: ['finish', 'will have finished', 'finished', 'am finishing'], answer: 'will have finished', skill: 'grammar' },
  { q: 'They ___ on the project for six months before the client cancelled it.', options: ['work', 'were working', 'had been working', 'have worked'], answer: 'had been working', skill: 'grammar' },
  { q: 'He ___ the report when the power went out.', options: ['writes', 'was writing', 'written', 'write'], answer: 'was writing', skill: 'grammar' },

  // Passive voice
  { q: 'The report must ___ by Friday.', options: ['finish', 'be finished', 'finishing', 'to finish'], answer: 'be finished', skill: 'grammar' },
  { q: 'New regulations ___ to reduce plastic waste.', options: ['introduce', 'were introduced', 'introducing', 'is introduced'], answer: 'were introduced', skill: 'grammar' },
  { q: 'The findings ___ in a leading journal next month.', options: ['publish', 'will be published', 'were published', 'publishing'], answer: 'will be published', skill: 'grammar' },

  // Subject-verb agreement
  { q: 'Neither the manager nor the staff ___ aware of the change.', options: ['was', 'were', 'is being', 'be'], answer: 'was', skill: 'grammar' },
  { q: 'Each of the students ___ given a certificate.', options: ['are', 'were', 'was', 'have been'], answer: 'was', skill: 'grammar' },
  { q: 'The number of applicants ___ increased sharply this year.', options: ['have', 'has', 'are', 'were'], answer: 'has', skill: 'grammar' },

  // Articles
  { q: 'She is ___ honest person who always tells the truth.', options: ['a', 'an', 'the', 'no article'], answer: 'an', skill: 'grammar' },
  { q: '___ Amazon is the largest river by discharge in the world.', options: ['A', 'An', 'The', 'No article'], answer: 'The', skill: 'grammar' },

  // Prepositions
  { q: 'She is very keen ___ learning new languages.', options: ['on', 'for', 'in', 'of'], answer: 'on', skill: 'grammar' },
  { q: 'The results were ___ than we expected.', options: ['good', 'better', 'best', 'well'], answer: 'better', skill: 'grammar' },
  { q: 'He blamed his colleague ___ the mistake.', options: ['for', 'on', 'at', 'about'], answer: 'for', skill: 'grammar' },
  { q: 'The committee consists ___ seven elected members.', options: ['from', 'of', 'with', 'by'], answer: 'of', skill: 'grammar' },

  // Vocabulary: synonyms and word choice
  { q: 'Choose the synonym of "significant".', options: ['tiny', 'important', 'boring', 'quick'], answer: 'important', skill: 'vocab' },
  { q: 'Choose the word closest in meaning to "abundant".', options: ['scarce', 'plentiful', 'accurate', 'urgent'], answer: 'plentiful', skill: 'vocab' },
  { q: 'Which word best completes: "The scientist made a remarkable ___ in cancer research."?', options: ['breakout', 'breakdown', 'breakthrough', 'breakaway'], answer: 'breakthrough', skill: 'vocab' },
  { q: 'Choose the antonym of "deteriorate".', options: ['worsen', 'improve', 'collapse', 'stagnate'], answer: 'improve', skill: 'vocab' },
  { q: 'A "deadline" is…', options: ['a quiet street', 'a final time limit', 'a type of line', 'a meeting'], answer: 'a final time limit', skill: 'vocab' },
  { q: '"Concise" writing is…', options: ['verbose and detailed', 'brief and clear', 'technical and complex', 'informal and chatty'], answer: 'brief and clear', skill: 'vocab' },

  // Collocations
  { q: 'We need to ___ a decision before the deadline.', options: ['do', 'make', 'take', 'have'], answer: 'make', skill: 'vocab' },
  { q: 'The company decided to ___ advantage of the new market opportunities.', options: ['take', 'make', 'get', 'have'], answer: 'take', skill: 'vocab' },
  { q: 'She ___ a major role in negotiating the trade agreement.', options: ['did', 'made', 'played', 'had'], answer: 'played', skill: 'vocab' },
  { q: 'The government launched a campaign to ___ public awareness of the issue.', options: ['rise', 'raise', 'arise', 'rouse'], answer: 'raise', skill: 'vocab' },

  // Word form and register
  { q: 'Despite working long hours, the team remained highly ___.', options: ['motivate', 'motivation', 'motivated', 'motivating'], answer: 'motivated', skill: 'vocab' },
  { q: 'The policy has been widely ___ by health professionals.', options: ['praising', 'praised', 'praises', 'praise'], answer: 'praised', skill: 'vocab' },
  { q: 'There is growing ___ about the environmental impact of fast fashion.', options: ['concern', 'concerned', 'concerning', 'concerns'], answer: 'concern', skill: 'vocab' },
  { q: '"Mitigate" most closely means…', options: ['worsen', 'ignore', 'reduce the severity of', 'prevent entirely'], answer: 'reduce the severity of', skill: 'vocab' },
  { q: 'Choose the correct option: "The evidence ___ that further study is needed."', options: ['suggests', 'suggest', 'is suggesting', 'suggested'], answer: 'suggests', skill: 'grammar' },
  { q: 'The delegation was ___ of representatives from twelve countries.', options: ['composed', 'comprised', 'consisted', 'made'], answer: 'composed', skill: 'vocab' },
];

const LISTENING = [
  {
    transcript: 'Attention passengers: the 9:15 train to Manchester is delayed by twenty minutes and will now depart from platform 4. We apologise for the inconvenience.',
    items: [
      { q: 'How long is the delay?', options: ['10 minutes', '20 minutes', '15 minutes', '40 minutes'], answer: '20 minutes', skill: 'listening' },
      { q: 'From which platform will the train now depart?', options: ['Platform 2', 'Platform 4', 'Platform 9', 'Platform 15'], answer: 'Platform 4', skill: 'listening' },
    ],
  },
  {
    transcript: 'Hi, this is the dental clinic calling to confirm your appointment on Tuesday at half past three. Please arrive ten minutes early and bring your insurance card.',
    items: [
      { q: 'When is the appointment?', options: ['Tuesday 3:30', 'Thursday 3:00', 'Tuesday 3:45', 'Monday 3:30'], answer: 'Tuesday 3:30', skill: 'listening' },
      { q: 'What should the patient bring?', options: ['A referral letter', 'Their insurance card', 'Cash payment', 'Previous X-rays'], answer: 'Their insurance card', skill: 'listening' },
    ],
  },
  {
    transcript: 'Good morning, everyone. Today\'s seminar on climate policy has been moved to Room 12 on the second floor. The session begins at ten o\'clock sharp and will last approximately two hours.',
    items: [
      { q: 'Where has the seminar been moved to?', options: ['Room 2 on the first floor', 'Room 12 on the second floor', 'Room 21 on the ground floor', 'Room 12 on the third floor'], answer: 'Room 12 on the second floor', skill: 'listening' },
      { q: 'How long will the session last?', options: ['One hour', 'One and a half hours', 'Approximately two hours', 'Three hours'], answer: 'Approximately two hours', skill: 'listening' },
    ],
  },
  {
    transcript: 'A: Have you registered for the conference yet? B: No, I missed the early-bird deadline. The standard fee is now £180, but students get a 30% discount. A: That\'s still quite reasonable for a three-day event.',
    items: [
      { q: 'What is the standard conference fee?', options: ['£130', '£150', '£180', '£200'], answer: '£180', skill: 'listening' },
      { q: 'How much discount do students receive?', options: ['10%', '20%', '25%', '30%'], answer: '30%', skill: 'listening' },
    ],
  },
  {
    transcript: 'Welcome to the National History Museum. Today, the Egyptian Gallery will close at three o\'clock for a private event. All other galleries remain open until six. Free guided tours depart from the main entrance every hour.',
    items: [
      { q: 'When will the Egyptian Gallery close today?', options: ['At two o\'clock', 'At three o\'clock', 'At four o\'clock', 'At six o\'clock'], answer: 'At three o\'clock', skill: 'listening' },
      { q: 'When do guided tours depart?', options: ['Every 30 minutes', 'Every hour', 'Twice a day', 'On request only'], answer: 'Every hour', skill: 'listening' },
    ],
  },
  {
    transcript: 'This is a public health announcement. The local swimming pool will be closed for maintenance from Monday to Wednesday next week. Residents are advised to use the sports centre on Park Road as an alternative during this period.',
    items: [
      { q: 'Why will the swimming pool close?', options: ['A sports event', 'Staff training', 'Maintenance work', 'Lack of funding'], answer: 'Maintenance work', skill: 'listening' },
      { q: 'Where should residents go as an alternative?', options: ['The beach', 'The community hall', 'The sports centre on Park Road', 'The river'], answer: 'The sports centre on Park Road', skill: 'listening' },
    ],
  },
  {
    transcript: 'A: I heard the internship application closes on the 31st. B: Actually it\'s been extended to the 14th of next month because they didn\'t get enough applicants. A: Oh great, that gives me time to update my CV. B: Make sure you include a cover letter — it\'s compulsory this year.',
    items: [
      { q: 'Why was the application deadline extended?', options: ['Technical problems with the website', 'Not enough applicants', 'A public holiday', 'Staff absence'], answer: 'Not enough applicants', skill: 'listening' },
      { q: 'What is compulsory in the application this year?', options: ['A portfolio', 'A cover letter', 'A reference from a professor', 'A skills test'], answer: 'A cover letter', skill: 'listening' },
    ],
  },
  {
    transcript: 'Good evening. Tonight\'s lecture by Professor Li on renewable energy has been rescheduled to Thursday at seven p.m. in the Main Auditorium. Seats are limited, so please register online in advance to secure your place.',
    items: [
      { q: 'When has the lecture been rescheduled to?', options: ['Tuesday at 7 p.m.', 'Wednesday at 7 p.m.', 'Thursday at 7 p.m.', 'Friday at 7 p.m.'], answer: 'Thursday at 7 p.m.', skill: 'listening' },
      { q: 'What must attendees do to secure a seat?', options: ['Pay a fee at the door', 'Arrive one hour early', 'Register online in advance', 'Contact the professor directly'], answer: 'Register online in advance', skill: 'listening' },
    ],
  },
];

const WRITING = {
  ielts: [
    { task: 'Task 2 (opinion): "Some people think students should study abroad for at least part of their education. Others believe studying at local universities is preferable." Discuss both views and give your own opinion.', minWords: 250 },
    { task: 'Task 1 (report): The bar chart below shows the percentage of households with internet access in four countries between 2010 and 2023. Summarise the main trends and make comparisons where relevant.', minWords: 150 },
    { task: 'Task 2 (problem-solution): "Obesity rates are rising in many developed countries. What are the main causes of this problem and what measures could be taken to address it?"', minWords: 250 },
  ],
  toefl: [
    { task: 'Independent essay: "Do you agree or disagree with the following statement: technology has made people less social in their daily lives?" Use specific reasons and examples to support your answer.', minWords: 300 },
    { task: 'Integrated task: The reading passage describes three advantages of urban green spaces. The lecture challenges each of these claims. Summarise the points made in the lecture and explain how they cast doubt on the reading.', minWords: 150 },
    { task: 'Independent essay: "Some people prefer to live in a large city, while others prefer the countryside. Which do you prefer and why?" Use details and examples to explain your choice.', minWords: 300 },
  ],
};

const SPEAKING = {
  ielts: [
    'Part 2: Describe a place you have always wanted to visit. You should say: where it is, why you want to go there, and what you would do there. You have 1 minute to prepare and should speak for 1–2 minutes.',
    'Part 1: Do you prefer mornings or evenings? Why? What do you typically do during that time of day?',
    'Part 3 (discussion): Some people argue that international travel broadens the mind. Do you agree? In what ways can travel change a person\'s outlook?',
    'Part 2: Describe a time when you had to solve a difficult problem. Explain what the problem was, what you did, and how you felt about the outcome.',
  ],
  toefl: [
    'Task 1 (independent): Describe a skill you would like to learn and explain why it would be valuable to you. You have 15 seconds to prepare and 45 seconds to speak.',
    'Task 2 (campus announcement): Your university plans to replace the campus bookstore with an additional computer lab. State whether you support or oppose this decision and explain your reasoning.',
    'Task 3 (integrated, academic): The professor describes how cognitive load theory applies to classroom instruction. Explain the concept and the examples used, referring to both the reading and the lecture.',
    'Task 4 (integrated, lecture): Using details from the lecture, explain the concept of biomimicry and describe two examples the professor discusses.',
  ],
};

export const EXAMS = {
  ielts: { id: 'ielts', name: 'IELTS', color: '#c0392b', scale: 'Band 0–9', sections: ['reading', 'listening', 'use', 'writing', 'speaking'] },
  toefl: { id: 'toefl', name: 'TOEFL iBT', color: '#1f5fbf', scale: 'Score 0–120', sections: ['reading', 'listening', 'use', 'writing', 'speaking'] },
};

export const BANKS = { READING, USE_OF_ENGLISH, LISTENING, WRITING, SPEAKING };

export function objectiveItems(section) {
  if (section === 'reading') return READING.flatMap((p) => p.items.map((it) => ({ ...it, passage: p.passage })));
  if (section === 'listening') return LISTENING.flatMap((p) => p.items.map((it) => ({ ...it, transcript: p.transcript })));
  if (section === 'use') return USE_OF_ENGLISH.slice();
  return [];
}

export function buildMock(n = 20) {
  const pool = [...objectiveItems('reading'), ...objectiveItems('listening'), ...objectiveItems('use')];
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, Math.min(n, pool.length));
}

export function ieltsBand(acc) {
  const b = acc >= 0.95 ? 8.5 : acc >= 0.9 ? 8 : acc >= 0.82 ? 7.5 : acc >= 0.74 ? 7 : acc >= 0.66 ? 6.5 : acc >= 0.58 ? 6 : acc >= 0.5 ? 5.5 : acc >= 0.42 ? 5 : acc >= 0.34 ? 4.5 : 4;
  return b.toFixed(1);
}
export function toeflScore(acc) { return Math.round(Math.max(0, Math.min(120, acc * 120))); }
export function cefrLevel(acc) {
  return acc >= 0.9 ? 'C1–C2' : acc >= 0.75 ? 'B2' : acc >= 0.6 ? 'B1–B2' : acc >= 0.45 ? 'B1' : acc >= 0.3 ? 'A2' : 'A1';
}
export function estimate(examId, acc) {
  return examId === 'ielts' ? { headline: 'Band ' + ieltsBand(acc), cefr: cefrLevel(acc) } : { headline: toeflScore(acc) + ' / 120', cefr: cefrLevel(acc) };
}
