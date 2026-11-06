# End-to-end scripts

Playwright scripts for the three frontends. They drive a real Chrome (channel `chrome`), so no Playwright browser download is required.

## Install

```bash
cd scripts/e2e
npm install
```

## Mock mode

Start the three dev servers first (mock is on by default in the generated local env):

```bash
cd frontend/react && pnpm dev      # http://localhost:5173
cd frontend/vue && pnpm dev        # http://localhost:5174
cd frontend/angular && npm start   # http://localhost:4200
```

Then run:

```bash
npx playwright install chromium   # only if you do not use channel chrome
node mock-react.mjs
node mock-vue.mjs
node mock-angular.mjs
```

Environment overrides:

- `E2E_BASE` – app base URL (defaults to the dev-server ports above).
- `E2E_EVIDENCE` – screenshot directory for failed steps.

Current result (2026-11-05): React 14/14, Vue 15/15, Angular 15/15.

The scripts cover: login, session refresh after reload, menu navigation, user search, all system pages, group create/delete, status toggle plus rejected disable rollback, permission action validation, zh/en switching, logout and protected-route redirect, restricted-role redirect, and forced password change.

## Visual parity capture

`parity.mjs` captures the same route in all three frontends and reports the
screenshot diff defined in `.scratch/ui-parity/spec.md`: viewport 1440×900, DPR
1, locale `zh`, animations disabled, same scroll position. It logs in with the
mock credentials `super/super`, so start the three dev servers first.

```bash
node parity.mjs                       # all four general tabs, dark/light, default/blue
node parity.mjs --tabs=button         # one tab
node parity.mjs --themes=dark --colors=blue
```

The script writes the screenshots, `diff-*.png`, `diff-content-*.png` and
`report.json` to `D:/User/Cache/Temp/opencode/parity` by default. `--out=...`
changes the directory. Each run reports both the full-viewport diff and a
content-only diff (the page area below the header and right of the sidebar);
the content number is the one used to judge page work, while the full number
also includes shell chrome.

## Control checks

`check-controls.mjs` verifies the shared login/header controls in a real
browser: language switching (zh → en → zh), theme toggling, locale persistence,
and the Angular color picker's default swatch. It writes screenshots and
`report.json` to `D:/User/Cache/Temp/opencode/controls` by default
(`CONTROLS_OUT` overrides the directory).

```bash
node check-controls.mjs
```

## Real backend

Mock mode must be disabled for the real run:

- React/Vue: start the dev server with `VITE_MOCK_ENABLE=false`; the Vite proxy forwards `/api/v1` to `http://127.0.0.1:8080`.
- Angular: set `mock: false` in `frontend/angular/src/environments/environment.local.ts` (generated, gitignored) and restart `npm start`.

Then run:

```bash
E2E_BACKEND=spring E2E_DB=mysql node real-react.mjs
E2E_BACKEND=spring E2E_DB=mysql node real-vue.mjs
E2E_BACKEND=spring E2E_DB=mysql node real-angular.mjs
```

`E2E_BACKEND` and `E2E_DB` are labels written into the JSON result; they do not
change the interactions. `E2E_BASE` overrides the app URL.

Current results (2026-11-05):

| Backend | Database | React | Vue | Angular |
| --- | --- | --- | --- | --- |
| FastAPI | PostgreSQL | 14/14 | 15/15 | 15/15 |
| Spring Boot | MySQL | 14/14 | 15/15 | 15/15 |
| Go | SQLite | 14/14 | 15/15 | 15/15 |

The real scripts reuse the mock flows but assert data from the database, check that
the performed writes appear in the operation log, and drop mock-only fixtures.
