# Validation / 验证记录

Date: 2026-09-16. Target: Windows 11 x64. Version: 0.1.0.

This document separates software checks from real platform acceptance. Test accounts, cookies, model keys, question images and logs are synthetic or local only and are not published.

## Local checks

| Check | Evidence | Result |
|---|---|---|
| TypeScript and production bundles | `npm run build` | PASS |
| Core and integration tests | `npm test`: 53 tests, 2 files | PASS |
| Electron desktop fixture | 16 scenarios, 4 synthetic submissions, 7 model calls | PASS |
| Dependency audit | `npm audit`: 0 reported vulnerabilities on 2026-09-16 | PASS |

The 16 desktop scenarios cover login, persistent login, logout, encrypted API key, randomized image probes, preview without submission, single choice, duplicate events, multiple choice, ordered multiple blanks with punctuation, authenticated screenshot fallback, long-question segmentation, minimized capture, WebSocket reconnection, uncertain receipt without retry, and stopped startup with the recovered ledger.

The core tests also cover malformed model output, exact 64-bit IDs, invalid option sets, deadline changes, model service errors, atomic-write failure, and pause/stop/question closure during asynchronous Cookie lookup immediately before network dispatch. A real local TCP reset test verifies that the POST transport does not silently retry an already received request.

Reports and screenshots are generated locally under ignored `test-results/`. Fixture results do not contain evidence of real classroom compatibility or model answer accuracy.

## Installer

The current-user NSIS installer was built and installed on Windows 11 x64 (OS build 26200); the installer returned exit code 0. No GitHub Release was created.

| Artifact | Value |
|---|---|
| Filename | `RainClassroom-AI-0.1.0-Setup.exe` |
| Size | 112,180,765 bytes |
| SHA-256 | `082C9007FB3689B15FF29B4DA837C3EA6124E4A0AFEAAE8B3BAF942192B18C5E` |
| Authenticode | NotSigned; no signing certificate configured |
| Installed runtime | PASS: `app.isPackaged === true`, version 0.1.0 |
| Chinese paths | Installer launched from a Chinese project path; isolated Chinese user-data path passed. Installation destination used the default current-user Programs directory. |
| Window/zoom | PASS: 1030 × 720 window, 125% page zoom, no horizontal overflow in dashboard or model settings; screenshot visually reviewed |
| Archive contents | PASS: no research, fixture tests, runtime data, session snapshots, settings or ledger files |
| Renderer isolation | PASS: `window.require` and `window.process` unavailable |

The installed app launched its bundled Electron runtime directly, with no Node.js runtime used by the application. This machine has development tools installed; a separate clean Windows machine test has not been performed. `tests/package-smoke.mjs` uses Playwright as the external test driver and creates an isolated profile, preserving the interactive user's account session. Local reports remain ignored.

## Live acceptance — PARTIAL / 待完成

| Check | State |
|---|---|
| Real official login and identity verification | OBSERVED in the source app on 2026-09-16; no account identifiers published |
| Real persistent session across restart / server-side logout invalidation | NOT_RUN; only local fixture persistence and local session clearing passed |
| Real active-classroom list and valid student session | NOT_RUN |
| Real new-question, close-question and reconnect messages | NOT_RUN |
| Real original images and authenticated screenshot fallback | NOT_RUN |
| User-configured external vision-model API | NOT_RUN |
| Single-choice: 3 questions and official submission records | NOT_RUN |
| Multiple-choice: 3 questions and official submission records | NOT_RUN |
| Fill-in-the-blank: 3 questions and official submission records | NOT_RUN |

The real account returned an empty active-classroom list. The user confirmed that they had not entered or checked into the classroom yet. No real question, model call, answer submission or grading result has been counted as passed. The packaged build has not yet completed live classroom acceptance.

These require a signed-in user, a live classroom activity and a user-configured vision API. They must not be marked passed from HTTP 200 alone, a local status label or fixture tests. Keep AI answer correctness separate from submission acceptance. Unknown submissions must be checked through official records before any further action.

## Protocol observations

The adapter uses candidate paths `/api/v3/user/basic-info`, `/api/v3/classroom/on-lesson`, `/api/v3/lesson/presentation/fetch`, `/api/v3/lesson/problem/answer` and `/wsapp/`. The official page, not the app, initiates classroom check-in; its response supplies the classroom token and Set-Auth bearer for the selected student classroom. Extra verification is handled in the official page.

`hello`, `unlockproblem`, `probleminfo`, presentation updates and lesson completion are implemented. A fresh question-info response and presentation read precede submission. Unknown message/schema changes or absent question identifiers can cause a safe skip; real compatibility must be confirmed rather than widening assumptions silently.

截图基于准确题目标识定位，不截图整个桌面。长页面按顺序分段；无法证明完整的嵌套裁剪布局不自动提交。
