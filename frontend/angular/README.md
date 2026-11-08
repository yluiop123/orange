English | [简体中文](README.zh-CN.md)

# ORANGE Angular frontend

Angular 21 + Angular Material implementation with the same product scope as the React reference; this page covers installation, commands, layout, dependencies and deviations only.

## Environment and installation

- Node.js and pnpm; `package.json` sets `packageManager` to `pnpm@12.15.0`.
- This directory ships its own `pnpm-lock.yaml`; use `pnpm install --frozen-lockfile` to reproduce the locked versions.

```bash
cd frontend/angular
pnpm install --frozen-lockfile
```

`pnpm start` uses the `local` configuration, which replaces `src/environments/environment.ts` with `src/environments/environment.local.ts`. That configuration defaults `mock` to `false` and points at the real backend on 8080. To run without a backend, open the app with `?mock=1` (the choice persists in `orange.mock.enabled`) instead of editing the tracked environment file.

## Commands

| Command | Actually runs | Purpose |
| --- | --- | --- |
| `pnpm start` | `ng serve --port 4200 --configuration local` | Dev server, port 4200, with `proxy.conf.json` |
| `pnpm build` | `ng build` | Production build (default `production` configuration) |
| `pnpm run watch` | `ng build --watch --configuration development` | Watch build with the development configuration |
| `pnpm test` | `ng test --watch=false` | Unit tests (`@angular/build:unit-test`, Vitest) |
| `pnpm lint` | `ng lint` | ESLint + angular-eslint |
| `pnpm run ng` | `ng` | Invoke the Angular CLI directly |

There is no separate `typecheck` script; `ng build` and `ng test` both perform strict template type checking.

## Directory structure

```text
frontend/angular/
  public/                      static assets (brand images etc.)
  src/
    environments/              environment.ts / .development.ts / .local.ts
    app/
      core/                    auth, interceptor, access, menu, i18n, models, tree-code
      layout/                  shell, sidebar-item, menu-redirect
      mock/                    in-memory backend, mock-data, interceptor
      pages/                   login, system, dashboard, chart, map, three, component
      shared/                  dialogs, EChart wrapper, pickers, chart-presets
      app.config.ts            providers and app initializer
      app.routes.ts            route table
    main.ts / styles.scss
  angular.json / proxy.conf.json / tsconfig*.json
```

## Dependencies of this stack

`package.json` has 20 runtime dependencies and 14 dev dependencies.

| Category | Dependencies |
| --- | --- |
| Framework and UI | `@angular/{animations,cdk,common,compiler,core,forms,material,platform-browser,router}` (21.2.x) |
| Reactive and runtime | `rxjs`, `tslib` |
| Charts | `echarts`, `d3` |
| Maps | `leaflet`, `ol`, `@deck.gl/core`, `@deck.gl/geo-layers`, `@deck.gl/layers` |
| 3D | `three`, `@babylonjs/core` |

Cesium is not listed as a dependency: `/map/cesium` loads a fixed 1.147 version from the Cesium CDN at runtime, and shows a static fallback when offline. Material uses a Material 3 theme, whose primary colour and radii are overridden in `src/styles.scss` to the same neutral palette as React.

## Relationship to the contract

- The contract is `contracts/openapi.json`; this stack has no generation script, and `src/app/core/models.ts` hand-mirrors types such as `Envelope`, `PageResult`, `UserInfo` and `MenuNode`.
- `ApiService` unwraps `{ code, message, data }` uniformly and turns non-200 codes into `ApiError`; `system-api.service.ts` wraps calls per resource.
- `auth.interceptor.ts` prefixes relative URLs with `environment.apiBase` and attaches `Authorization` and `Locale`; on 401 it refreshes single-flight through `RefreshService` and retries once.
- `RefreshService` uses `fetch` rather than `HttpClient`, so the refresh request does not re-enter the interceptor and recurse.
- Endpoints and error codes are in the [HTTP contract](../../contracts/openapi.json).

## Conventions and deviations of this stack

- Routes are registered by hand in `src/app/app.routes.ts`. `page(path, permissionPath, loader)` attaches `permissionGuard`, and `container('system')` and friends handle container redirects; both new pages and new containers require editing it.
- Mocking is the in-memory implementation in `mock.interceptor.ts` + `mock-backend.ts`, ordered after the auth interceptor; `?mock=1` persists to `orange.mock.enabled` and `?mock=0` clears it.
- The permission catalog `src/app/core/permission-catalog.ts` is a hand-written mirror that the root `permissions:sync` does not update; a new permission must be added there and to `ROLE_PERMISSIONS` at the same time.
- The i18n dictionary lives in the `EN` / `ZH` constants of `src/app/core/i18n.service.ts`, with no separate locale files; menu titles come from `GET /api/v1/auth/menus` (`name` / `name_en`, localized by the backend).
- Theme and palette switching exist (`ThemeToggleComponent`, colour menu), with persistence keys `orange.angular.theme` and `orange.angular.color`, defaulting to dark.
- Some chart pages are substituted: both the AntV and Recharts pages render with ECharts, and `/map/l7` uses a Leaflet base map with SVG flow lines instead of loading L7.
- The root workflow's `deploy` publishes React only; this stack only runs build/lint/test and has no separate GitHub Pages configuration.
- Unit tests are 4 specs covering access, page-clamp, tree-code and the mock backend; there is no end-to-end suite, and E2E is driven externally by `scripts/e2e/*`.

## Further reading

- [Frontend overview: architecture, design system, permission visibility, adding a page, mock switching](../../frontend/README.md)
- [Repository stack and command matrix](../../README.md)
- [HTTP contract](../../contracts/openapi.json)

> Last verified: c7b6531 · 2026-11-08
> Sources: frontend/angular/package.json, frontend/angular/angular.json, frontend/angular/proxy.conf.json, frontend/angular/src/environments/environment*.ts, frontend/angular/src/app/app.config.ts, frontend/angular/src/app/app.routes.ts, frontend/angular/src/app/core/guards.ts, frontend/angular/src/app/core/auth.interceptor.ts, frontend/angular/src/app/core/refresh.service.ts, frontend/angular/src/app/core/permission-catalog.ts, frontend/angular/src/app/core/i18n.service.ts, frontend/angular/src/app/mock/mock-backend.ts, frontend/angular/src/app/pages/map/cesium/map-cesium.component.ts, frontend/angular/src/app/pages/chart/rechart/chart-rechart.component.ts, frontend/angular/src/styles.scss
