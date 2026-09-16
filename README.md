# RainClassroom AI Desktop

[简体中文](README.zh-CN.md) · [Issues](https://github.com/jiazhengfu912-lang/RainClassroom-AI-Desktop/issues)

An experimental Windows 11 x64 app for standard RainClassroom (`www.yuketang.cn`). Sign in through the official website, select one live classroom, capture question images, and use your own vision-model API to preview or automatically submit single-choice, multiple-choice and fill-in-the-blank answers.

**Version 0.1.0 has not yet completed live RainClassroom acceptance. Local fixture tests do not prove compatibility with current authenticated classroom services or official submission records.** See [validation evidence](docs/VALIDATION.md).

Real account identity verification has been observed successfully. Live classroom questions and official submission records remain pending.

## Run

```powershell
npm ci
npm test
npm run build
npm run test:e2e
npm start
npm run package
```

Build environment: Node.js 24.13+, npm, Windows 11 x64. The current-user installer is produced in `deliverables/`; it does not require Node.js on the user's machine. Publishing is explicitly disabled during packaging.

## Workflow

Open the official page and sign in there, then return to the dashboard and verify your login. Configure a Chat Completions-compatible API root, API key and vision model; the image capability test makes two billable model calls. Select a live classroom, completing any official entry verification, and choose preview or automatic submission. Entering a classroom can also perform platform attendance.

If the classroom list is empty, use the same account to check in or enter the active classroom through RainClassroom, then refresh the app. The local installer is unsigned. An installed-app smoke check is available with `node tests/package-smoke.mjs "absolute installed executable path"`; it uses an isolated Chinese user-data path.

Pause blocks unsent submissions while retaining receipts for requests already sent. Closing the main window exits; restart never automatically starts answering. Minimized operation is supported. Suspend and network interruption require reconnection and resynchronization.

## Reliability and data

- Platform image first; authenticated, precisely identified question-region screenshot as fallback. Incomplete or unidentified content is skipped.
- Official classroom type mapping: single=1, multiple=2, blanks=4. Ordered blank answers preserve punctuation.
- Exact identifiers, validated structured model output, fresh identity/question/deadline checks, write-ahead persistence and duplicate suppression.
- Interrupted submissions become `UNKNOWN`. Accepted, rejected or unknown submissions are never automatically resent. Platform acceptance is separate from grading correctness.
- Grading is explicitly displayed as not retrieved: its platform protocol has not been validated. Check actual scores and correctness in the official page.
- API keys are encrypted using Electron safeStorage/Windows DPAPI. Platform cookies are isolated from model requests. The model receives image bytes and necessary text, never classroom credentials.
- User data remains local; images stay in memory. Logout clears platform storage but retains the submission ledger. Same-user malicious software is outside DPAPI's protection boundary.
- Remote official pages run in sandboxed WebContentsView instances without Node.js or privileged IPC bridges.

The E2E suite uses an isolated local HTTP/WebSocket/model fixture and separate user data. Test endpoint overrides are disabled in packaged builds. Private data, screenshots, installers, research bundles and build artifacts are excluded from Git.

Internal RainClassroom APIs and DOM structures can change. This release targets one account and classroom, with three question types; it does not promise correct model answers. [Sources and third-party notices](THIRD_PARTY_NOTICES.md). No project-level license has been added.
