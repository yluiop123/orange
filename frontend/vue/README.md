English | [简体中文](README.zh-CN.md)

# Orange · Vue frontend

Vue 3 + Vuetify implementation with the same product scope as the React
reference. This page covers installation, commands, layout, configuration and
stack-specific deviations; shared conventions are in
[../README.md](../README.md).

## Stack and dependencies

| Item | Version / notes | Source |
| --- | --- | --- |
| Framework | Vue 3.5 | `package.json` |
| Build | Vite 8, `@vitejs/plugin-vue`, TypeScript 5.9 | `package.json`, `vite.config.ts` |
| UI | Vuetify 3.13, Material Design Icons | `src/main.ts` |
| State and routing | Pinia 3, Vue Router 4 (`createWebHistory`) | `src/stores/`, `src/router/` |
| HTTP | Axios | `src/api/http.ts` |
| Mock | Custom Axios adapter with in-memory seed data | `src/mock/` |
| i18n | `vue-i18n` 11 | `src/i18n/` |
| Tests | Vitest | `vitest.config.ts` |
| Charts and maps | ECharts, Chart.js, D3, Cesium, deck.gl, Leaflet, OpenLayers, Babylon.js | `package.json` |

## Requirements and installation

- Node.js 20.19+ or 22.12+ and pnpm 12.15.0.
- This directory has its own `pnpm-lock.yaml`.

```bash
cd frontend/vue
pnpm install
pnpm dev        # http://127.0.0.1:5174
```

## Commands

| Command | Runs | Purpose |
| --- | --- | --- |
| `pnpm dev` | `vite --port 5174` | Dev server on port 5174 |
| `pnpm build` | `vue-tsc -b && vite build` | Type-check and production build |
| `pnpm preview` | `vite preview --port 5174` | Preview the build |
| `pnpm typecheck` | `vue-tsc -b` | Type-check only |
| `pnpm test` | `vitest run` | Unit tests |
| `pnpm test:watch` | `vitest` | Watch mode |
| `pnpm lint` | `eslint . --max-warnings=0` | Lint with zero warnings |
| `pnpm format` | `prettier --write .` | Format |

## Directory structure

```text
frontend/vue/
  src/
    api/            Axios instance, auth and resource calls, hand-written types
    auth/           token, refresh, session hint, forced password-change flag
    components/     ActionAuth, FormDialog, ResourceTable, layout/, showcase/
    composables/    useAccess, useResourcePage, usePageTitle
    config/         permissions.json, menu-icons.ts
    i18n/           index.ts, zh-CN.ts, en-US.ts
    layouts/        AppLayout.vue
    lib/            access, menu, path, tree-code, validation
    mock/           Axios adapter and in-memory seed
    router/         route table and global guards
    stores/         auth, menu, ui, pinia
    styles/         main.css, system.css
    views/          system, dashboard, chart, map, three, component, login, errors
    App.vue / main.ts
  .env / .env.development
  vite.config.ts / vitest.config.ts
```

## Routing, state and API

- Routing uses `createWebHistory`. Pages and `CONTAINER_PATHS` are registered by
  hand in `src/router/index.ts`; a new container must update both.
- `router.beforeEach` checks public routes, token, user info, menus and `canView`,
  then redirects to `/forbidden`. Actions are controlled by `ActionAuth`.
- `src/api/http.ts` uses `VITE_API_BASE` (default `/api/v1/`), always sends
  `Authorization` and `Locale`, and sets `withCredentials: true` for the refresh
  cookie. On 401 it performs one single-flight refresh and retries once.
- `src/api/types.ts` hand-writes `Envelope`, `PageResult` and entity types because
  this stack has no code-generation script.

## UI and styles

Vuetify components are registered globally in `src/main.ts`, with the `outlined`
variant, `comfortable` density and MDI icons. Theming uses Vuetify's `light` /
`dark` theme objects; the colour picker writes `theme.themes.value` directly, and
persistence keys are `orange.theme` / `orange.color`. The app defaults to dark.

Cesium is copied to `cesium-package/` by `vite-plugin-cesium-build` and loaded
dynamically only on `/map/cesium`; it uses OpenStreetMap and needs no Ion token.

## Runtime configuration

| Item | Current value | Location | How to change |
| --- | --- | --- | --- |
| Dev server | `0.0.0.0:5174` | `vite.config.ts` / `package.json` | Change `VITE_PORT` or the `--port` flag |
| API base | `/api/v1/` | `.env` (`VITE_API_BASE`) | Edit the env file or export the variable |
| Dev proxy | `http://127.0.0.1:8080` | `.env` (`VITE_PROXY_TARGET`) | Point it at another backend |
| Mock | On in development | `.env.development` (`VITE_MOCK_ENABLE=true`) | `VITE_MOCK_ENABLE=false` |

## Backend connection and mock

| Mode | Configuration | Notes |
| --- | --- | --- |
| Mock | `VITE_MOCK_ENABLE=true` | Development default; a custom Axios adapter returns seed data |
| Proxy to backend | `VITE_MOCK_ENABLE=false` + `VITE_PROXY_TARGET` | Vite proxies `/api`; cookies stay same-origin |
| Direct backend | `VITE_API_BASE=http://127.0.0.1:8080/api/v1/` | Requires backend CORS and cross-site cookie settings |

Vite precedence is `.env` < `.env.local` < `.env.<mode>` < `.env.<mode>.local`.
Use `.env.development.local` or a process variable to disable mock locally.

| Environment | File |
| --- | --- |
| Base | `.env` |
| Development | `.env.development` |
| Local override (gitignored) | `.env.local`, `.env.development.local` |
| Production | Base + build-time environment variables |

## Deviations of this stack

- Routes are hand-written instead of collected from the filesystem.
- Mocking replaces `http.defaults.adapter`; it is not MSW.
- Some chart pages are substituted: AntV pages render with ECharts, Recharts
  pages with Chart.js, and `/map/l7` does not load L7.
- Unit tests are 4 files covering access, path, tree code and page clamp; there
  are no DOM component tests.

## Further reading

- [Frontend overview](../README.md)
- [HTTP contract](../openapi.json)
- [Repository README](../../README.md)
