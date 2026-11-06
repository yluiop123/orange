> English | [简体中文](./GETTING-STARTED.zh-CN.md)

# Frontend Getting Started

## Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | 20.19+ or 22.12+ | Vite 8 requirement; Angular is verified on Node 24 |
| pnpm | 10+ | React and Vue pin the version in `package.json` |
| npm | 11+ | Used by the Angular workspace |
| Backend | optional | Mock mode runs without it; real mode expects `http://127.0.0.1:8080` |

## Install and run

### React

```bash
cd frontend/react
pnpm install
pnpm dev            # http://localhost:5173
```

### Vue

```bash
cd frontend/vue
pnpm install
pnpm dev            # http://localhost:5174
```

### Angular

```bash
cd frontend/angular
npm install
npm start           # http://localhost:4200, `local` configuration
```

Each dev server proxies `/api` to the backend target from the generated local
config. If the backend runs elsewhere, change `config/app.env` and regenerate
(see [CONFIGURATION.md](./CONFIGURATION.md)).

## Demo accounts

| Account | Password | Scope |
| --- | --- | --- |
| `super` | `super` | all roles and permissions |
| `admin` | `admin` | system management without `super` |
| `user` | `user` | dashboards only |

## Test and verify

```bash
# Unit tests and static checks
cd frontend/react   && pnpm run typecheck && pnpm run lint && pnpm run test && pnpm run build
cd frontend/vue     && pnpm run typecheck && pnpm run lint && pnpm run test && pnpm run build
cd frontend/angular && npm run lint && npm test && npm run build
```

End-to-end scripts live in [`../../scripts/e2e`](../../scripts/e2e/README.md):

```bash
node scripts/e2e/real-react.mjs
node scripts/e2e/real-vue.mjs
node scripts/e2e/real-angular.mjs
```

`real-*` needs the backend and database; `mock-*` runs against the in-browser
mock. Both start and stop their own browser.

## Common issues

- **Windows + `localhost`**: prefer `127.0.0.1` for proxy targets. `localhost`
  can resolve to IPv6 while the backend listens on IPv4.
- **Blank page in dev**: check that the backend target is reachable and that
  `VITE_MOCK_ENABLE` / `ANGULAR_MOCK_ENABLE` matches the mode you want.
- **Stale generated config**: re-run `node scripts/sync-config.mjs`; never edit
  `.env.local` or `environment.local.ts` by hand.
- **Port already in use**: stop the previous dev server instead of starting a
  second one on a different port, because GitHub Pages and the proxy config
  assume the documented ports.
