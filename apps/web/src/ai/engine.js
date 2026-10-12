import { AI_MODELS, DEFAULT_MODEL_ID, getModel, isCloudModel, SVETLANA_CHAT_URL } from './models.js';

const STORAGE_KEY = 'aet_ai';
const WEBLLM_URL = 'https://esm.run/@mlc-ai/web-llm@0.2.85';
// «Светлана онлайн»: вместо локальной модели запросы идут на сервер единой Светланы.
const CLOUD = Object.freeze({ cloud: true });
const listeners = new Set();
const jobs = [];
let webllm = null;
let engine = null;
let loadPromise = null;
let supportPromise = null;
let cloudPromise = null;
let running = false;

const readSettings = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
};
const initialSettings = readSettings();
const hasNavigator = typeof navigator !== 'undefined';
const initialModelId = AI_MODELS.some((m) => m.id === initialSettings.modelId) ? initialSettings.modelId : DEFAULT_MODEL_ID;
const state = {
  status: (hasNavigator && navigator.gpu) || isCloudModel(initialModelId) ? 'idle' : 'unsupported',
  supported: false,
  cloudAvailable: false,
  progress: 0,
  progressText: '',
  error: '',
  modelId: initialModelId,
  enabled: initialSettings.enabled === true,
};

function persist(patch) {
  Object.assign(state, patch);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ modelId: state.modelId, enabled: state.enabled })); } catch { /* storage is optional */ }
  listeners.forEach((listener) => listener({ ...state }));
}
function notify() { listeners.forEach((listener) => listener({ ...state })); }
const busyStatus = () => state.status === 'ready' || state.status === 'downloading';
const idleStatus = (modelId = state.modelId) => (state.supported || isCloudModel(modelId) ? 'idle' : 'unsupported');

export async function detectWebGPU() {
  if (!hasNavigator || !navigator.gpu || typeof navigator.gpu.requestAdapter !== 'function') {
    persist({ supported: false, status: busyStatus() ? state.status : idleStatus() });
    return false;
  }
  try {
    const adapter = await navigator.gpu.requestAdapter();
    const supported = !!adapter;
    persist({ supported, status: busyStatus() ? state.status : (supported || isCloudModel(state.modelId) ? 'idle' : 'unsupported') });
    return supported;
  } catch {
    persist({ supported: false, status: busyStatus() ? state.status : idleStatus() });
    return false;
  }
}

/** Отвечает ли сервер Светланы для Репетитора (без отправки данных ученика). */
export function checkCloud(force = false) {
  if (cloudPromise && !force) return cloudPromise;
  cloudPromise = (async () => {
    if (typeof fetch !== 'function') return false;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 6000) : null;
    try {
      const res = await fetch(SVETLANA_CHAT_URL, { method: 'GET', credentials: 'omit', cache: 'no-store', signal: controller?.signal });
      const data = res.ok ? await res.json().catch(() => ({})) : {};
      const ok = data?.configured === true;
      persist({ cloudAvailable: ok });
      return ok;
    } catch {
      persist({ cloudAvailable: false });
      return false;
    } finally {
      if (timer) clearTimeout(timer);
    }
  })();
  return cloudPromise;
}

// If the learner already opted in earlier, the weights are in the browser cache:
// warm the model back up on boot so AI mode survives a page reload.
if (isCloudModel(initialModelId)) {
  if (initialSettings.enabled) setTimeout(() => { aiEngine.load(initialModelId).catch(() => {}); }, 0);
  if (hasNavigator && navigator.gpu) supportPromise = detectWebGPU();
} else if (hasNavigator && navigator.gpu) {
  supportPromise = detectWebGPU().then((ok) => {
    if (ok && initialSettings.enabled) setTimeout(() => { aiEngine.load(state.modelId).catch(() => {}); }, 0);
    return ok;
  });
}

