> English | [简体中文](./CONFIGURATION.zh-CN.md)

# Frontend Configuration

## One source of truth

Shared values are edited in **one** file, `config/app.env`, and generated into
each stack's native config:

```text
config/app.example.env   committed template, no secrets
config/app.env           your local copy (gitignored)
scripts/sync-config.mjs  generator
```

```bash
cp config/app.example.env config/app.env   # once
node scripts/sync-config.mjs               # after every change
```

The legacy root `.env.example` was removed. Do not recreate it; it duplicated
`config/app.example.env` and had drifted (it still mentioned `VITE_ROUTE`).

## Generated files

| App | Generated file | Loaded by |
| --- | --- | --- |
| React | `frontend/react/.env.local` | Vite, highest priority |
| Vue | `frontend/vue/.env.local` | Vite, highest priority |
| Angular | `frontend/angular/src/environments/environment.local.ts` | `npm start` (`local` configuration) |

Generated files are gitignored and must not be edited by hand.

## Vite environment layers

React and Vue keep committed defaults next to the app:

| File | Purpose |
| --- | --- |
| `.env` | Shared defaults: API base, proxy target, base path |
| `.env.development` | Development defaults, mock enabled |
| `.env.github` | GitHub Pages build (React only): base path `/orange/` |
| `.env.local` | Generated local override; wins over all of the above |

Precedence, highest first:

1. Real environment variables.
2. `.env.local` (generated).
3. `.env.[mode]` and `.env`.
4. Code defaults.

## Angular environment files

| File | Purpose |
| --- | --- |
| `environment.ts` | Production defaults |
| `environment.development.ts` | Development defaults, mock on |
| `environment.local.ts` | Generated local override for `npm start` |

## Frontend variables

| Variable | Meaning |
| --- | --- |
| `REACT_PORT` / `VUE_PORT` / `ANGULAR_PORT` | Dev server port, written as `VITE_PORT` |
| `REACT_API_BASE` / `VUE_API_BASE` / `ANGULAR_API_BASE` | API prefix |
| `REACT_PROXY_TARGET` / `VUE_PROXY_TARGET` | Vite dev proxy target |
| `REACT_MOCK_ENABLE` / `VUE_MOCK_ENABLE` / `ANGULAR_MOCK_ENABLE` | In-browser mock |
| `REACT_CESIUM_TOKEN` | Optional Cesium Ion token; empty falls back to OpenStreetMap |

Angular also accepts `?mock=1` / `?mock=0` in the URL, persisted in
`localStorage` (`orange.mock.enabled`).

## Rules

- React always uses `HashRouter`; there is no routing-mode variable. Do not add
  `VITE_ROUTE` back.
- Proxy targets use `127.0.0.1`, not `localhost`, on Windows.
- Never commit `config/app.env`, `.env.local`, `environment.local.ts` or any
  real secret. CI supplies values through the environment.
- The committed `.env.example` files under `backend/<stack>` are standalone
  references for that stack; they are not read by the generator.
