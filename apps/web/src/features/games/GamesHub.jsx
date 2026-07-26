import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../../core/store.js';
import { api } from '../../core/api.js';
import { sfx } from '../../audio/sfx.js';

const GAMES = [
  { id: 'wordbattle', icon: '⚔️', grad: 'from-violet-500 to-fuchsia-500' },
  { id: 'shooter', icon: '🎯', grad: 'from-rose-500 to-orange-500' },
  { id: 'quest', icon: '🗺️', grad: 'from-emerald-500 to-teal-500' },
  { id: 'memory', icon: '🧠', grad: 'from-sky-500 to-indigo-500' },
];

export default function GamesHub() {
  const t = useT();
  const [enabled, setEnabled] = useState(true);
  useEffect(() => { api.getSettings().then((s) => setEnabled(s.gamesEnabled !== false)).catch(() => {}); }, []);

  return (
    <div>
      <h1 className="h1 mb-1">🎮 {t('games.title')}</h1>
      <p className="font-semibold text-ink/60 mb-6">{t('games.subtitle')}</p>
      {!enabled ? (
        <div className="card p-6 text-center font-bold text-ink/50">🚧 …</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {GAMES.map((g) => (
            <Link key={g.id} to={'/games/' + g.id} onClick={() => sfx.click()}
              className={`rounded-3xl p-6 text-white bg-gradient-to-br ${g.grad} shadow-xl hover:-translate-y-1 transition block`}>
              <div className="text-5xl">{g.icon}</div>
              <div className="mt-2 text-xl font-black">{t(`games.${g.id}.name`)}</div>
              <div className="text-sm font-semibold text-white/85 mt-1">{t(`games.${g.id}.desc`)}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
