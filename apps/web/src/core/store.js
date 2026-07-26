import { create } from 'zustand';
import { api } from './api.js';
import { storage } from './storage.js';
import { translate } from '../i18n/index.js';

const savedPrefs = storage.get('aet_prefs', {});

export const useApp = create((set, get) => ({
  user: null,
  booted: false,
  locale: savedPrefs.locale || 'ru',
  prefs: {
    musicOn: false,
    musicStyle: 'lofi',
    musicVol: 0.45,
    sfxOn: true,
    voiceOn: true,
    theme: 'candy',
    ...savedPrefs,
  },

  async boot() {
    const user = await api.current();
    if (user?.theme) get().applyTheme(user.theme);
    set({ user, booted: true });
  },
  async refresh() {
    const user = await api.current();
    set({ user });
  },
  setUser(user) { set({ user }); },

  setLocale(locale) {
    set({ locale });
    get().savePrefs({ locale });
  },
  setPref(key, value) {
    const prefs = { ...get().prefs, [key]: value };
    set({ prefs });
    get().savePrefs(prefs);
    if (key === 'theme') get().applyTheme(value);
  },
  savePrefs(patch) {
    const cur = storage.get('aet_prefs', {});
    storage.set('aet_prefs', { ...cur, ...patch, locale: patch.locale || get().locale });
  },
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme || 'candy');
  },
}));

// Translation hook bound to current locale
export function useT() {
  const locale = useApp((s) => s.locale);
  return (key, params) => translate(locale, key, params);
}
export function useLocale() {
  return useApp((s) => s.locale);
}
