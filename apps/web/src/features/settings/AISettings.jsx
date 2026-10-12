import { useEffect, useState } from 'react';
import { useLocale } from '../../core/store.js';
import { useAI } from '../../ai/useAI.js';
import { AI_MODELS } from '../../ai/models.js';
import { aiEngine } from '../../ai/engine.js';
import { ProgressBar, Select } from '../../ui/kit.jsx';

// The local model is an optional extra. Lessons, checking, voice and the
// microphone all work in basic mode without downloading anything.
// «Светлана онлайн» appears only when the shared Svetlana server answers.
const COPY = {
  en: { title: 'Smart AI teacher', optional: 'Optional', intro: 'Everything already works without this: lessons, answer checking, voice and microphone. The local model only makes free conversations smarter.', support: 'WebGPU support', supported: 'Available', unsupported: 'Not available, basic mode works', model: 'Model', enable: 'Download and enable', enableCloud: 'Enable', loading: 'Downloading…', connecting: 'Connecting…', ready: 'Ready', idle: 'Basic mode (no download)', error: 'Model error', warning: 'The download starts only after you press the button and is cached for offline use.', cloudWarning: 'Svetlana online needs the internet: your message goes to the Svetlana server only to get the answer and is not stored.', cache: 'Delete model cache', test: 'Test prompt', testPlaceholder: 'Say hello to the local teacher…', run: 'Run test', working: 'Thinking…', deleted: 'Model cache deleted.', close: 'Disable AI', cacheFailed: 'Could not delete model cache.', noDownload: 'no download', memory: 'Runtime memory' },
  ru: { title: 'Умный AI-учитель', optional: 'Необязательно', intro: 'Всё уже работает без этого: уроки, проверка ответов, голос и микрофон. Локальная модель лишь делает свободные диалоги умнее.', support: 'Поддержка WebGPU', supported: 'Доступно', unsupported: 'Недоступно, базовый режим работает', model: 'Модель', enable: 'Скачать и включить', enableCloud: 'Включить', loading: 'Загрузка…', connecting: 'Подключаюсь…', ready: 'Готово', idle: 'Базовый режим (без загрузки)', error: 'Ошибка модели', warning: 'Загрузка начнётся только после нажатия кнопки, затем модель работает офлайн.', cloudWarning: 'Светлане онлайн нужен интернет: сообщение уходит на сервер Светланы только для ответа и там не сохраняется.', cache: 'Удалить кэш модели', test: 'Тестовый запрос', testPlaceholder: 'Поздоровайся с локальным учителем…', run: 'Проверить', working: 'Думаю…', deleted: 'Кэш модели удалён.', close: 'Отключить AI', cacheFailed: 'Не удалось удалить кэш модели.', noDownload: 'без загрузки', memory: 'Память при работе' },
};

export default function AISettings() {
  const locale = useLocale();
  const c = COPY[locale] || COPY.en;
  const ai = useAI();
  const [modelId, setModelId] = useState(ai.model?.id);
  const [test, setTest] = useState('');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => { aiEngine.checkCloud(); }, []);
  const models = AI_MODELS.filter((model) => !model.cloud || ai.cloudAvailable || model.id === modelId);
  const selected = AI_MODELS.find((model) => model.id === modelId) || AI_MODELS[0];
  const cloud = !!selected.cloud;

  const chooseModel = (id) => { setModelId(id); ai.selectModel(id); setNotice(''); };
  const enable = async () => {
    setNotice('');
    try { await ai.enable(modelId); } catch (error) { setNotice(error?.message || c.unsupported); }
  };
  const runTest = async () => {
    if (!test.trim()) return;
    setBusy(true); setAnswer('');
    const result = await ai.runTask('tutor_reply', { text: test }, { locale, level: 'A2', teacher: { name: 'your local teacher', tagline: 'kind and supportive' } });
    setAnswer(result.data?.text || '');
    setBusy(false);
  };
  const removeCache = async () => {
    setNotice('');
    const removed = await ai.clearCache();
    setNotice(removed ? c.deleted : c.cacheFailed);
  };
  const loadingText = cloud ? c.connecting : c.loading;
  const statusText = ai.status === 'ready' ? c.ready : ai.status === 'downloading' ? loadingText : ai.status === 'error' ? c.error : c.idle;

  return (
    <details className="card p-5 group" open={ai.ready || ai.status === 'downloading'}>
      <summary className="cursor-pointer list-none flex items-start justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <div>
          <div className="label">✨ {c.title}</div>
          <p className="text-sm font-semibold text-ink/60 mt-1">{c.intro}</p>
        </div>
        <span className="chip shrink-0 bg-sky-100 text-sky-700">{ai.ready ? '✅ ' + c.ready : c.optional} <span className="inline-block transition-transform group-open:rotate-180">▾</span></span>
      </summary>
      <div className="space-y-4 mt-4">
        <p className="text-xs font-semibold text-ink/50">{cloud ? c.cloudWarning : c.warning}</p>
        {!cloud && (
          <div className="flex items-center justify-between text-sm font-bold">
            <span>{c.support}</span><span className={ai.supported ? 'text-emerald-600' : 'text-amber-600'}>{ai.supported ? c.supported : c.unsupported}</span>
          </div>
        )}
        <div>
          <div className="label mb-2">{c.model}</div>
          <Select value={modelId} onChange={chooseModel} options={models.map((model) => ({ value: model.id, label: model.cloud ? model.label : `${model.label} · ~${model.approxDownloadMB} MB` }))} />
          <p className="text-xs font-semibold text-ink/50 mt-2">{selected.description}{cloud ? ` · ${c.noDownload}` : ` ${c.memory} ≈ ${selected.vramMB} MB`} · {selected.languages.join('/')}</p>
        </div>
        {ai.status === 'downloading' && !cloud && <div className="space-y-1"><ProgressBar value={ai.progress} /><div className="text-xs font-bold text-ink/55">{Math.round(ai.progress * 100)}% · {ai.progressText}</div></div>}
        <div className="flex flex-wrap gap-2">
          {ai.ready ? <button className="btn-ghost !py-2 text-sm" onClick={ai.disable}>{c.close}</button> : <button className="btn-primary !py-2 text-sm" onClick={enable} disabled={(!cloud && !ai.supported) || ai.status === 'downloading'}>{ai.status === 'downloading' ? loadingText : cloud ? c.enableCloud : c.enable}</button>}
          {!cloud && <button className="btn-ghost !py-2 text-sm" onClick={removeCache}>🗑 {c.cache}</button>}
        </div>
        <div className="text-xs font-bold text-ink/50">{statusText}{ai.error ? `: ${ai.error}` : ''}</div>
        {notice && <div className="rounded-2xl bg-emerald-50 text-emerald-700 px-3 py-2 text-sm font-bold">{notice}</div>}
        <div className="border-t border-black/5 pt-4 space-y-2">
          <div className="label">🧪 {c.test}</div>
          <div className="flex gap-2"><input className="input flex-1 min-w-0" value={test} onChange={(event) => setTest(event.target.value)} placeholder={c.testPlaceholder} onKeyDown={(event) => event.key === 'Enter' && runTest()} /><button className="btn-primary !py-2" onClick={runTest} disabled={busy || !test.trim()}>{busy ? c.working : c.run}</button></div>
          {answer && <div className="rounded-2xl bg-surface border border-black/5 p-3 font-semibold">{answer}</div>}
        </div>
      </div>
    </details>
  );
}
