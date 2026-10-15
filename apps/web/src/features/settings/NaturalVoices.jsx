import { useEffect, useState } from 'react';
import { Toggle } from '../../ui/kit.jsx';
import {
  piperSupported, piperEnabled, setPiperEnabled, voiceIdFor, isStored, downloadState,
  downloadVoice, removeVoices, refreshStored, onPiperChange,
} from '../../audio/piperVoice.js';

const TXT = {
  ru: {
    desc: 'Нейросетевые голоса Piper работают прямо на устройстве. Голос скачивается один раз (около 60 МБ), пока он загружается, говорит обычный голос браузера.',
    on: 'Естественные голоса',
    ready: 'Голос загружен',
    get: 'Скачать голос',
    loading: 'Загрузка',
    remove: 'Удалить скачанные голоса',
    unsupported: 'Этот браузер не поддерживает естественные голоса, используется обычный.',
    en: 'английский', ru: 'русский',
  },
  en: {
    desc: 'Piper neural voices run right on your device. Each voice downloads once (about 60 MB); until then the regular browser voice speaks.',
    on: 'Natural voices',
    ready: 'Voice downloaded',
    get: 'Download voice',
    loading: 'Downloading',
    remove: 'Delete downloaded voices',
    unsupported: 'This browser does not support natural voices; the regular voice is used.',
    en: 'English', ru: 'Russian',
  },
};

export default function NaturalVoices({ teacher, locale }) {
  const t = TXT[locale] || TXT.en;
  const [, setTick] = useState(0);
  useEffect(() => {
    const off = onPiperChange(() => setTick((n) => n + 1));
    if (piperSupported()) refreshStored();
    return () => { off(); };
  }, []);

  if (!piperSupported()) {
    return <div className="text-sm font-semibold text-ink/60">🎙 {t.unsupported}</div>;
  }
  const enabled = piperEnabled();
  const ids = [...new Set(['en', 'ru'].map((lang) => voiceIdFor(teacher, lang)))];
  const label = (id) => (id.startsWith('ru') ? t.ru : t.en);

  return (
    <div className="space-y-2">
      <Toggle checked={enabled} onChange={(v) => setPiperEnabled(v)} label={'🎙 ' + t.on} />
      <p className="text-xs font-semibold text-ink/60">{t.desc}</p>
      {enabled && ids.map((id) => {
        const state = downloadState(id);
        const pct = state && state.total ? Math.round((state.loaded * 100) / state.total) : 0;
        return (
          <div key={id} className="flex items-center gap-2 text-sm">
            <span className="flex-1 font-semibold">{teacher.name} · {label(id)}</span>
            {isStored(id)
              ? <span className="text-xs font-bold text-emerald-600">✅ {t.ready}</span>
              : state
                ? <span className="text-xs font-bold text-ink/60">⏳ {t.loading} {pct}%</span>
                : <button className="btn-ghost !py-1.5 text-xs" onClick={() => downloadVoice(id)}>⬇️ {t.get}</button>}
          </div>
        );
      })}
      {enabled && ids.some((id) => isStored(id)) && (
        <button className="btn-ghost !py-1.5 text-xs" onClick={() => removeVoices()}>🗑 {t.remove}</button>
      )}
    </div>
  );
}
