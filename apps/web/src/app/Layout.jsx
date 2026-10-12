import { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp, useT } from '../core/store.js';
import { LOCALES, pickL } from '../i18n/index.js';
import { api } from '../core/api.js';
import { teacherById } from '../data/teachers.js';
import Avatar from '../avatar/Avatar.jsx';
import { audioCtx } from '../audio/engine.js';
import { sfx } from '../audio/sfx.js';
import { Coin, Xp } from '../ui/kit.jsx';

const L_PROGRAMS = { ru: 'Темы ФОП', en: 'Curriculum topics' };
const L_CLASS = { ru: 'Мой класс', en: 'My class' };
const L_CLASSES = { ru: 'Классы и чат', en: 'Classes & chat' };
const L_PLANNER = { ru: 'План уроков', en: 'Lesson plan' };
const L_A11Y = { ru: 'Доступность', en: 'Accessibility' };
const L_READ = { ru: 'Прочитать выделенное', en: 'Read selection aloud' };

const NAV = [
  { to: '/', icon: '🏠', key: 'nav.home' },
  { to: '/lesson', icon: '📖', key: 'nav.lesson' },
  { to: '/math', icon: '🧮', key: 'nav.math', label: { ru: 'Математика', en: 'Math' } },
  { to: '/classroom', icon: '👥', key: 'nav.classroom', label: L_CLASS },
  { to: '/talk', icon: '💬', key: 'nav.talk' },
  { to: '/games', icon: '🎮', key: 'nav.games' },
  { to: '/shop', icon: '🛍️', key: 'nav.shop' },
  { to: '/progress', icon: '📈', key: 'nav.progress' },
  { to: '/exams', icon: '📝', key: 'nav.exams' },
  { to: '/courses', icon: '📚', key: 'nav.courses' },
  { to: '/diary', icon: '📔', key: 'nav.diary' },
  { to: '/programs', icon: '📋', key: 'nav.programs', label: L_PROGRAMS },
];

const A11Y_CSS = `
html.a11y { font-size: 125%; }
html.a11y *, html.a11y *::before, html.a11y *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
html.a11y :focus-visible { outline: 3px solid #1d4ed8 !important; outline-offset: 2px; }
html.a11y body { line-height: 1.6; letter-spacing: 0.01em; }
html.a11y .text-ink\\/40, html.a11y .text-ink\\/50, html.a11y .text-ink\\/55, html.a11y .text-ink\\/60 { color: rgba(17, 24, 39, 0.85) !important; }
`;

function useA11y(on) {
  useEffect(() => {
    if (!document.getElementById('a11y-css')) {
      const s = document.createElement('style');
      s.id = 'a11y-css';
      s.textContent = A11Y_CSS;
      document.head.appendChild(s);
    }
    document.documentElement.classList.toggle('a11y', !!on);
  }, [on]);
}

function readSelection() {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const text = String(window.getSelection?.() || '').trim();
    synth.cancel();
    if (!text) return;
    const u = new SpeechSynthesisUtterance(text.slice(0, 4000));
    u.lang = /[\u0400-\u04FF]/.test(text) ? 'ru-RU' : 'en-US';
    u.rate = 0.95;
    synth.speak(u);
  } catch {}
}

