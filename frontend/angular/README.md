English | [简体中文](README.zh-CN.md)

# Orange · Angular frontend

Angular 21 + Angular Material implementation with the same product scope as the
React reference. This page covers installation, commands, layout, configuration
and stack-specific deviations; shared conventions are in
[../README.md](../README.md).

## Stack and dependencies

| Item | Version / notes | Source |
| --- | --- | --- |
| Framework | Angular 21.2 (`core`, `common`, `forms`, `router`, `platform-browser`) | `package.json` |
| UI | Angular Material 21, Angular CDK, SCSS | `src/styles.scss` |
| Build | Angular CLI 21 (`@angular/build:application`), TypeScript 5.9 | `angular.json` |
| Reactive | RxJS 7.8, signals and injectable services | `src/app/core/` |
| HTTP | `HttpClient` with interceptors | `src/app/core/` |
| Mock | HTTP interceptor | `src/app/mock/` |
| i18n | `core/i18n.service.ts` | `src/app/core/` |
| Tests | Angular unit-test builder (Vitest) | `angular.json` |
| Charts and maps | ECharts, D3, Leaflet, OpenLayers, deck.gl, Babylon.js | `package.json` |

## Requirements and installation

- Node.js 20.19+ or 22.12+ and pnpm 12.15.0.
- This directory has its own `pnpm-lock.yaml`.

```bash
cd frontend/angular
pnpm install --frozen-lockfile
pnpm start      # http://localhost:4200
```

## Commands

| Command | Runs | Purpose |
| --- | --- | --- |
| `pnpm start` | `ng serve --port 4200 --configuration local` | Dev server on 4200 with `proxy.conf.json` |
| `pnpm build` | `ng build` | Production build |
| `pnpm run watch` | `ng build --watch --configuration development` | Watch build |
| `pnpm test` | `ng test --watch=false` | Unit tests |
| `pnpm lint` | `ng lint` | ESLint + angular-eslint |
| `pnpm run ng` | `ng` | Invoke the Angular CLI directly |

There is no separate type-check script; `ng build` and `ng test` perform strict
template type checking.

## Directory structure

```text
frontend/angular/
  public/                      static assets
  src/
    environments/              environment.ts / .development.ts / .local.ts
    app/
      core/                    auth, interceptors, access, menu, i18n, models
      layout/                  shell, sidebar, menu redirect
      mock/                    in-memory backend and interceptor
      pages/                   login, system, dashboard, chart, map, three, component
      shared/                  dialogs, ECharts wrapper, pickers
      app.config.ts            providers and app initializer
      app.routes.ts            route table
    main.ts / styles.scss
  angular.json / proxy.conf.json / tsconfig*.json
```

## Routing, state and API

- Routes are registered by hand in `src/app/app.routes.ts`. `page(path,
  permissionPath, loader)` attaches `permissionGuard`, and `container('system')`
  handles container redirects; new pages and containers require editing it.
- State uses Angular signals plus injectable services; there is no external store.
- `ApiService` unwraps `{ code, message, data }` and turns non-200 codes into
  `ApiError`; `system-api.service.ts` wraps calls per resource.
- `auth.interceptor.ts` prefixes relative URLs with `environment.apiBase` and
  attaches `Authorization` and `Locale`. On 401 it refreshes single-flight through
  `RefreshService` and retries once. `RefreshService` uses `fetch` so the refresh
  call does not re-enter the interceptor.

## UI and styles

Material uses a Material 3 theme; primary colour and radii are overridden in
`src/styles.scss` to match the neutral palette. Theme and palette switching use
`orange.angular.theme` / `orange.angular.color` and default to dark.

Cesium is not a dependency: `/map/cesium` loads a fixed 1.147 version from the
Cesium CDN and shows a static fallback offline. Some chart pages are substituted:
AntV and Recharts pages render with ECharts, and `/map/l7` uses a Leaflet base map
with SVG flow lines.

## Runtime configuration

| Item | Current value | Location | How to change |
| --- | --- | --- | --- |
| Dev server | `localhost:4200` | `angular.json` (`serve.options.port`) | Edit the port or pass `--port` |
| API base | `/api/v1` | `src/environments/environment*.ts` | Edit `apiBase` |
| Dev proxy | `http://127.0.0.1:8080` | `proxy.conf.json` | Change `target` |
| Mock | Off in `local` | `environment.local.ts` (`mock: false`) | Set `mock: true` or open `?mock=1` |

## Backend connection and mock

| Mode | Configuration | Notes |
| --- | --- | --- |
| Mock | `mock: true` in the active environment, or `?mock=1` | In-memory interceptor; `?mock=0` clears the stored choice |
| Proxy to backend | `apiBase: '/api/v1'` + `proxy.conf.json` | The dev server proxies `/api` to 8080 |
| Direct backend | `apiBase: 'http://127.0.0.1:8080/api/v1'` | Requires backend CORS and cookie settings |

`pnpm start` uses the `local` configuration, which replaces
`environment.ts` with `environment.local.ts`. The tracked file defaults to
`mock: false`, so the dev server expects the backend on 8080. Use `?mock=1` for a
one-off mock run instead of editing the tracked file.

| Environment | File | Selection |
| --- | --- | --- |
| Production | `environment.ts` | `ng build` (default) |
| Development | `environment.development.ts` | `--configuration development` |
| Local | `environment.local.ts` | `pnpm start` / `--configuration local` |

## Deviations of this stack

- The permission catalog `src/app/core/permission-catalog.ts` is a hand-written
  mirror; add a new permission there and to `ROLE_PERMISSIONS` together.
- The i18n dictionary is in the `EN` / `ZH` constants of `i18n.service.ts`; there
  are no separate locale files.
- CI publishes React only; Angular runs build, lint and test without a Pages
  configuration.
- Unit tests are 4 specs covering access, page clamp, tree code and the mock
  backend; there is no end-to-end suite.

## Further reading

- [Frontend overview](../README.md)
- [HTTP contract](../openapi.json)
- [Repository README](../../README.md)
