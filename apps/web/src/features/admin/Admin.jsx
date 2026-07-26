import { useEffect, useRef, useState } from 'react';
import { useT } from '../../core/store.js';
import { api } from '../../core/api.js';
import { Modal, Toggle, Stat, ProgressBar } from '../../ui/kit.jsx';
import { sfx } from '../../audio/sfx.js';

export default function Admin() {
  const t = useT();
  const [tab, setTab] = useState('users');
  const tabs = [['users', '👥'], ['analytics', '📊'], ['settings', '🎛️'], ['materials', '📄']];
  return (
    <div>
      <h1 className="h1 mb-4">🛠️ {t('admin.title')}</h1>
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(([id, icon]) => (
          <button key={id} onClick={() => { sfx.click(); setTab(id); }}
            className={`btn !py-2 ${tab === id ? 'btn-primary' : 'btn-ghost'}`}>{icon} {t('admin.' + id)}</button>
        ))}
      </div>
      {tab === 'users' && <Users />}
      {tab === 'analytics' && <Analytics />}
      {tab === 'settings' && <FeatureSettings />}
      {tab === 'materials' && <Materials />}
    </div>
  );
}

/* ---------------- users ---------------- */
function Users() {
  const t = useT();
  const [q, setQ] = useState('');
  const [users, setUsers] = useState([]);
  const [toDelete, setToDelete] = useState(null);
  const load = (query = q) => api.listUsers(query).then(setUsers).catch(() => {});
  useEffect(() => { load(''); }, []);

  const patch = async (id, p) => { sfx.click(); await api.patchUser(id, p); load(); };
  const del = async () => { sfx.wrong(); await api.deleteUser(toDelete.id); setToDelete(null); load(); };

  return (
    <div>
      <input className="input mb-4" placeholder={t('admin.search')} value={q}
        onChange={(e) => { setQ(e.target.value); load(e.target.value); }} />
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-black/5">
              {['user', 'level', 'xp', 'acc', 'status', 'actions'].map((c) => <th key={c} className="label !text-[10px] p-3">{t('admin.col.' + c)}</th>)}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-black/5 last:border-0">
                <td className="p-3">
                  <div className="font-black">{u.name} {u.role === 'ADMIN' && '🛡️'}</div>
                  <div className="text-xs text-ink/45 font-semibold">{u.email}</div>
                </td>
                <td className="p-3 font-bold">{u.level}</td>
                <td className="p-3 font-bold">⭐ {u.xp}</td>
                <td className="p-3 w-28">
                  <div className="font-bold text-xs mb-1">{Math.round((u.accuracy || 0) * 100)}% · {u.attempts}</div>
                  <ProgressBar value={u.accuracy || 0} className="!h-1.5" />
                </td>
                <td className="p-3">
                  <span className={`chip text-xs ${u.blocked ? '!bg-rose-100 text-rose-600' : '!bg-emerald-100 text-emerald-700'}`}>
                    {u.blocked ? t('admin.status.blocked') : t('admin.status.ok')}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex gap-1.5 flex-wrap">
                    <button className="btn-ghost !px-2.5 !py-1 text-xs" onClick={() => patch(u.id, { blocked: !u.blocked })}>
                      {u.blocked ? '🔓 ' + t('admin.unblock') : '🔒 ' + t('admin.block')}
                    </button>
                    <button className="btn-ghost !px-2.5 !py-1 text-xs" onClick={() => patch(u.id, { role: u.role === 'ADMIN' ? 'STUDENT' : 'ADMIN' })}>
                      {u.role === 'ADMIN' ? '🎒' : '🛡️'}
                    </button>
                    <button className="btn-ghost !px-2.5 !py-1 text-xs !text-rose-500" onClick={() => setToDelete(u)}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={!!toDelete} onClose={() => setToDelete(null)}>
        <div className="font-black text-lg mb-3">🗑 {toDelete?.name}</div>
        <p className="font-semibold text-ink/60 mb-5">{t('admin.confirmDelete')}</p>
        <div className="flex gap-2">
          <button className="btn bg-rose-500 text-white flex-1" onClick={del}>{t('admin.delete')}</button>
          <button className="btn-ghost flex-1" onClick={() => setToDelete(null)}>{t('common.cancel')}</button>
        </div>
      </Modal>
    </div>
  );
}

