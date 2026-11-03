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

Current result (2026-11-04): React 14/14, Vue 15/15, Angular 15/15.

The scripts cover: login, session refresh after reload, menu navigation, user search, all system pages, group create/delete, status toggle plus rejected disable rollback, permission action validation, zh/en switching, logout and protected-route redirect, restricted-role redirect, and forced password change.

## Real backend

Mock mode must be disabled for the real run:

- React/Vue: start the dev server with `VITE_MOCK_ENABLE=false`; the Vite proxy forwards `/api/v1` to `http://localhost:8080`.
- Angular: set `mock: false` in `frontend/angular/src/environments/environment.local.ts` (generated, gitignored) and restart `npm start`.

Known differences to keep in mind when writing the real script:

- The mock-only status guard (`PATCH /groups/:id/status` on a node with enabled children) must be replaced with the equivalent real-data case, or skipped.
- Mock user ids/roles differ from the database seed; read the real list before asserting names.
- Operation logs are real rows, so assert on the actions performed in the same run.
