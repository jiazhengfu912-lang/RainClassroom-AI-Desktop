# Sources and third-party notices

The desktop implementation is independently authored. Reference repositories were inspected for protocol behaviour; their source files are not copied into this repository.

- Existing local ClassroomCheckin: session handling, identity checks, write-ahead records and unknown-result behaviour.
- [casua132/yuketang_auto-answer](https://github.com/casua132/yuketang_auto-answer/tree/bd7b9729ad55cd245bb3a169957a9f0eccf78cd8): candidate live-classroom, presentation and answer API paths, WebSocket message names.
- [chlchi/RainClassroomAssitant-standalone](https://github.com/chlchi/RainClassroomAssitant-standalone/tree/532d70d741930e169005e48cb2df630270a4b320): architectural reference for image capture and compatible-model integration. Its inferred type mapping is not reused.
- Official RainClassroom web bundle observed 2026-09-16: version `1.2.305`, `pc.f581ee9f.js`, classroom-report chunk `72933.76a2ebd3.js`. Confirms the fullscreen classroom route, on-lesson API and 1/2/4 question type mapping. Public bundle inspection does not verify authenticated live compatibility. Bundles are excluded from source distribution.
- [Electron security](https://www.electronjs.org/docs/latest/tutorial/security), [WebContentsView](https://www.electronjs.org/docs/latest/api/web-contents-view), [safeStorage](https://www.electronjs.org/docs/latest/api/safe-storage), [Debugger](https://www.electronjs.org/docs/latest/api/debugger), [Playwright Electron](https://playwright.dev/docs/api/class-electron).

Dependency licenses remain applicable: Electron (MIT, Chromium and bundled third-party notices), React/React DOM (MIT), ws (MIT), lossless-json (MIT), Vite/Vitest (MIT), esbuild (MIT), electron-builder (MIT), TypeScript (Apache-2.0), Playwright (Apache-2.0). Exact versions are pinned by `package-lock.json`. The installer includes Electron's license and Chromium notices. No project-level license is granted by this notice.
