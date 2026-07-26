import { useEffect, useState } from 'react';
import { useApp, useT, useLocale } from '../../core/store.js';
import { api } from '../../core/api.js';
import { TEACHERS } from '../../data/teachers.js';
import { pickL } from '../../i18n/index.js';
import Avatar from '../../avatar/Avatar.jsx';
import { sfx } from '../../audio/sfx.js';

const THEMES = [{ id: 'candy', price: 0, sw: ['#7c3aed', '#a855f7'] }, { id: 'ocean', price: 200, sw: ['#0284c7', '#06b6d4'] },
  { id: 'sunset', price: 200, sw: ['#e11d48', '#f97316'] }, { id: 'forest', price: 200, sw: ['#059669', '#84cc16'] },
  { id: 'galaxy', price: 250, sw: ['#111023', '#8b5cf6'] }];
const MUSIC = [{ id: 'lofi', price: 0, icon: '🎧' }, { id: 'classical', price: 150, icon: '🎻' }, { id: 'electronic', price: 150, icon: '🎛️' }, { id: 'ambient', price: 150, icon: '🌌' }];
const FRAMES = [{ id: 'none', price: 0, icon: '⬜' }, { id: 'gold', price: 100, icon: '🥇' }, { id: 'neon', price: 120, icon: '💠' }, { id: 'leaf', price: 100, icon: '🍃' }];
const TEACHER_PRICE = 300;

export default function Shop() {
  const { user, setUser, prefs, setPref } = useApp();
  const t = useT();
  const locale = useLocale();
  const [unlocks, setUnlocks] = useState([]);
  const [msg, setMsg] = useState(null);

  const load = () => api.getUnlocks().then(setUnlocks).catch(() => {});
  useEffect(() => { load(); }, []);

  const owned = (type, id, freeIds = []) =>
    freeIds.includes(id) || unlocks.some((u) => u.itemType === type && u.itemId === id);

  const buy = async (type, id, price) => {
    try {
      const u = await api.spend({ itemType: type, itemId: id, price });
      setUser(u); sfx.coin(); load();
    } catch {
      sfx.wrong(); setMsg(t('shop.notEnough'));
      setTimeout(() => setMsg(null), 2500);
    }
  };

  const useItem = async (type, id) => {
    sfx.click();
    if (type === 'theme') setPref('theme', id);
    if (type === 'musicStyle') setPref('musicStyle', id);
    if (type === 'teacher') setUser(await api.updateProfile({ teacherId: id }));
    if (type === 'frame') setUser(await api.updateProfile({ frame: id }));
    if (type === 'theme' || type === 'frame') { try { setUser(await api.updateProfile({ [type]: id })); } catch {} }
  };

  const ItemBtn = ({ type, id, price, active, freeIds = [] }) => {
    const has = owned(type, id, freeIds) || price === 0;
    if (active) return <span className="chip !bg-emerald-500 text-white text-xs">✓ {t('shop.active')}</span>;
    if (has) return <button className="btn-ghost !py-1.5 !px-3 text-xs" onClick={() => useItem(type, id)}>{t('shop.use')}</button>;
    return <button className="btn-primary !py-1.5 !px-3 text-xs" onClick={() => buy(type, id, price)}>🪙 {price}</button>;
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <h1 className="h1">🛍️ {t('shop.title')}</h1>
        <span className="chip !bg-amber-100 text-amber-800 text-lg ml-auto">🪙 {user.coins}</span>
      </div>
      <p className="font-semibold text-ink/60 mb-4">{t('shop.subtitle')}</p>
      {msg && <div className="card p-3 mb-4 font-bold text-rose-500 anim-shake">😿 {msg}</div>}

      <div className="label mb-2">🧑‍🏫 {t('shop.teachers')}</div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
        {TEACHERS.map((tc) => (
          <div key={tc.id} className="card p-2.5 text-center">
            <Avatar teacher={tc} className="w-full" rounded="rounded-xl" />
            <div className="font-black text-sm mt-1.5">{tc.name}</div>
            <div className="text-[11px] font-semibold text-ink/45 leading-tight mb-1.5 truncate">{pickL(tc.tagline, locale)}</div>
            <ItemBtn type="teacher" id={tc.id} price={TEACHER_PRICE} active={user.teacherId === tc.id}
              freeIds={unlocks.length === 0 && user.teacherId ? [user.teacherId] : [user.teacherId]} />
          </div>
        ))}
      </div>

      <div className="label mb-2">🎨 {t('shop.themes')}</div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        {THEMES.map((th) => (
          <div key={th.id} className="card p-3 text-center">
            <div className="h-12 rounded-xl mb-2" style={{ background: `linear-gradient(135deg, ${th.sw[0]}, ${th.sw[1]})` }} />
            <div className="font-black text-sm mb-1.5">{t('theme.' + th.id)}</div>
            <ItemBtn type="theme" id={th.id} price={th.price} active={prefs.theme === th.id} />
          </div>
        ))}
      </div>

      <div className="label mb-2">🎵 {t('shop.music')}</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {MUSIC.map((m) => (
          <div key={m.id} className="card p-3 text-center">
            <div className="text-3xl">{m.icon}</div>
            <div className="font-black text-sm my-1.5">{t('music.' + m.id)}</div>
            <ItemBtn type="musicStyle" id={m.id} price={m.price} active={prefs.musicStyle === m.id} />
          </div>
        ))}
      </div>

      <div className="label mb-2">🖼️ {t('shop.frames')}</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {FRAMES.map((f) => (
          <div key={f.id} className="card p-3 text-center">
            <div className="text-3xl">{f.icon}</div>
            <div className="font-black text-sm my-1.5">{t('frame.' + f.id)}</div>
            <ItemBtn type="frame" id={f.id} price={f.price} active={(user.frame || 'none') === f.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
