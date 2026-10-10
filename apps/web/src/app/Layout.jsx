import { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp, useT } from '../core/store.js';
import { LOCALES } from '../i18n/index.js';
import { api } from '../core/api.js';
import { teacherById } from '../data/teachers.js';
import Avatar from '../avatar/Avatar.jsx';
import { audioCtx } from '../audio/engine.js';
import { sfx } from '../audio/sfx.js';
import { Coin, Xp } from '../ui/kit.jsx';

const NAV = [
  { to: '/', icon: '🏠', key: 'nav.home' },
  { to: '/lesson', icon: '📖', key: 'nav.lesson' },
  { to: '/talk', icon: '💬', key: 'nav.talk' },
  { to: '/games', icon: '🎮', key: 'nav.games' },
  { to: '/shop', icon: '🛍️', key: 'nav.shop' },
  { to: '/progress', icon: '📈', key: 'nav.progress' },
  { to: '/exams', icon: '📝', key: 'nav.exams' },
  { to: '/courses', icon: '📚', key: 'nav.courses' },
  { to: '/diary', icon: '📔', key: 'nav.diary' },
];

export default function Layout({ children }) {
  const { user, prefs, setPref, setUser, locale, setLocale } = useApp();
  const t = useT();
  const nav = useNavigate();
  const teacher = teacherById(user.teacherId);
  const isStaff = user.role === 'TEACHER' || user.role === 'PARENT';
  const Lang = () => (
    <div className="flex gap-1 bg-soft rounded-full p-1">
      {LOCALES.map((l) => (
        <button key={l.id} onClick={() => { sfx.click(); setLocale(l.id); }} title={l.label}
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
  const items = user.role === 'ADMIN' ? [...NAV, { to: '/admin', icon: '🛠️', key: 'nav.admin' }]
    : user.role === 'TEACHER' ? [{ to: '/teacher', icon: '🧑‍🏫', key: 'nav.cabinet' }]
    : user.role === 'PARENT' ? [{ to: '/child', icon: '👪', key: 'nav.child' }]
    : NAV;

  const linkCls = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-2xl font-extrabold transition ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'hover:bg-soft text-ink/70'}`;

  return (
    <div className="h-full md:grid md:grid-cols-[250px_1fr]">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex flex-col gap-1 p-4 border-r border-black/5 bg-surface/60 backdrop-blur">
        <div className="flex items-center gap-2 px-2 py-3">
          <img src="./pavel-afanasev-logo.svg" alt="Pavel Afanasev" className="h-9 w-auto rounded-md bg-white" />
          <span className="font-black text-lg leading-tight">AI English<br />Teacher</span>
        </div>
        {items.map((n) => (
          <NavLink key={n.to} to={n.to} className={linkCls} onClick={() => sfx.click()}>
            <span className="text-xl">{n.icon}</span>{t(n.key)}
          </NavLink>
        ))}
        <NavLink to="/settings" className={linkCls} onClick={() => sfx.click()}>
          <span className="text-xl">⚙️</span>{t('nav.settings')}
        </NavLink>
        <div className="mt-auto space-y-3 pt-4">
          <div className="flex justify-center"><Lang /></div>
          <button className="btn-ghost w-full !py-2 text-sm" onClick={() => setPref('musicOn', !prefs.musicOn)}>
            {prefs.musicOn ? '🎵 ' + t('settings.music') + ': ON' : '🔇 ' + t('settings.music') + ': OFF'}
          </button>
          <div className="card p-3 flex items-center gap-3">
            {isStaff
              ? <div className="w-11 h-11 shrink-0 rounded-xl grid place-items-center text-2xl bg-soft">{user.role === 'TEACHER' ? '🧑‍🏫' : '👪'}</div>
              : <Avatar teacher={teacher} className="w-11 shrink-0" rounded="rounded-xl" />}
            <div className="min-w-0 flex-1">
              <div className="font-black truncate">{user.name}</div>
              <div className="text-xs font-bold text-ink/50">{isStaff ? t(user.role === 'TEACHER' ? 'cab.title' : 'par.title') : `${user.level} · ⭐ ${user.xp}`}</div>
            </div>
            <button title={t('nav.logout')} onClick={logout} className="text-xl hover:scale-110 transition">🚪</button>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="h-full flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="md:hidden flex items-center gap-2 px-4 py-3 bg-surface/80 backdrop-blur border-b border-black/5 sticky top-0 z-40">
          <img src="./pavel-afanasev-logo.svg" alt="Pavel Afanasev" className="h-7 w-auto rounded bg-white" />
          <span className="font-black">AI English Teacher</span>
          <div className="ml-auto flex items-center gap-2">
            <Lang /><Xp n={user.xp} /><Coin n={user.coins} />
            <button onClick={() => setPref('musicOn', !prefs.musicOn)} className="text-xl">{prefs.musicOn ? '🎵' : '🔇'}</button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-5 md:py-8 pb-24 md:pb-8">
          <div className="max-w-5xl mx-auto">{children}</div>
          <footer className="mx-auto mt-10 flex max-w-5xl flex-wrap items-center gap-3 border-t border-black/10 pt-4 text-xs text-ink/60">
            <img src="./pavel-afanasev-logo.svg" alt="Pavel Afanasev" className="h-8 w-auto rounded bg-white" />
            <span>© 2026 Pavel Afanasev</span>
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
              <span className="text-2xl">{n.icon}</span>{t(n.key)}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
