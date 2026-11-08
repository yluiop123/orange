English | [简体中文](README.zh-CN.md)

# ORANGE Vue frontend

Vue 3 + Vuetify implementation with the same product scope as the React reference; this page covers installation, commands, layout, dependencies and deviations only.

## Environment and installation

- Node.js (version pinned by Vite 8) and pnpm; `package.json` sets `packageManager` to `pnpm@12.15.0`.
- This directory ships its own `pnpm-lock.yaml`.

```bash
cd frontend/vue
pnpm install
```

`.env.development` sets `VITE_MOCK_ENABLE=true` by default, so login works without a backend; accounts are `super / super`, `admin / admin` and `user / user`. `.env.local` is ignored by the `*.local` rule.

## Commands

| Command | Actually runs | Purpose |
| --- | --- | --- |
| `pnpm dev` | `vite --port 5174` | Dev server, fixed at 5174 |
| `pnpm build` | `vue-tsc -b && vite build` | Production build after type checking |
| `pnpm preview` | `vite preview --port 5174` | Preview the build output |
| `pnpm typecheck` | `vue-tsc -b` | Type checking only |
| `pnpm test` | `vitest run` | Unit tests (`src/**/*.test.ts`, node environment) |
| `pnpm test:watch` | `vitest` | Watch mode |
| `pnpm lint` | `eslint . --max-warnings=0` | ESLint, zero warnings |
| `pnpm format` | `prettier --write .` | Formatting |

## Directory structure

```text
frontend/vue/
  src/
    api/            axios instance, auth and per-resource requests, hand-written types
    auth/           token, refresh, session hint, forced password-change flag
    components/     ActionAuth, FormDialog, ResourceTable, layout/, showcase/
    composables/    useAccess, useResourcePage, usePageTitle
    config/         permissions.json (synced copy), menu-icons.ts
    i18n/           index.ts, zh-CN.ts, en-US.ts
    layouts/        AppLayout.vue
    lib/            access, menu, path, tree-code, validation
    mock/           axios adapter and in-memory seed
    router/         route table and global guards
    stores/         auth, menu, ui, pinia
    styles/         main.css, system.css
    views/          system, dashboard, chart, map, three, component, login, errors
    App.vue / main.ts
  .env / .env.development
  vite.config.ts / vitest.config.ts
```

## Dependencies of this stack

`package.json` has 17 runtime dependencies and 18 dev dependencies.

| Category | Dependencies |
| --- | --- |
| Framework and UI | `vue`, `vuetify`, `@mdi/font` |
| Routing, state, i18n | `vue-router`, `pinia`, `vue-i18n` |
| HTTP | `axios` |
| Charts | `echarts`, `chart.js`, `d3` |
| Maps | `leaflet`, `ol`, `@deck.gl/core`, `@deck.gl/layers`, `cesium` |
| 3D | `three`, `@babylonjs/core` |

Vuetify components are registered globally in `src/main.ts`, the default form variant is `outlined`, `density: comfortable`, and the icon set is MDI.

## Relationship to the contract

- The contract is `contracts/openapi.json`, but this stack has no code-generation script; `src/api/types.ts` hand-writes `Envelope`, `PageResult` and the entity types, and `src/api/*.ts` returns `response.data.data`.
- `src/api/http.ts` uses `VITE_API_BASE` as its base URL (default `/api/v1/`), always sends `Authorization` and `Locale`, and sets `withCredentials: true` so the refresh cookie is carried.
- On 401 it performs a single-flight `POST /auth/refresh` and retries once; 403 opens the forbidden dialog and `40302` opens forced password change.
- Endpoints and error codes are in the [HTTP contract](../../contracts/openapi.json).

## Conventions and deviations of this stack

- Routing uses `createWebHistory`; pages are registered by hand in `src/router/index.ts`, and the container paths `CONTAINER_PATHS` are a hand-written list too — a new container must update it.
- The global guard `router.beforeEach` checks public routes, token, user-info, menus and `canView`; action permissions are controlled by the `ActionAuth` component.
- Mocking is not MSW but an Axios adapter replacing `http.defaults.adapter` (`src/mock/index.ts` + `seed.ts`), with state kept in memory.
- Menu titles are taken from `GET /api/v1/auth/menus` (`sys_permission.name` / `name_en`, selected by the backend from the `Locale` header); the frontend keeps no title catalogue.
- Theming uses Vuetify's `light` / `dark` theme objects; the colour picker writes `theme.themes.value` directly, and persistence keys are `orange.theme` / `orange.color`.
- Some chart pages are substituted: AntV pages render with ECharts and Recharts pages with Chart.js; `/map/l7` does not load L7 and uses a tokenless point-layer card demo instead.
- Cesium is copied to `cesium-package/` by `vite-plugin-cesium-build`, loaded dynamically only at `/map/cesium`, uses OpenStreetMap imagery and needs no Ion token.
- Unit tests are 4 files covering access, path, tree-code and page-clamp; there are no DOM component tests.

## Further reading

- [Frontend overview: architecture, design system, permission visibility, adding a page, mock switching](../../frontend/README.md)
- [Repository stack and command matrix](../../README.md)
- [HTTP contract](../../contracts/openapi.json)

> Last verified: c7b6531 · 2026-11-08
> Sources: frontend/vue/package.json, frontend/vue/vite.config.ts, frontend/vue/vitest.config.ts, frontend/vue/.env*, frontend/vue/src/main.ts, frontend/vue/src/router/index.ts, frontend/vue/src/api/http.ts, frontend/vue/src/mock/index.ts, frontend/vue/src/views/chart/AntvView.vue, frontend/vue/src/views/chart/RechartView.vue, frontend/vue/src/views/map/CesiumView.vue, frontend/vue/src/views/map/L7View.vue
