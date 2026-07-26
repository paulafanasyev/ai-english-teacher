import en from './en.js';
import ru from './ru.js';
import vi from './vi.js';
import extra from './cabinets.js';

const dicts = { en, ru, vi };

export const LOCALES = [
  { id: 'ru', label: 'Русский', flag: '🇷🇺' },
  { id: 'en', label: 'English', flag: '🇬🇧' },
  { id: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
];

export function translate(locale, key, params) {
  let s = dicts[locale]?.[key] ?? extra[locale]?.[key] ?? dicts.en[key] ?? extra.en?.[key] ?? key;
  if (params) for (const k of Object.keys(params)) s = s.split(`{${k}}`).join(String(params[k]));
  return s;
}

// Pick a language variant from trilingual content objects: {en, ru, vi}
export function pickL(obj, locale) {
  if (obj == null) return '';
  if (typeof obj === 'string') return obj;
  return obj[locale] ?? obj.en ?? Object.values(obj)[0] ?? '';
}
