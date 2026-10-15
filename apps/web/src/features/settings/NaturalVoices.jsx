import { useEffect, useState } from 'react';
import { Toggle } from '../../ui/kit.jsx';
import { tts } from '../../audio/tts.js';
import {
  piperSupported, piperEnabled, setPiperEnabled, voiceIdFor, isStored, downloadState, downloadError,
  downloadVoice, removeVoices, onPiperChange, hasAnyStored, VOICE_CREDITS,
} from '../../audio/piperVoice.js';

const TXT = {
  ru: {
    desc: 'Нейросетевые голоса Piper звучат живее и работают прямо на устройстве. Каждый голос скачивается один раз (около 63 МБ). Пока голос не скачан, говорит обычный голос браузера. Автоматически голос качается только по Wi‑Fi.',
    on: 'Естественные голоса',
    ready: 'Скачан',
    get: 'Скачать (63 МБ)',
    loading: 'Загрузка',
    retry: 'Не скачалось, ещё раз',
    nocache: 'Этот браузер не может сохранить голос, используется обычный.',
    browserVoice: 'голос браузера',
    remove: 'Удалить все скачанные голоса',
    confirm: 'Удалить скачанные голоса всех учителей? Их можно будет скачать снова.',
    unsupported: 'Этот браузер не поддерживает естественные голоса, используется обычный.',
    en: 'английский', ru: 'русский',
  },
  en: {
    desc: 'Piper neural voices sound more natural and run right on your device. Each voice downloads once (about 63 MB). Until then the regular browser voice speaks. Automatic downloads happen on Wi‑Fi only.',
    on: 'Natural voices',
    ready: 'Downloaded',
    get: 'Download (63 MB)',
    loading: 'Downloading',
    retry: 'Failed, try again',
    nocache: 'This browser cannot store the voice; the regular voice is used.',
    browserVoice: 'browser voice',
    remove: 'Delete all downloaded voices',
    confirm: 'Delete downloaded voices of all teachers? You can download them again.',
    unsupported: 'This browser does not support natural voices; the regular voice is used.',
    en: 'English', ru: 'Russian',
  },
};

const mb = (bytes) => Math.round((bytes || 0) / 1048576);

export default function NaturalVoices({ teacher, locale }) {
  const t = TXT[locale] || TXT.en;
  const [, setTick] = useState(0);
  useEffect(() => onPiperChange(() => setTick((n) => n + 1)), []);

  if (!piperSupported()) {
    return <div className="text-sm font-semibold text-ink/60">🎙 {t.unsupported}</div>;
  }
  const enabled = piperEnabled();
  const rows = ['en', 'ru'].map((lang) => ({ lang, id: voiceIdFor(teacher, lang) }));
  const clear = async () => {
    if (typeof window !== 'undefined' && window.confirm && !window.confirm(t.confirm)) return;
    tts.stop();
    await removeVoices();
  };

  return (
    <div className="space-y-2">
      <Toggle checked={enabled} onChange={(v) => setPiperEnabled(v)} label={'🎙 ' + t.on} />
      <p className="text-xs font-semibold text-ink/60">{t.desc}</p>
      {enabled && rows.map(({ lang, id }) => {
        const state = id ? downloadState(id) : null;
        const error = id ? downloadError(id) : null;
        const progress = state ? (state.total ? `${Math.round((state.loaded * 100) / state.total)}%` : `${mb(state.loaded)} ${locale === 'ru' ? 'МБ' : 'MB'}`) : '';
        return (
          <div key={lang} className="flex items-center gap-2 text-sm">
            <span className="flex-1 font-semibold">{teacher.name} · {t[lang]}</span>
            {!id
              ? <span className="text-xs font-bold text-ink/50">{t.browserVoice}</span>
              : isStored(id)
                ? <span className="text-xs font-bold text-emerald-600">✅ {t.ready}</span>
                : state
                  ? <span className="text-xs font-bold text-ink/60">⏳ {t.loading} {progress}</span>
                  : error === 'nocache'
                    ? <span className="text-xs font-bold text-amber-600">{t.nocache}</span>
                    : <button className="btn-ghost !py-1.5 text-xs" onClick={() => downloadVoice(id)}>⬇️ {error ? t.retry : t.get}</button>}
          </div>
        );
      })}
      {enabled && hasAnyStored() && (
        <button className="btn-ghost !py-1.5 text-xs" onClick={clear}>🗑 {t.remove}</button>
      )}
      {enabled && (
        <p className="text-[11px] font-semibold text-ink/40">Piper TTS · {rows.filter((r) => r.id).map((r) => VOICE_CREDITS[r.id]).join(' · ')}</p>
      )}
    </div>
  );
}
