/**
 * WebLLM prebuilt models. IDs and runtime-memory figures mirror
 * mlc-ai/web-llm/src/config.ts (main). Download figures are conservative
 * planning estimates; the model manifest, browser cache, and WASM library
 * determine the exact transfer size.
 */
export const AI_MODELS = [
  {
    id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
    label: 'Qwen 0.5B · recommended',
    approxDownloadMB: 650,
    vramMB: 944.62,
    languages: ['en', 'ru', 'vi'],
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
    languages: ['en', 'ru', 'vi'],
    recommended: false,
    description: 'More capable corrections and writing feedback.',
  },
];

export const DEFAULT_MODEL_ID = AI_MODELS.find((model) => model.recommended)?.id || AI_MODELS[0].id;
export const getModel = (id) => AI_MODELS.find((model) => model.id === id) || AI_MODELS[0];
