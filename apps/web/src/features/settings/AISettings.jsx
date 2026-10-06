import { useState } from 'react';
import { useLocale } from '../../core/store.js';
import { useAI } from '../../ai/useAI.js';
import { AI_MODELS } from '../../ai/models.js';
import { ProgressBar, Select } from '../../ui/kit.jsx';

const COPY = {
  en: { title: 'Local AI teacher', support: 'WebGPU support', supported: 'Available', unsupported: 'Not available — basic mode still works', model: 'Model', enable: 'Download and enable', loading: 'Downloading…', ready: 'Ready', idle: 'Not loaded', error: 'Model error', warning: 'The first download is large and happens only after you press the button. The model is cached for offline use after download.', cache: 'Delete model cache', test: 'Test prompt', testPlaceholder: 'Say hello to the local teacher…', run: 'Run test', working: 'Thinking…', basic: 'Basic mode', local: 'Local model', deleted: 'Model cache deleted.', close: 'Disable AI', cacheFailed: 'Could not delete model cache.' },
  ru: { title: 'Локальный AI-учитель', support: 'Поддержка WebGPU', supported: 'Доступно', unsupported: 'Недоступно — базовый режим продолжит работать', model: 'Модель', enable: 'Скачать и включить', loading: 'Загрузка…', ready: 'Готово', idle: 'Не загружена', error: 'Ошибка модели', warning: 'Первая загрузка большая и начинается только после нажатия кнопки. После загрузки модель хранится в кэше и работает офлайн.', cache: 'Удалить кэш модели', test: 'Тестовый запрос', testPlaceholder: 'Поздоровайся с локальным учителем…', run: 'Проверить', working: 'Думаю…', basic: 'Базовый режим', local: 'Локальная модель', deleted: 'Кэш модели удалён.', close: 'Отключить AI', cacheFailed: 'Не удалось удалить кэш модели.' },
  vi: { title: 'Giáo viên AI cục bộ', support: 'Hỗ trợ WebGPU', supported: 'Có thể dùng', unsupported: 'Không khả dụng — chế độ cơ bản vẫn hoạt động', model: 'Mô hình', enable: 'Tải xuống và bật', loading: 'Đang tải…', ready: 'Sẵn sàng', idle: 'Chưa tải', error: 'Lỗi mô hình', warning: 'Lần tải đầu khá lớn và chỉ bắt đầu sau khi bạn bấm nút. Sau khi tải, mô hình được lưu để dùng ngoại tuyến.', cache: 'Xóa bộ nhớ đệm mô hình', test: 'Thử yêu cầu', testPlaceholder: 'Chào giáo viên cục bộ…', run: 'Chạy thử', working: 'Đang suy nghĩ…', basic: 'Chế độ cơ bản', local: 'Mô hình cục bộ', deleted: 'Đã xóa bộ nhớ đệm.', close: 'Tắt AI', cacheFailed: 'Không thể xóa bộ nhớ đệm mô hình.' },
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
  const selected = AI_MODELS.find((model) => model.id === modelId) || AI_MODELS[0];

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
  const statusText = ai.status === 'ready' ? c.ready : ai.status === 'downloading' ? c.loading : ai.status === 'error' ? c.error : c.idle;

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div><div className="label">✨ {c.title}</div><p className="text-sm font-semibold text-ink/60 mt-1">{c.warning}</p></div>
        <span className={`chip shrink-0 ${ai.supported ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{ai.supported ? 'GPU' : '⚠️'}</span>
      </div>
      <div className="flex items-center justify-between text-sm font-bold">
        <span>{c.support}</span><span className={ai.supported ? 'text-emerald-600' : 'text-amber-600'}>{ai.supported ? c.supported : c.unsupported}</span>
      </div>
      <div>
        <div className="label mb-2">{c.model}</div>
        <Select value={modelId} onChange={chooseModel} options={AI_MODELS.map((model) => ({ value: model.id, label: `${model.label} · ~${model.approxDownloadMB} MB` }))} />
        <p className="text-xs font-semibold text-ink/50 mt-2">{selected.description} Runtime memory ≈ {selected.vramMB} MB · {selected.languages.join('/')}</p>
      </div>
      {ai.status === 'downloading' && <div className="space-y-1"><ProgressBar value={ai.progress} /><div className="text-xs font-bold text-ink/55">{Math.round(ai.progress * 100)}% · {ai.progressText}</div></div>}
      <div className="flex flex-wrap gap-2">
        {ai.ready ? <button className="btn-ghost !py-2 text-sm" onClick={ai.disable}>{c.close}</button> : <button className="btn-primary !py-2 text-sm" onClick={enable} disabled={!ai.supported || ai.status === 'downloading'}>{ai.status === 'downloading' ? c.loading : c.enable}</button>}
        <button className="btn-ghost !py-2 text-sm" onClick={removeCache}>🗑 {c.cache}</button>
      </div>
      <div className="text-xs font-bold text-ink/50">{statusText}{ai.error ? `: ${ai.error}` : ''}</div>
      {notice && <div className="rounded-2xl bg-emerald-50 text-emerald-700 px-3 py-2 text-sm font-bold">{notice}</div>}
      <div className="border-t border-black/5 pt-4 space-y-2">
        <div className="label">🧪 {c.test}</div>
        <div className="flex gap-2"><input className="input flex-1" value={test} onChange={(event) => setTest(event.target.value)} placeholder={c.testPlaceholder} onKeyDown={(event) => event.key === 'Enter' && runTest()} /><button className="btn-primary !py-2" onClick={runTest} disabled={busy || !test.trim()}>{busy ? c.working : c.run}</button></div>
        {answer && <div className="rounded-2xl bg-surface border border-black/5 p-3 font-semibold">{answer}</div>}
      </div>
    </div>
  );
}
