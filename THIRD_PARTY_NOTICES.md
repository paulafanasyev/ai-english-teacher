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

## Audit status

This document defines the boundary and release checklist; it is **not** a claim that every transitive dependency and every media/model asset has already been individually cleared. A release must not be marked license-audited until an SBOM/license report for its exact commit and asset inventory has been reviewed and retained.
