import { useEffect, useState } from 'react';
import { useApp, useT } from '../../core/store.js';
import { api } from '../../core/api.js';
import { storage } from '../../core/storage.js';
import { quest } from '../../data/index.js';
import { ProgressBar, Stat } from '../../ui/kit.jsx';

const TYPE_META = { vocab: ['🃏', 'task.vocab.q'], match: ['🔗', 'task.match.q'], gap: ['✍️', 'task.gap.q'], grammar: ['📐', 'task.choose.q'], listening: ['🎧', 'task.listening.q'], writing: ['⌨️', 'task.writing.q'], speaking: ['🎤', 'task.speaking.q'] };

export default function Progress() {
  const { user } = useApp();
  const t = useT();
  const [stats, setStats] = useState(null);
  useEffect(() => { api.getStats().then(setStats).catch(() => {}); }, []);

  const lvlNum = 1 + Math.floor(user.xp / 250);
  const inLevel = user.xp % 250;
  const questDone = storage.get(`aet_quest_${user.id}`, []).length >= quest.chapters.length;

  const badges = stats ? [
    { id: 'first', icon: '👣', ok: stats.total >= 1 },
    { id: 'words50', icon: '📚', ok: (stats.byType?.vocab?.total || 0) + (stats.byType?.gap?.total || 0) >= 50 },
    { id: 'streak3', icon: '🔥', ok: stats.streak >= 3 },
    { id: 'games10', icon: '🎮', ok: (stats.byType?.match?.total || 0) + (stats.byType?.grammar?.total || 0) >= 10 },
    { id: 'quest', icon: '🗺️', ok: questDone },
    { id: 'talk', icon: '💬', ok: (stats.byType?.speaking?.total || 0) >= 10 },
  ] : [];

  const maxDay = Math.max(1, ...(stats?.byDay?.map((d) => d.n) || [1]));

  return (
    <div className="space-y-6">
      <h1 className="h1">📈 {t('progress.title')}</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon="🎯" label={t('home.level')} value={user.level} sub={'LVL ' + lvlNum} />
        <Stat icon="⭐" label={t('home.xp')} value={user.xp} />
        <Stat icon="🔥" label={t('home.streak')} value={(stats?.streak ?? 0) + 'd'} />
        <Stat icon="✅" label={t('home.accuracy')} value={stats ? Math.round(stats.accuracy * 100) + '%' : '—'} />
      </div>

      <div className="card p-5">
        <div className="flex justify-between font-black mb-2"><span>LVL {lvlNum}</span><span className="text-ink/40">LVL {lvlNum + 1}</span></div>
        <ProgressBar value={inLevel / 250} />
        <div className="text-sm font-semibold text-ink/50 mt-1.5">{t('progress.level.next', { xp: 250 - inLevel })}</div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="label mb-3">{t('progress.byType')}</div>
          <div className="space-y-3">
            {stats && Object.entries(stats.byType).map(([type, v]) => (
              <div key={type}>
                <div className="flex justify-between text-sm font-bold mb-1">
                  <span>{TYPE_META[type]?.[0]} {type}</span>
                  <span>{Math.round((v.correct / v.total) * 100)}% · {v.total}</span>
                </div>
                <ProgressBar value={v.correct / v.total} className="!h-2.5" />
              </div>
            ))}
            {stats && !Object.keys(stats.byType).length && <div className="text-ink/40 font-bold text-sm">—</div>}
          </div>
        </div>

        <div className="card p-5">
          <div className="label mb-3">{t('progress.byDay')}</div>
          <div className="flex items-end gap-1 h-36">
            {stats?.byDay?.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1" title={`${d.day}: ${d.n}`}>
                <div className="w-full rounded-t-md transition-all" style={{ height: `${(d.n / maxDay) * 100}%`, minHeight: d.n ? 6 : 2, background: d.n ? 'linear-gradient(180deg, rgb(var(--c-primary2)), rgb(var(--c-primary)))' : 'rgb(var(--c-ink) / 0.08)' }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] font-bold text-ink/40 mt-1">
            <span>{stats?.byDay?.[0]?.day}</span><span>{stats?.byDay?.at(-1)?.day}</span>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="label mb-3">🏅 {t('progress.badges')}</div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {badges.map((b) => (
            <div key={b.id} className={`text-center p-3 rounded-2xl ${b.ok ? 'bg-soft' : 'opacity-35 grayscale'}`}>
              <div className="text-3xl">{b.icon}</div>
              <div className="text-[11px] font-bold leading-tight mt-1">{t('badge.' + b.id)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
