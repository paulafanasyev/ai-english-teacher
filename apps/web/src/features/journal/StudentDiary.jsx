import { useEffect, useState } from 'react';
import { useApp, useT } from '../../core/store.js';
import { api } from '../../core/api.js';
import { Stat } from '../../ui/kit.jsx';

const KIND_ICON = { lesson: '📘', quiz: '📝', homework: '🏠', note: '📌' };
const MARK_CLS = (m) => (m >= 5 ? '!bg-emerald-100 text-emerald-700' : m === 4 ? '!bg-sky-100 text-sky-700' : m === 3 ? '!bg-amber-100 text-amber-700' : '!bg-rose-100 text-rose-600');
function ago(at, t) { const d = Math.floor((Date.now() - at) / 86400000); return d <= 0 ? t('cab.today') : d + ' ' + t('cab.daysAgo'); }

// Student cabinet: the learner's own electronic diary (marks + teacher comments) + progress.
export default function StudentDiary() {
  const { user } = useApp();
  const t = useT();
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.listJournal({ studentId: user.id }).then(setEntries).catch(() => {});
    api.getStats().then(setStats).catch(() => {});
  }, [user.id]);

  return (
    <div>
      <h1 className="h1 mb-1">📔 {t('sd.title')}</h1>
      <p className="font-semibold text-ink/55 mb-5">{t('sd.sub')}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat icon="🎓" label={t('par.level')} value={user.level} />
        <Stat icon="⭐" label={t('par.xp')} value={user.xp} />
        <Stat icon="🎯" label={t('par.accuracy')} value={stats ? Math.round(stats.accuracy * 100) + '%' : '—'} />
        <Stat icon="🔥" label={t('par.streak')} value={(stats?.streak ?? 0)} />
      </div>

      <div className="label mb-2">📔 {t('par.diary')}</div>
      <div className="space-y-2">
        {stats && entries.length === 0 && <div className="card p-5 text-center font-bold text-ink/40">{t('par.noDiary')}</div>}
        {entries.map((e) => (
          <div key={e.id} className="card p-3 flex items-center gap-3">
            <span className="text-2xl">{KIND_ICON[e.kind]}</span>
            <div className="min-w-0 flex-1">
              <div className="font-black truncate">{t('kind.' + e.kind)}{e.topic ? ' · ' + t('common.topic.' + e.topic) : ''}</div>
              {e.comment && <div className="text-xs font-semibold text-ink/55">“{e.comment}”</div>}
              <div className="text-[11px] font-bold text-ink/40">{ago(e.at, t)}{e.teacherName ? ' · ' + t('par.by') + ': ' + e.teacherName : ''}</div>
            </div>
            {e.mark != null && <span className={`chip ${MARK_CLS(e.mark)} font-black`}>{e.mark}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
