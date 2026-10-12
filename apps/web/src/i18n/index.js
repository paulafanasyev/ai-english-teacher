import en from './en.js';
import ru from './ru.js';
import extra from './cabinets.js';
import brand from './brand.js';

const dicts = { en, ru };

export const LOCALES = [
  { id: 'ru', label: 'Русский', flag: '🇷🇺' },
  { id: 'en', label: 'English', flag: '🇬🇧' },
];

export const LOCALE_IDS = LOCALES.map((l) => l.id);

export function normalizeLocale(locale) {
  return LOCALE_IDS.includes(locale) ? locale : 'ru';
}

export function translate(locale, key, params) {
  let s = brand[locale]?.[key] ?? dicts[locale]?.[key] ?? extra[locale]?.[key] ?? brand.en[key] ?? dicts.en[key] ?? extra.en?.[key] ?? key;
  if (params) for (const k of Object.keys(params)) s = s.split(`{${k}}`).join(String(params[k]));
  return s;
}

// Pick a language variant from bilingual content objects: {ru, en}
export function pickL(obj, locale) {
  if (obj == null) return '';
  if (typeof obj === 'string') return obj;
  return obj[locale] ?? obj.en ?? obj.ru ?? Object.values(obj)[0] ?? '';
}