export default function Layout({ children }) {
  const { user, prefs, setPref, setUser, locale, setLocale } = useApp();
  const t = useT();
  const nav = useNavigate();
  const teacher = teacherById(user.teacherId);
  const isStaff = user.role === 'TEACHER' || user.role === 'PARENT';
  const label = (n) => (n.label ? pickL(n.label, locale) : t(n.key));
  useA11y(prefs.a11y);
  const Lang = () => (
    <div className="flex gap-1 bg-soft rounded-full p-1">
      {LOCALES.map((l) => (
        <button key={l.id} onClick={() => { sfx.click(); setLocale(l.id); }} title={l.label} aria-label={l.label} aria-pressed={locale === l.id}
          className={`rounded-full px-2 py-0.5 text-[11px] font-black transition ${locale === l.id ? 'bg-primary text-white' : 'text-ink/55'}`}>{l.id.toUpperCase()}</button>
      ))}
    </div>
  );

  // Resume audio context on the first user gesture (autoplay policies)
  useEffect(() => {
    const h = () => { try { if (prefs.musicOn || prefs.sfxOn) audioCtx(); } catch {} };
    document.addEventListener('pointerdown', h, { once: true });
    return () => document.removeEventListener('pointerdown', h);
  }, [prefs.musicOn, prefs.sfxOn]);

  const logout = async () => { await api.logout(); setUser(null); nav('/'); };
  const items = user.role === 'ADMIN' ? [...NAV, { to: '/planner', icon: '🗓️', key: 'nav.planner', label: L_PLANNER }, { to: '/admin', icon: '🛠️', key: 'nav.admin' }]
    : user.role === 'TEACHER' ? [
      { to: '/teacher', icon: '🧑‍🏫', key: 'nav.cabinet' },
      { to: '/classroom', icon: '👥', key: 'nav.classroom', label: L_CLASSES },
      { to: '/planner', icon: '🗓️', key: 'nav.planner', label: L_PLANNER },
      { to: '/programs', icon: '📋', key: 'nav.programs', label: L_PROGRAMS },
    ]
    : user.role === 'PARENT' ? [
      { to: '/child', icon: '👪', key: 'nav.child' },
      { to: '/programs', icon: '📋', key: 'nav.programs', label: L_PROGRAMS },
    ]
    : NAV;

  const linkCls = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-2xl font-extrabold transition ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'hover:bg-soft text-ink/70'}`;
  const a11yName = pickL(L_A11Y, locale);
  const readName = pickL(L_READ, locale);
  const musicName = `${t('settings.music')}: ${prefs.musicOn ? 'ON' : 'OFF'}`;
  const toggleA11y = () => setPref('a11y', !prefs.a11y);

  return (
    <div className="h-full md:grid md:grid-cols-[250px_1fr]">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex flex-col gap-1 p-4 border-r border-black/5 bg-surface/60 backdrop-blur overflow-y-auto">
        <div className="flex items-center gap-2 px-2 py-3">
          <img src="./pavel-afanasev-logo.svg" alt="Pavel Afanasev" className="h-9 w-auto rounded-md bg-white" />
          <span className="font-black text-lg leading-tight">{t('app.name')}</span>
        </div>
        {items.map((n) => (
          <NavLink key={n.to} to={n.to} className={linkCls} onClick={() => sfx.click()}>
            <span className="text-xl" aria-hidden="true">{n.icon}</span>{label(n)}
          </NavLink>
        ))}
        <NavLink to="/settings" className={linkCls} onClick={() => sfx.click()}>
          <span className="text-xl" aria-hidden="true">⚙️</span>{t('nav.settings')}
        </NavLink>
        <div className="mt-auto space-y-3 pt-4">
          <div className="flex justify-center"><Lang /></div>
          <button className="btn-ghost w-full !py-2 text-sm" aria-pressed={!!prefs.musicOn} onClick={() => setPref('musicOn', !prefs.musicOn)}>
            {prefs.musicOn ? '🎵 ' : '🔇 '}{musicName}
          </button>
          <button className="btn-ghost w-full !py-2 text-sm" aria-pressed={!!prefs.a11y} onClick={toggleA11y}>♿ {a11yName}: {prefs.a11y ? 'ON' : 'OFF'}</button>
          {prefs.a11y && (
            <button className="btn-ghost w-full !py-2 text-sm" onMouseDown={(e) => e.preventDefault()} onClick={readSelection}>🔊 {readName}</button>
          )}
          <div className="card p-3 flex items-center gap-3">
            {isStaff
              ? <div className="w-11 h-11 shrink-0 rounded-xl grid place-items-center text-2xl bg-soft">{user.role === 'TEACHER' ? '🧑‍🏫' : '👪'}</div>
              : <Avatar teacher={teacher} className="w-11 shrink-0" rounded="rounded-xl" />}
            <div className="min-w-0 flex-1">
              <div className="font-black truncate">{user.name}</div>
              <div className="text-xs font-bold text-ink/50">{isStaff ? t(user.role === 'TEACHER' ? 'cab.title' : 'par.title') : `${user.level} · ⭐ ${user.xp}`}</div>
            </div>
            <button title={t('nav.logout')} aria-label={t('nav.logout')} onClick={logout} className="text-xl hover:scale-110 transition">🚪</button>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="h-full flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="md:hidden flex items-center gap-2 px-4 py-3 bg-surface/80 backdrop-blur border-b border-black/5 sticky top-0 z-40">
          <img src="./pavel-afanasev-logo.svg" alt="Pavel Afanasev" className="h-7 w-auto rounded bg-white" />
          <span className="font-black truncate">{t('app.name')}</span>
          <div className="ml-auto flex items-center gap-2">
            <Lang /><Xp n={user.xp} /><Coin n={user.coins} />
            <button aria-label={a11yName} aria-pressed={!!prefs.a11y} title={a11yName} onClick={toggleA11y} className={`text-xl rounded-lg px-1 ${prefs.a11y ? 'bg-primary text-white' : ''}`}>♿</button>
            {prefs.a11y && <button aria-label={readName} title={readName} className="text-xl" onMouseDown={(e) => e.preventDefault()} onClick={readSelection}>🔊</button>}
            <button aria-label={musicName} aria-pressed={!!prefs.musicOn} title={musicName} onClick={() => setPref('musicOn', !prefs.musicOn)} className="text-xl">{prefs.musicOn ? '🎵' : '🔇'}</button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-5 md:py-8 pb-24 md:pb-8">
          <div className="max-w-5xl mx-auto">{children}</div>
          <footer className="mx-auto mt-10 flex max-w-5xl flex-wrap items-center gap-3 border-t border-black/10 pt-4 text-xs text-ink/60">
            <img src="./pavel-afanasev-logo.svg" alt="Pavel Afanasev" className="h-8 w-auto rounded bg-white" />
            <span>{t('app.credit')} · © 2026</span>
            <a href="mailto:Pavel.afanasyev@inbox.ru" className="underline">Email</a>
            <a href="https://wa.me/79148289964" target="_blank" rel="noreferrer" className="underline">WhatsApp</a>
            <a href="https://t.me/PaulPavel_it_dev" target="_blank" rel="noreferrer" className="underline">Telegram</a>
            <a href="https://github.com/paulafanasyev/ai-english-teacher/blob/main/LICENSE" className="underline" target="_blank" rel="noreferrer">License</a>
          </footer>
        </main>

        {/* Bottom nav (mobile) */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur border-t border-black/5 flex justify-around py-1.5">
          {[...items.slice(0, 4), { to: '/settings', icon: '⚙️', key: 'nav.settings' }].map((n) => (
            <NavLink key={n.to} to={n.to} onClick={() => sfx.click()}
              className={({ isActive }) => `flex flex-col items-center px-3 py-1 rounded-xl text-[11px] font-bold ${isActive ? 'text-primary' : 'text-ink/50'}`}>
              <span className="text-2xl" aria-hidden="true">{n.icon}</span>{label(n)}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
