# Validation / 验证记录

Date: 2026-09-16. Target: Windows 11 x64. Version: 0.1.1.

This document separates software checks from real platform acceptance. Test accounts, cookies, model keys, question images and logs are synthetic or local only and are not published.

## Local checks

| Check | Evidence | Result |
|---|---|---|
| TypeScript and production bundles | `npm run build` | PASS |
| Core and integration tests | `npm test`: 56 tests, 3 files | PASS |
| Electron desktop fixture | 16 scenarios, 4 synthetic submissions, 7 model calls | PASS |
| Dependency audit | `npm audit`: 0 reported vulnerabilities on 2026-09-16 | PASS |
| Startup recovery | `node tests/startup-recovery.mjs`: saved API fields survive an unreadable login snapshot | PASS |

The 16 desktop scenarios cover login, persistent login, logout, encrypted API key, randomized image probes, preview without submission, single choice, duplicate events, multiple choice, ordered multiple blanks with punctuation, authenticated screenshot fallback, long-question segmentation, minimized capture, WebSocket reconnection, uncertain receipt without retry, and stopped startup with the recovered ledger.

The core tests also cover malformed model output, exact 64-bit IDs, invalid option sets, deadline changes, model service errors, atomic-write failure, and pause/stop/question closure during asynchronous Cookie lookup immediately before network dispatch. A real local TCP reset test verifies that the POST transport does not silently retry an already received request.

Reports and screenshots are generated locally under ignored `test-results/`. Fixture results do not contain evidence of real classroom compatibility or model answer accuracy.

Version 0.1.1 regressions reproduced and fixed: unreadable platform-session ciphertext blocked initialization; the real `hello.timeline` problem entries were ignored; repeated presentation reads caused platform HTTP 429; rotating CDN `auth_key` values falsely invalidated pending answers. Tests verify that startup still restores model fields, timeline discovery does not refetch presentations, pre-submit verification still fetches fresh content, and server version/image-content changes still invalidate an answer.

## Installer

The current-user NSIS installer was built and installed on Windows 11 x64 (OS build 26200); the installer returned exit code 0. No GitHub Release was created.

| Artifact | Value |
|---|---|
| Filename | `RainClassroom-AI-0.1.1-Setup.exe` |
| Size | 112,182,180 bytes |
| SHA-256 | `444A7E004676B54CC0291CFE354871908896B634134828A64466B56D6F627F18` |
| Authenticode | NotSigned; no signing certificate configured |
| Installed runtime | PASS: `app.isPackaged === true`, version 0.1.1 |
| Chinese paths | Installer launched from a Chinese project path; isolated Chinese user-data path passed. Installation destination used the default current-user Programs directory. |
| Window/zoom | PASS: 1030 × 720 window, 125% page zoom, no horizontal overflow in dashboard or model settings; screenshot visually reviewed |
| Archive contents | PASS: no research, fixture tests, runtime data, session snapshots, settings or ledger files |
| Renderer isolation | PASS: `window.require` and `window.process` unavailable |

The installed app launched its bundled Electron runtime directly, with no Node.js runtime used by the application. This machine has development tools installed; a separate clean Windows machine test has not been performed. `tests/package-smoke.mjs` uses Playwright as the external test driver and creates an isolated profile, preserving the interactive user's account session. Local reports remain ignored.

## Live acceptance — PARTIAL / 待完成

| Check | State |
|---|---|
| Real official login and identity verification | OBSERVED on 2026-09-16; no account identifiers published |
| Real account/model settings across restart | PASS: installed 0.1.1 retains the verified account, Base URL, model name, encrypted key, vision-test status and 6 ledger records after closing and reopening; server-side logout invalidation remains NOT_RUN |
| Real active-classroom list and valid student session | OBSERVED |
| Recovery of published questions from official timeline | PASS: 6 questions detected |
| Real future unlock, close-question and reconnect events | NOT_RUN; covered by fixtures only |
| Real original question images | PASS |
| Real authenticated screenshot fallback | NOT_RUN; fixture fallback and long segmentation passed |
| User-configured external vision-model API | PASS: 4 valid previews; 2 single-choice outputs rejected by validation |
| Single-choice: 3 questions and official submission records | PARTIAL: 2 submitted, 2 matched official stored results |
| Multiple-choice: 3 questions and official submission records | PARTIAL: 1 submitted, 1 matched official stored result |
| Fill-in-the-blank: 3 questions and official submission records | PARTIAL: 1 submitted, 1 matched official stored result |
| Model correctness / official grading | NOT_RUN; submission acceptance is not correctness |

At 17:02 China Standard Time, the official classroom page was reloaded and its fresh presentation response was compared locally with the app ledger. All 4 accepted submissions matched (multiple-choice compared as a set; blanks compared in order). Two other single-choice tasks returned invalid model answer counts and were skipped without submitting. Raw responses, images, account identifiers, credentials and answers are not published. The full target of 3 real questions per type remains pending.

These require a signed-in user, a live classroom activity and a user-configured vision API. They must not be marked passed from HTTP 200 alone, a local status label or fixture tests. Keep AI answer correctness separate from submission acceptance. Unknown submissions must be checked through official records before any further action.

## Protocol observations

The adapter uses candidate paths `/api/v3/user/basic-info`, `/api/v3/classroom/on-lesson`, `/api/v3/lesson/presentation/fetch`, `/api/v3/lesson/problem/answer` and `/wsapp/`. The official page, not the app, initiates classroom check-in; its response supplies the classroom token and Set-Auth bearer for the selected student classroom. Extra verification is handled in the official page.

`hello.timeline` and `fetchtimeline` contain published `type: problem` entries with `prob`, `pres`, `sid`, `dt` and `limit`. These were observed in the live classroom. The `unlockedproblem` field is optional. `unlockproblem`, `probleminfo`, presentation updates and lesson completion are also implemented. A fresh question-info response and presentation read precede submission. Only the observed `rain-pri-ups.yuketang.cn` CDN's `auth_key` query parameter is excluded from the content revision; real content and server version remain checked.

截图基于准确题目标识定位，不截图整个桌面。长页面按顺序分段；无法证明完整的嵌套裁剪布局不自动提交。
