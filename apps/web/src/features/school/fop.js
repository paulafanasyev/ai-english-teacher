// Official federal curricula (ФОП) data and lesson-plan helpers. Content: Minprosveshcheniya documents (public).
import math from '../../data/fop/math.json';
import english from '../../data/fop/english.json';

// Display punctuation: numeric ranges get an en dash, word pairs a slash, other dashes a colon.
export function tidy(t) {
  return String(t)
    .replace(/(\d)\s*[-–—]\s*(\d)/g, '$1–$2')
    .replace(/([A-Za-z)])\s[-–—]\s(?=[A-Za-z(])/g, '$1 / ')
    .replace(/\s[–—]\s/g, ': ');
}
const tidyProgram = (p) => ({
  ...p,
  sections: p.sections.map((s) => ({ title: tidy(s.title), topics: s.topics.map(tidy) })),
  results: (p.results || []).map(tidy),
});

export const PROGRAMS = [...math, ...english].map(tidyProgram);

export const DOCS = {
  noo: { title: 'ФОП НОО, приказ Минпросвещения России № 372 от 18.05.2023', url: 'http://publication.pravo.gov.ru/document/0001202307130044' },
  ooo: { title: 'ФОП ООО, приказ Минпросвещения России № 370 от 18.05.2023', url: 'http://publication.pravo.gov.ru/document/0001202307140040' },
  faopNoo: { title: 'ФАОП НОО для обучающихся с ОВЗ, приказ № 1023 от 24.11.2022', url: 'http://publication.pravo.gov.ru/Document/View/0001202303220005' },
  faopOoo: { title: 'ФАОП ООО для обучающихся с ОВЗ, приказ № 1025 от 24.11.2022', url: 'http://publication.pravo.gov.ru/Document/View/0001202303220006' },
  fpu: { title: 'Федеральный перечень учебников, приказ № 495 от 26.06.2025 и его изменения', url: 'http://publication.pravo.gov.ru/document/0001202507290005' },
  edsoo: { title: 'Единое содержание общего образования (edsoo.ru)', url: 'https://edsoo.ru/normativnye-dokumenty/' },
};

// Federal curriculum, variant 1 (5-day week): weekly hours by grade, mandatory part.
export const PLANS = {
  'НОО': {
    label: '1–4 классы', grades: [1, 2, 3, 4], doc: 'noo',
    rows: [
      ['Русский язык', [5, 5, 5, 5]],
      ['Литературное чтение', [4, 4, 4, 4]],
      ['Иностранный язык', [0, 2, 2, 2]],
      ['Математика', [4, 4, 4, 4]],
      ['Окружающий мир', [2, 2, 2, 2]],
      ['Основы религиозных культур и светской этики', [0, 0, 0, 1]],
      ['Изобразительное искусство', [1, 1, 1, 1]],
      ['Музыка', [1, 1, 1, 1]],
      ['Труд (технология)', [1, 1, 1, 1]],
      ['Физическая культура', [2, 2, 2, 2]],
    ],
    total: [20, 22, 22, 23], max: [21, 23, 23, 23],
  },
  'ООО': {
    label: '5–9 классы', grades: [5, 6, 7, 8, 9], doc: 'ooo',
    note: 'Базовая структура варианта 1. Перед утверждением плана школы сверяйте часы с действующей редакцией приказа № 370: в 2024–2025 годах в него вносились изменения.',
    rows: [
      ['Русский язык', [5, 6, 4, 3, 3]],
      ['Литература', [3, 3, 2, 2, 3]],
      ['Иностранный язык', [3, 3, 3, 3, 3]],
      ['Математика', [5, 5, 0, 0, 0]],
      ['Алгебра', [0, 0, 3, 3, 3]],
      ['Геометрия', [0, 0, 2, 2, 2]],
      ['Вероятность и статистика', [0, 0, 1, 1, 1]],
      ['Информатика', [0, 0, 1, 1, 1]],
      ['История', [2, 2, 2, 2, 2]],
      ['Обществознание', [0, 1, 1, 1, 1]],
      ['География', [1, 1, 2, 2, 2]],
      ['Физика', [0, 0, 2, 2, 3]],
      ['Химия', [0, 0, 0, 2, 2]],
      ['Биология', [1, 1, 1, 2, 2]],
      ['ОДНКНР', [0, 1, 1, 0, 0]],
      ['Изобразительное искусство', [1, 1, 1, 0, 0]],
      ['Музыка', [1, 1, 1, 1, 0]],
      ['Труд (технология)', [2, 2, 2, 1, 1]],
      ['Физическая культура', [2, 2, 2, 2, 2]],
      ['Основы безопасности и защиты Родины', [0, 0, 0, 1, 1]],
    ],
    total: [27, 29, 30, 31, 32], max: [29, 30, 32, 33, 33],
  },
};

