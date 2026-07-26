import { useEffect, useState } from 'react';
import { useT } from '../../core/store.js';
import { api } from '../../core/api.js';
import { Stat } from '../../ui/kit.jsx';
import { sfx } from '../../audio/sfx.js';

const KIND_ICON = { lesson: '📘', quiz: '📝', homework: '🏠', note: '📌' };
const MARK_CLS = (m) => (m >= 5 ? '!bg-emerald-100 text-emerald-700' : m === 4 ? '!bg-sky-100 text-sky-700' : m === 3 ? '!bg-amber-100 text-amber-700' : '!bg-rose-100 text-rose-600');

function ago(at, t) {
  const d = Math.floor((Date.now() - at) / 86400000);
  return d <= 0 ? t('cab.today') : d + ' ' + t('cab.daysAgo');
}

export default function ParentCabinet() {
  const t = useT();
  const [children, setChildren] = useState([]);
  const [childId, setChildId] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => { api.myChildren().then((c) => { setChildren(c); if (c[0]) setChildId(c[0].id); }).catch(() => {}); }, []);
  useEffect(() => { if (childId) api.childDiary(childId).then(setData).catch(() => {}); }, [childId]);

  const s = data?.summary;
  return (
    <div>
      <h1 className="h1 mb-1">👪 {t('par.title')}</h1>
      <p className="font-semibold text-ink/55 mb-5">{s?.name}</p>

      {children.length > 1 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {children.map((c) => (
            <button key={c.id} onClick={() => { sfx.click(); setChildId(c.id); }}
              className={`btn !py-2 ${c.id === childId ? 'btn-primary' : 'btn-ghost'}`}>{c.name}</button>
          ))}
        </div>
      )}

      {s && (
        <>
          <div className="label mb-2">{t('par.summary')}</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Stat icon="🎓" label={t('par.level')} value={s.level} />
            <Stat icon="⭐" label={t('par.xp')} value={s.xp} />
            <Stat icon="🎯" label={t('par.accuracy')} value={Math.round(s.accuracy * 100) + '%'} />
            <Stat icon="🔥" label={t('par.streak')} value={s.streak} />
          </div>
        </>
      )}

      <div className="label mb-2">📔 {t('par.diary')}</div>
      <div className="space-y-2">
        {data && !data.entries.length && <div className="card p-5 text-center font-bold text-ink/40">{t('par.noDiary')}</div>}
        {data?.entries.map((e) => (
          <div key={e.id} className="card p-3 flex items-center gap-3">
            <span className="text-2xl">{KIND_ICON[e.kind]}</span>
            <div className="min-w-0 flex-1">
              <div className="font-black truncate">
                {t('kind.' + e.kind)}{e.topic ? ' · ' + t('common.topic.' + e.topic) : ''}
              </div>
              {e.comment && <div className="text-xs font-semibold text-ink/55">“{e.comment}”</div>}
              <div className="text-[11px] font-bold text-ink/40">{ago(e.at, t)} · {t('par.by')}: {e.teacherName}</div>
            </div>
            {e.mark != null && <span className={`chip ${MARK_CLS(e.mark)} font-black`}>{e.mark}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