export const aiEngine = {
  get state() { return { ...state }; },
  get supported() { return state.supported; },
  get ready() { return state.status === 'ready' && !!engine; },
  get selectedModel() { return getModel(state.modelId); },
  subscribe(listener) {
    listeners.add(listener);
    listener({ ...state });
    return () => listeners.delete(listener);
  },
  async checkSupport() { return supportPromise || detectWebGPU(); },
  checkCloud,
  selectModel(modelId) {
    const model = getModel(modelId);
    if (!model) return state.modelId;
    if (engine && state.modelId !== model.id) engine = null;
    persist({ modelId: model.id, enabled: false, status: idleStatus(model.id), error: '' });
    return model.id;
  },
  async load(modelId = state.modelId) {
    const model = getModel(modelId);
    if (model.cloud) return loadCloud(model.id);
    const supported = await this.checkSupport();
    if (!supported) throw new Error('WebGPU is not available in this browser.');
    if (state.status === 'ready' && engine && state.modelId === model.id) return engine;
    // A model can be changed while a previous download is in flight. Wait for
    // that load instead of returning its engine under the newly selected id.
    if (loadPromise) {
      await loadPromise.catch(() => {});
      if (state.status === 'ready' && engine && state.modelId === model.id) return engine;
    }
    const requestedModelId = model.id;
    persist({ modelId: requestedModelId, status: 'downloading', progress: 0, progressText: 'Preparing local model…', error: '' });
    loadPromise = (async () => {
      try {
        // Deliberately dynamic: the app has no npm dependency and does not fetch until the user asks.
        webllm = webllm || await import(/* @vite-ignore */ 'https://esm.run/@mlc-ai/web-llm@0.2.85');
        const create = webllm.CreateMLCEngine || webllm.default?.CreateMLCEngine;
        if (typeof create !== 'function') throw new Error('WebLLM CreateMLCEngine is unavailable.');
        const loadedEngine = await create(requestedModelId, {
          initProgressCallback: (report) => {
            const progress = Number(report?.progress);
            persist({
              status: 'downloading',
              progress: Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : state.progress,
              progressText: report?.text || 'Downloading local model…',
            });
          },
        });
        // The selection may have changed while WebLLM was downloading. Do not
        // expose the old engine as the newly selected model.
        if (state.modelId !== requestedModelId) {
          try { await loadedEngine?.unload?.(); } catch { /* optional WebLLM API */ }
          return null;
        }
        engine = loadedEngine;
        persist({ enabled: true, status: 'ready', progress: 1, progressText: 'Ready — model cached in this browser.', error: '' });
        return engine;
      } catch (error) {
        engine = null;
        persist({ status: 'error', enabled: false, error: error?.message || String(error), progressText: '' });
        throw error;
      } finally {
        loadPromise = null;
      }
    })();
    return loadPromise;
  },
  async enable(modelId = state.modelId) { return this.load(modelId); },
  disable() {
    if (engine === CLOUD) engine = null;
    persist({ enabled: false, status: idleStatus(), error: '' });
  },
  async clearCache() {
    try {
      if (!webllm) webllm = await import(/* @vite-ignore */ 'https://esm.run/@mlc-ai/web-llm@0.2.85');
      const clear = webllm.deleteModelAllInfoInCache || webllm.default?.deleteModelAllInfoInCache;
      if (typeof clear === 'function') await clear();
      else if (typeof caches !== 'undefined') {
        const keys = await caches.keys();
        await Promise.all(keys.filter((key) => /mlc|webllm/i.test(key)).map((key) => caches.delete(key)));
      }
      engine = null;
      persist({ enabled: false, status: idleStatus(), progress: 0, progressText: '', error: '' });
      return true;
    } catch (error) {
      persist({ error: error?.message || String(error) });
      return false;
    }
  },
  abortAll() {
    jobs.forEach((job) => job.controller?.abort());
  },
  chat(messages, options = {}) {
    const controller = options.signal ? null : new AbortController();
    const signal = options.signal || controller.signal;
    return new Promise((resolve, reject) => {
      jobs.push({ messages, options, signal, controller, resolve, reject });
      pump();
    });
  },
};

async function loadCloud(modelId) {
  if (state.status === 'ready' && engine === CLOUD && state.modelId === modelId) return engine;
  persist({ modelId, status: 'downloading', progress: 0, progressText: 'Connecting to Svetlana…', error: '' });
  const ok = await checkCloud(true);
  if (state.modelId !== modelId) return null;
  if (!ok) {
    engine = null;
    const message = 'Svetlana server is not available right now. Basic mode keeps working.';
    persist({ status: 'error', enabled: false, error: message, progressText: '' });
    throw new Error(message);
  }
  engine = CLOUD;
  persist({ enabled: true, status: 'ready', progress: 1, progressText: 'Ready — Svetlana online.', error: '' });
  return engine;
}

/** Запрос к единой Светлане. Системный промпт задаёт сервер (профиль «Репетитор»), а не браузер. */
async function cloudChat(messages, opts, signal) {
  const turns = (messages || []).filter((m) => m && m.role !== 'system' && m.content);
  const last = turns[turns.length - 1];
  let message = String(last?.content || '').slice(0, 7800);
  if (!message.trim()) throw new Error('Empty request');
  if (opts.json) message += '\n\nReturn JSON only, no markdown.';
  const history = turns.slice(0, -1).slice(-6)
    .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content).slice(0, 2000) }))
    .filter((m) => m.content.trim());
  const res = await fetch(SVETLANA_CHAT_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message, history }),
    credentials: 'omit',
    signal,
  });
  if (!res.ok) throw new Error(`Svetlana server error ${res.status}`);
  const data = await res.json();
  if (typeof data?.content !== 'string' || !data.content.trim()) throw new Error('Empty answer');
  return data.content.trim();
}

async function pump() {
  if (running || !jobs.length) return;
  running = true;
  const job = jobs.shift();
  try {
    if (job.signal?.aborted) throw new DOMException('Request aborted', 'AbortError');
    if (!engine || state.status !== 'ready') throw new Error('The local AI model is not loaded.');
    const opts = job.options || {};
    if (engine === CLOUD) {
      const text = await cloudChat(job.messages, opts, job.signal);
      opts.onToken?.(text);
      job.resolve(text);
      return;
    }
    const request = {
      messages: job.messages,
      stream: true,
      temperature: opts.temperature ?? 0.5,
      max_tokens: opts.max_tokens ?? 160,
    };
    if (opts.json) request.response_format = { type: 'json_object' };
    const response = await engine.chat.completions.create(request);
    let text = '';
    for await (const chunk of response) {
      if (job.signal?.aborted) throw new DOMException('Request aborted', 'AbortError');
      const token = chunk?.choices?.[0]?.delta?.content || '';
      if (token) { text += token; opts.onToken?.(token); }
    }
    job.resolve(text.trim());
  } catch (error) {
    job.reject(error);
  } finally {
    const i = jobs.indexOf(job);
    if (i >= 0) jobs.splice(i, 1);
    running = false;
    pump();
  }
}

export { STORAGE_KEY, WEBLLM_URL, notify };
