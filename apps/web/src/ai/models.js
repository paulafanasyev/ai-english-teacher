/**
 * WebLLM prebuilt models. IDs and runtime-memory figures mirror
 * mlc-ai/web-llm/src/config.ts (main). Download figures are conservative
 * planning estimates; the model manifest, browser cache, and WASM library
 * determine the exact transfer size.
 *
 * The last entry is not a local model: «Светлана онлайн» is the shared
 * Svetlana server (one AI for all sites, «Репетитор» profile). It needs no
 * download and no WebGPU, and is shown only when that server answers.
 */
export const CLOUD_MODEL_ID = 'svetlana-cloud';

// Сервер единой Светланы: по умолчанию мир-самозанятых.рф (punycode); можно переопределить при сборке.
const DEFAULT_SVETLANA_URL = 'https://xn----8sba1acxdkgqms3b9euc.xn--p1ai';
const envUrl = (() => { try { return import.meta.env?.VITE_SVETLANA_URL || ''; } catch { return ''; } })();
export const SVETLANA_URL = String(envUrl || DEFAULT_SVETLANA_URL).replace(/\/+$/, '');
export const SVETLANA_CHAT_URL = `${SVETLANA_URL}/api/v1/assistant/public/repetitor/chat`;

export const AI_MODELS = [
  {
    id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
    label: 'Qwen 0.5B · recommended',
    approxDownloadMB: 650,
    vramMB: 944.62,
    languages: ['en', 'ru'],
    recommended: true,
    description: 'Small, quick local tutor for everyday practice.',
  },
  {
    id: 'SmolLM2-360M-Instruct-q4f16_1-MLC',
    label: 'SmolLM2 360M · lite',
    approxDownloadMB: 300,
    vramMB: 376.06,
    languages: ['en'],
    recommended: false,
    description: 'Smallest option for lower-memory devices; English focused.',
  },
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    label: 'Qwen 1.5B · quality',
    approxDownloadMB: 1100,
    vramMB: 1629.75,
    languages: ['en', 'ru'],
    recommended: false,
    description: 'More capable corrections and writing feedback.',
  },
  {
    id: CLOUD_MODEL_ID,
    label: 'Светлана онлайн · без загрузки',
    approxDownloadMB: 0,
    vramMB: 0,
    languages: ['en', 'ru'],
    recommended: false,
    cloud: true,
    description: 'Works on any device over the internet: your message is sent to the Svetlana server only to get the answer and is not stored.',
  },
];

export const DEFAULT_MODEL_ID = AI_MODELS.find((model) => model.recommended)?.id || AI_MODELS[0].id;
export const getModel = (id) => AI_MODELS.find((model) => model.id === id) || AI_MODELS[0];
export const isCloudModel = (id) => id === CLOUD_MODEL_ID;
