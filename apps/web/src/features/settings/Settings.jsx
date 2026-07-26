import { Link } from 'react-router-dom';
import { useApp, useT } from '../../core/store.js';
import { api } from '../../core/api.js';
import { LOCALES } from '../../i18n/index.js';
import { teacherById } from '../../data/teachers.js';
import { music } from '../../audio/music.js';
import Avatar from '../../avatar/Avatar.jsx';
import { Toggle, Select } from '../../ui/kit.jsx';
import { sfx } from '../../audio/sfx.js';

export default function Settings() {
  const { user, prefs, setPref, locale, setLocale } = useApp();
  const t = useT();
  const teacher = teacherById(user.teacherId);

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <h1 className="h1">⚙️ {t('settings.title')}</h1>

      <div className="card p-5">
        <div className="label mb-3">🌍 {t('settings.language')}</div>
        <div className="grid grid-cols-3 gap-2">
          {LOCALES.map((l) => (
            <button key={l.id} onClick={() => { sfx.click(); setLocale(l.id); }}
              className={`btn !py-2.5 ${locale === l.id ? 'btn-primary' : 'btn-ghost'}`}>{l.flag} {l.label}</button>
          ))}
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <div className="label">🔊 {t('settings.sound')}</div>
        <Toggle checked={prefs.musicOn} onChange={(v) => setPref('musicOn', v)} label={'🎵 ' + t('settings.music')} />
        {prefs.musicOn && (
          <>
            <Select value={prefs.musicStyle} onChange={(v) => setPref('musicStyle', v)}
              options={music.styles.map((s) => ({ value: s, label: t('music.' + s) }))} />
            <div>
              <div className="label mb-1">{t('settings.volume')}</div>
              <input type="range" min="0" max="1" step="0.05" value={prefs.musicVol}
                onChange={(e) => setPref('musicVol', Number(e.target.value))} className="w-full accent-[rgb(var(--c-primary))]" />
            </div>
          </>
        )}
        <Toggle checked={prefs.sfxOn} onChange={(v) => setPref('sfxOn', v)} label={'✨ ' + t('settings.sfx')} />
        <Toggle checked={prefs.voiceOn} onChange={(v) => setPref('voiceOn', v)} label={'🗣 ' + t('settings.voice')} />
      </div>

      <div className="card p-5 flex items-center gap-4">
        <div className="w-16 shrink-0"><Avatar teacher={teacher} rounded="rounded-2xl" frame={user.frame} /></div>
        <div className="flex-1">
          <div className="label">{t('settings.teacher')}</div>
          <div className="font-black">{teacher.emoji} {teacher.name}</div>
        </div>
        <Link to="/teacher" className="btn-ghost !py-2 text-sm">🔄 {t('home.changeTeacher')}</Link>
      </div>

      {api.demo && (
        <div className="card p-5 border-2 !border-amber-200 bg-amber-50/50">
          <div className="font-black mb-1">🧪 {t('settings.demo.title')}</div>
          <p className="text-sm font-semibold text-ink/60">{t('settings.demo.desc')}</p>
          <button className="btn-ghost !py-2 text-xs mt-3" onClick={async () => { await api.resetDemo(); location.reload(); }}>♻️ Reset demo data</button>
        </div>
      )}
    </div>
  );
}
