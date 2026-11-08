English | [简体中文](README.zh-CN.md)

# Orange · React frontend

React 19 + Vite implementation and the reference frontend for Orange. It covers
installation, commands, layout, configuration and stack-specific deviations; the
shared conventions are in [../README.md](../README.md).

## Stack and dependencies

| Item | Version / notes | Source |
| --- | --- | --- |
| Framework | React 19, React DOM 19 | `package.json` |
| Build | Vite 8, TypeScript 5.9, SWC React plugin | `package.json`, `vite.config.ts` |
| UI | shadcn-style components on Base UI, Tailwind CSS 4, lucide/Tabler icons | `src/components/`, `package.json` |
| State and routing | Zustand, React Router 8 (`HashRouter`) | `src/store/`, `src/App.tsx` |
| HTTP | Axios | `src/lib/axios.ts` |
| Mock | MSW 3 | `src/mock/`, `public/mockServiceWorker.js` |
| i18n | `react-intl` | `src/locale/` |
| Tests | Vitest | `vitest.config.ts` |
| Maps and charts | ECharts, Recharts, Ant Design Plots, Cesium, deck.gl, Leaflet, OpenLayers, Babylon.js | `package.json` |

## Requirements and installation

- Node.js 20.19+ or 22.12+ and pnpm 12.15.0.
- This directory has its own `pnpm-lock.yaml`.

```bash
cd frontend/react
pnpm install
pnpm dev        # http://127.0.0.1:5173
```

## Commands

| Command | Runs | Purpose |
| --- | --- | --- |
| `pnpm dev` | `vite` | Dev server on port 5173 |
| `pnpm build` | `tsc -b && vite build` | Type-check and production build |
| `pnpm build:github` | `tsc -b && cross-env VITE_BASE=/orange/ VITE_MOCK_ENABLE=true vite build` | GitHub Pages build with base `/orange/` |
| `pnpm preview` | `vite preview` | Preview the production build |
| `pnpm preview:github` | `cross-env VITE_BASE=/orange/ vite preview` | Preview the Pages build |
| `pnpm lint` | `eslint .` | Lint |
| `pnpm typecheck` | `tsc -b` | Type-check only |
| `pnpm test` | `vitest run` | Unit tests |
| `pnpm test:watch` | `vitest` | Watch mode |
| `pnpm gen:api` | `openapi-typescript ../openapi.json -o src/api/schema.d.ts` | Regenerate API types from the snapshot |
| `pnpm analyze` | `cross-env ANALYZE=true vite build` | Emit `dist/stats.html` |

## Directory structure

```text
frontend/react/
  public/mockServiceWorker.js   MSW worker
  src/
    api/            Axios wrapper; schema.d.ts is generated
    auth/           access token, refresh, session hint
    components/     ui/, ext/, system/, shell components
    config/         permissions.json, menu-icons.ts
    hooks/          reusable hooks
    lib/            axios, access, path, menu, page-routes, tree-code
    locale/         zh-CN.ts, en-US.ts
    mock/           MSW handlers and in-memory data
    pages/          one directory per Page Path, entry is index.tsx
    store/          Zustand: user, menu, permission, theme, locale
    themes/         palette CSS files
    App.tsx / layout.tsx / main.tsx / index.css
  .env / .env.development / .env.production
  vite.config.ts / vitest.config.ts / components.json
```

## Routing, state and API

- `HashRouter` is fixed. Page routes are collected from `pages/**/index.tsx` by
  `src/lib/page-routes.ts`, so a new page usually does not touch the route table.
- Zustand stores hold the user, menu, permission, theme and locale. The access
  token stays in memory; a reload uses the HttpOnly refresh cookie.
- `src/lib/axios.ts` uses `VITE_BASE_API` (default `/api/v1/`), always sends
  `Authorization` and `Locale`, performs one single-flight refresh on 401, and
  handles 403 / 40302.
- `layout.tsx` checks `access.canView` before rendering the outlet; `MenuRedirect`
  handles `/` and container paths. Actions are wrapped in `ActionAuth`.
- `src/api/schema.d.ts` is generated from `frontend/openapi.json`; do not edit it
  by hand.

## UI and styles

Components live in `src/components`; the shadcn-style `ui/` layer is built on
Base UI and Tailwind CSS 4. The default accent is neutral, with seven optional
palettes. Use the semantic tokens from `src/index.css`; the theme is applied as
`<html class="dark">` plus `theme-<color>`, persisted under `theme-mode` and
`theme-color`. The app defaults to dark.

Cesium is bundled by `vite-plugin-cesium-build` and loaded only on the Cesium
page; no Cesium Ion token is required.

## Runtime configuration

| Item | Current value | Location | How to change |
| --- | --- | --- | --- |
| Dev server | `0.0.0.0:5173` | `vite.config.ts` | `VITE_PORT` or the default in `vite.config.ts` |
| API base | `/api/v1/` | `.env` (`VITE_BASE_API`) | Edit the env file or export the variable |
| Dev proxy | `http://127.0.0.1:8080` | `.env` (`VITE_PROXY_TARGET`) | Point it at another backend |
| Mock | On in development | `.env.development` (`VITE_MOCK_ENABLE=true`) | `VITE_MOCK_ENABLE=false` |
| Pages base | `/orange/` | `package.json` (`build:github`) | Edit the `VITE_BASE` value in the script |

## Backend connection and mock

| Mode | Configuration | Notes |
| --- | --- | --- |
| Mock | `VITE_MOCK_ENABLE=true` | Development default; MSW intercepts requests in the browser |
| Proxy to backend | `VITE_MOCK_ENABLE=false` + `VITE_PROXY_TARGET` | `/api` is proxied by Vite, so cookies stay same-origin |
| Direct backend | `VITE_BASE_API=http://127.0.0.1:8080/api/v1/` | Requires backend CORS and cross-site cookie settings |

Vite precedence is `.env` < `.env.local` < `.env.<mode>` < `.env.<mode>.local`.
To disable the development mock, use `.env.development.local` or a process
variable; `.env.local` is overridden by `.env.development`.

| Environment | File |
| --- | --- |
| Base | `.env` |
| Development | `.env.development` |
| Production | `.env.production` |
| Local override (gitignored) | `.env.local`, `.env.development.local` |
| GitHub Pages | `.env.production` plus inline `VITE_BASE` / `VITE_MOCK_ENABLE` in `build:github` |

## Deviations of this stack

- Hash routing is fixed; there is no history-mode switch.
- MSW is imported dynamically only when mock is enabled.
- Unit tests run in the Node environment and cover access, path, permission
  catalog, tree code, page clamp and permission merging; there are no DOM tests.
- `build:github` is deployed to GitHub Pages by CI on push to `main`.

## Further reading

- [Frontend overview](../README.md)
- [HTTP contract](../openapi.json)
- [Repository README](../../README.md)