/* ---------------- analytics ---------------- */
function Analytics() {
  const t = useT();
  const [a, setA] = useState(null);
  useEffect(() => { api.analytics().then(setA).catch(() => {}); }, []);
  if (!a) return <div className="font-bold text-ink/40">{t('common.loading')}</div>;
  const maxDay = Math.max(1, ...a.byDay.map((d) => d.n));
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon="👥" label={t('admin.total')} value={a.students} />
        <Stat icon="🟢" label={t('admin.active7')} value={a.active7} />
        <Stat icon="📝" label={t('admin.attempts')} value={a.attempts} />
        <Stat icon="🎯" label={t('admin.avgAcc')} value={Math.round(a.avgAccuracy * 100) + '%'} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="label mb-3">{t('progress.byType')}</div>
          <div className="space-y-3">
            {Object.entries(a.byType).map(([type, v]) => (
              <div key={type}>
                <div className="flex justify-between text-sm font-bold mb-1"><span>{type}</span><span>{Math.round((v.correct / v.total) * 100)}% · {v.total}</span></div>
                <ProgressBar value={v.correct / v.total} className="!h-2.5" />
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <div className="label mb-3">{t('progress.byDay')}</div>
          <div className="flex items-end gap-1 h-36">
            {a.byDay.map((d) => (
              <div key={d.day} className="flex-1" title={`${d.day}: ${d.n}`}>
                <div className="w-full rounded-t-md" style={{ height: `${(d.n / maxDay) * 130}px`, minHeight: 3, background: 'linear-gradient(180deg, rgb(var(--c-primary2)), rgb(var(--c-primary)))' }} />
              </div>
            ))}
          </div>
          <div className="label !text-[10px] mt-3 mb-1">TOP</div>
          <div className="flex flex-wrap gap-1.5">
            {a.topTopics.map(([topic, n]) => <span key={topic} className="chip text-xs">{topic} · {n}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- feature switches ---------------- */
function FeatureSettings() {
  const t = useT();
  const [s, setS] = useState(null);
  useEffect(() => { api.getSettings().then(setS).catch(() => {}); }, []);
  if (!s) return null;
  const KEYS = [['avatarGenerationEnabled', 'admin.toggle.avatars', '🧑‍🎨'], ['gamesEnabled', 'admin.toggle.games', '🎮'],
    ['listeningEnabled', 'admin.toggle.listening', '🎧'], ['registrationOpen', 'admin.toggle.registration', '🚪']];
  const flip = async (k, v) => { sfx.click(); setS({ ...s, [k]: v }); await api.putSetting(k, v); };
  return (
    <div className="card p-6 max-w-lg">
      <div className="label mb-4">{t('admin.toggle.title')}</div>
      <div className="space-y-4">
        {KEYS.map(([k, label, icon]) => (
          <div key={k} className="flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <Toggle checked={s[k] !== false} onChange={(v) => flip(k, v)} label={t(label)} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- materials ---------------- */
function Materials() {
  const t = useT();
  const [list, setList] = useState([]);
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [lastGen, setLastGen] = useState(null);
  const fileRef = useRef(null);
  const load = () => api.listMaterials().then(setList).catch(() => {});
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!text.trim()) return;
    sfx.click();
    const mat = await api.addMaterial({ filename: name.trim() || 'material.txt', text });
    setLastGen({ words: mat.tasks?.topWords?.length ?? mat.words ?? 0, gaps: mat.tasks?.gaps?.length ?? mat.gaps ?? 0 });
    setText(''); setName('');
    sfx.levelUp();
    load();
  };
  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setName(f.name);
    const r = new FileReader();
    r.onload = () => setText(String(r.result || '').slice(0, 100000));
    r.readAsText(f);
  };
  const del = async (id) => { sfx.wrong(); await api.deleteMaterial(id); load(); };

  return (
    <div className="grid md:grid-cols-2 gap-5 items-start">
      <div className="card p-5">
        <div className="font-black mb-1">📄 {t('admin.materials.title')}</div>
        <p className="text-sm font-semibold text-ink/55 mb-4">{t('admin.materials.desc')}</p>
        <input className="input mb-2" placeholder={t('admin.materials.nameHint')} value={name} onChange={(e) => setName(e.target.value)} />
        <textarea className="input min-h-[140px] mb-2" placeholder={t('admin.materials.paste')} value={text} onChange={(e) => setText(e.target.value)} />
        <div className="flex gap-2">
          <button className="btn-ghost flex-1" onClick={() => fileRef.current?.click()}>📎 {t('admin.materials.upload')}</button>
          <input ref={fileRef} type="file" accept=".txt" className="hidden" onChange={onFile} />
          <button className="btn-primary flex-1" disabled={!text.trim()} onClick={add}>⚡ {t('admin.materials.add')}</button>
        </div>
        {lastGen && <div className="chip mt-3 !bg-emerald-100 text-emerald-700 text-xs">✅ {t('admin.materials.generated', lastGen)}</div>}
        <p className="text-xs font-semibold text-ink/40 mt-3">💡 {t('admin.materials.use')}</p>
      </div>
      <div className="space-y-2">
        {!list.length && <div className="card p-5 text-center font-bold text-ink/40">{t('admin.materials.empty')}</div>}
        {list.map((m) => (
          <div key={m.id} className="card p-4 flex items-center gap-3">
            <span className="text-2xl">📄</span>
            <div className="min-w-0 flex-1">
              <div className="font-black truncate">{m.filename}</div>
              <div className="text-xs font-semibold text-ink/45">{m.words ?? 0} 🔤 · {m.gaps ?? 0} ✍️ · {m.reorders ?? 0} 🔀</div>
            </div>
            <button className="text-rose-400 text-lg" onClick={() => del(m.id)}>🗑</button>
          </div>
        ))}
      </div>
    </div>
  );
}
