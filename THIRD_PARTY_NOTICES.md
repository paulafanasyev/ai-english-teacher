# Third-party notices and licensing boundaries

Copyright and permission statements in `LICENSE` apply only to original materials owned by Pavel Afanasev. They do not relicense, replace, or cancel the licenses of third-party code, fonts, images, datasets, model weights, voice recordings, SDKs, or native libraries.

## Required release checks

Before publishing or distributing a build, verify and retain:
- dependency and transitive-dependency license reports from the exact lockfile used for that build;
- upstream license and NOTICE files required by included packages;
- separate terms for downloadable or bundled AI models, voice models/recordings, and datasets;
- notices for fonts, icons, sample media, and other bundled assets;
- Android/iOS SDK and native-library notices, where applicable.

## Repository-specific notes

- **Я-Зарядка AI**: review the exact MediaPipe/runtime packages, bundled Piper/Pico voice assets, ONNX/runtime components, and any model files downloaded on first run. A package's software license does not automatically grant rights to a separately published model or voice.
- **Mobile Agent / OX**: review the pinned pnpm dependency graph and each native module, including the separately built sing-box/libbox component. The app's former package metadata declared MIT; the repository-level proprietary notice does not change the licenses of dependencies or permissions already granted for historical revisions.
- **AI English Teacher**: review the exact npm lockfile, WebLLM/model assets, teacher/avatar art, audio, video, and fonts. Model and media terms may differ from the code package license.

## AI English Teacher — natural voices (Piper), added 2026-10-15

Runtime code (bundled into the web build or loaded by it):
- `@mintplex-labs/piper-tts-web` 1.0.5 — MIT (fork of `@diffusionstudio/vits-web`).
- `onnxruntime-web` 1.18.0 — MIT. Its WebAssembly files are fetched at runtime from `cdnjs.cloudflare.com`.
- Piper phonemizer WebAssembly (`@diffusionstudio/piper-wasm`, built from **espeak-ng — GPL-3.0**). It is **not** part of our bundle: the browser downloads it at runtime from `cdn.jsdelivr.net` when a natural voice is used. **Open legal question:** whether loading a GPL-3.0 component at runtime is compatible with the proprietary `LICENSE` of this app. Get a written opinion before a commercial release; the fallback is to switch natural voices off (Settings → «Естественные голоса», or remove `piperVoice.js`), which leaves browser/system TTS only.

Voice models (downloaded on first use from `huggingface.co/diffusionstudio/piper-voices`, mirror of `rhasspy/piper-voices`; licenses per MODEL_CARD):

| Voice | Teacher | License |
|---|---|---|
| `en_US-kristin-medium` | Светлана (EN) | Public domain (LibriVox) |
| `en_GB-cori-medium` | Ольга (EN) | Public domain (LibriVox) |
| `en_US-joe-medium` | Дмитрий (EN) | CC0 |
| `en_GB-northern_english_male-medium` | Алексей (EN) | CC BY-SA 4.0 — attribution shown in Settings; share-alike applies to modified models |
| `ru_RU-dmitri-medium` | Дмитрий (RU) | CC0 |
| `ru_RU-denis-medium` | Алексей (RU) | CC0 |

Deliberately **not** used: `hfc_female`, `hfc_male`, `ryan`, `ruslan` (CC BY-NC-SA, non-commercial), `irina` and `amy` (license unknown/unresolved). There is no cleanly licensed female Russian Piper voice, so Светлана and Ольга speak Russian with the browser/system voice.

## Audit status

This document defines the boundary and release checklist; it is **not** a claim that every transitive dependency and every media/model asset has already been individually cleared. A release must not be marked license-audited until an SBOM/license report for its exact commit and asset inventory has been reviewed and retained.

## Historical reference audit (2026-10-10)

- `main` contains the current proprietary `LICENSE`.
- The non-main branches `feat/microphone-reliability`, `feat/pixar-teachers`, `feat/voice-mic-redesign`, and `release/v2-local-ai` were checked and had no `LICENSE`.
- The historical tag `v1.0` was checked and had no `LICENSE`.
- These refs were not rewritten. A new license on `main` does not amend old commits/tags or retroactively revoke permissions already granted under an earlier license.