const SUBJECT_MAP = {
  'Математика': 'Математика', 'Алгебра': 'Алгебра', 'Геометрия': 'Геометрия',
  'Вероятность и статистика': 'Вероятность и статистика', 'Иностранный язык': 'Иностранный (английский) язык',
};

export function findProgram(planSubject, grade) {
  const s = SUBJECT_MAP[planSubject];
  return s ? PROGRAMS.find((p) => p.subject === s && p.grade === grade) : undefined;
}

// Split an official paragraph into sentence-sized lesson topics.
export function splitTopic(text) {
  return String(text).split(/(?<=[.;])\s+(?=[А-ЯЁA-Z«(])/).map((s) => s.trim()).filter(Boolean);
}

export function defaultDays(hoursPerWeek) {
  return ({ 1: [3], 2: [2, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5] })[hoursPerWeek] || [1, 2, 3, 4, 5];
}

export function schoolYearStart(now = new Date()) {
  const y = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return `${y}-09-01`;
}

export function isValidDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s || ''))) return false;
  return !Number.isNaN(new Date(`${s}T12:00:00`).getTime());
}

// Checks the chosen weekdays against the weekly hours. Fewer days than hours means paired lessons.
export function checkDays(days, perWeek) {
  const n = new Set(days).size;
  if (!n) return { ok: false, msg: 'Выберите дни уроков.' };
  if (n > perWeek) return { ok: false, msg: `По программе ${perWeek} ч в неделю: выберите не больше ${perWeek} дн.` };
  if (n < perWeek) return { ok: true, paired: true };
  return { ok: true };
}

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Dates for `count` lessons: `perWeek` lessons a week over the chosen weekdays (1 = Monday).
// Every chosen day gets at least one lesson; extra hours become paired lessons on the first days.
export function lessonDates(start, days, perWeek, count) {
  const sorted = [...new Set(days)].filter((d) => d >= 1 && d <= 6).sort((a, b) => a - b);
  if (!sorted.length || count <= 0 || !isValidDate(start)) return [];
  const total = Math.max(perWeek, sorted.length, 1);
  const slots = {};
  for (let i = 0; i < total; i += 1) { const wd = sorted[i % sorted.length]; slots[wd] = (slots[wd] || 0) + 1; }
  const out = [];
  const d = new Date(`${start}T12:00:00`);
  for (let guard = 0; out.length < count && guard < 800; guard += 1) {
    const n = slots[d.getDay()] || 0;
    for (let k = 0; k < n && out.length < count; k += 1) out.push(ymd(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

// Calendar-thematic plan: distribute the yearly hours over the official topics of the chosen sections.
export function buildPlan(program, { start, days, secs }) {
  const units = [];
  program.sections.forEach((s, si) => {
    if (secs && !secs.includes(si)) return;
    s.topics.forEach((t) => splitTopic(t).forEach((u) => units.push({ section: s.title, topic: u })));
  });
  const total = program.hours_per_year;
  if (!units.length || !total) return [];
  const lessons = [];
  if (units.length > total) {
    const per = units.length / total;
    for (let i = 0; i < total; i += 1) {
      const grp = units.slice(Math.floor(i * per), Math.floor((i + 1) * per));
      lessons.push({ section: grp[0].section, topic: grp.map((g) => g.topic).join(' ') });
    }
  } else {
    const base = Math.floor(total / units.length);
    const extra = total % units.length;
    units.forEach((u, i) => {
      const n = base + (i < extra ? 1 : 0);
      for (let k = 0; k < n; k += 1) lessons.push({ section: u.section, topic: n > 1 ? `${u.topic} (урок ${k + 1} из ${n})` : u.topic });
    });
  }
  const dates = lessonDates(start, days, program.hours_per_week, lessons.length);
  return lessons.map((l, i) => ({ n: i + 1, date: dates[i] || '', ...l, hw: '' }));
}

export function toCSV(rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = ['№', 'Дата', 'Раздел', 'Тема урока', 'Домашнее задание'];
  return `\ufeff${[head, ...rows.map((r) => [r.n, r.date, r.section, r.topic, r.hw])].map((r) => r.map(esc).join(';')).join('\r\n')}`;
}
