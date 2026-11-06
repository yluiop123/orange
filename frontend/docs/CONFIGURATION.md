> English | [简体中文](./CONFIGURATION.zh-CN.md)

# Frontend Configuration

Each frontend keeps its own configuration next to its code. There is no shared
root `config/` directory and no generator: copy or edit the files in the app
directory, then restart the dev server.

## React

| File | Committed | Purpose |
| --- | --- | --- |
| `.env` | yes | Shared defaults: base path, API prefix, proxy target |
| `.env.development` | yes | Development default: mock on |
| `.env.github` | yes | GitHub Pages build, base `/orange/` |
| `.env.local` | no (gitignored) | Local override, highest priority |

```bash
cd frontend/react
cp .env .env.local        # optional local override
# edit VITE_MOCK_ENABLE / VITE_BASE_API / VITE_PROXY_TARGET
pnpm dev
```

Precedence, highest first:

1. Real environment variables.
2. `.env.local`.
3. `.env.[mode]` and `.env`.
4. Code defaults.

## Vue

| File | Committed | Purpose |
| --- | --- | --- |
| `.env` | yes | Shared defaults: API prefix, proxy target, mock off |
| `.env.development` | yes | Development default: mock on |
| `.env.local` | no (gitignored) | Local override, highest priority |

```bash
cd frontend/vue
cp .env .env.local
pnpm dev
```

## Angular

Angular uses TypeScript environment files instead of `.env`:

| File | Committed | Selected by |
| --- | --- | --- |
| `src/environments/environment.ts` | yes | Production build |
| `src/environments/environment.development.ts` | yes | `ng build/serve --configuration development` |
| `src/environments/environment.local.ts` | yes | `npm start` (`local` configuration) |

`npm start` uses the committed local file, which points at the real backend with
mock off. Set `mock: true` in `environment.local.ts` to run without a backend.

## Variables

| Variable | Meaning |
| --- | --- |
| `VITE_BASE` | Deployment base path (React: `/` locally, `/orange/` on Pages) |
| `VITE_BASE_API` (React) / `VITE_API_BASE` (Vue) | API prefix, default `/api/v1/` |
| `VITE_PROXY_TARGET` | Vite dev proxy target, default `http://127.0.0.1:8080` |
| `VITE_MOCK_ENABLE` | In-browser mock switch |
| `VITE_CESIUM_TOKEN` | Optional Cesium Ion token; empty falls back to OpenStreetMap |

Angular has no `VITE_*`: edit `apiBase` and `mock` in the environment file.
`proxy.conf.json` forwards `/api` to the backend during `npm start`.

## Switching between mock and real mode

| App | Real backend | Mock |
| --- | --- | --- |
| React | `VITE_MOCK_ENABLE=false` in `.env.local` | `true` |
| Vue | `VITE_MOCK_ENABLE=false` in `.env.local` | `true` |
| Angular | `mock: false` in `environment.local.ts` | `true` or `?mock=1` |

With the real backend, start it first and make sure the proxy target matches its
port. The default is `http://127.0.0.1:8080` (Spring Boot / FastAPI demo).

## Rules

- React always uses `HashRouter`; there is no routing-mode variable. Do not add
  `VITE_ROUTE` back.
- Use `127.0.0.1`, not `localhost`, for proxy targets on Windows.
- Never commit `.env.local` or a real secret such as a Cesium token.
- `.env` / `.env.development` are the committed defaults; keep them free of
  machine-specific values.
