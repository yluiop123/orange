# ORANGE — Angular frontend

Angular + Angular Material port of the ORANGE admin console. It implements the
same product scope as `frontend/react`: authentication, RBAC view filtering,
system management, operation log and the demo pages (dashboards, charts, maps,
3D, component gallery).

Design docs: [frontend/docs](../docs/README.md) · configuration:
[frontend/docs/CONFIGURATION.md](../docs/CONFIGURATION.md).

- Framework: **Angular 21.2.25**, standalone components, Angular Router, signals
- UI: **Angular Material 21.2.14** (Material 3 theme, neutral palette with an
  orange brand mark)
- Charts: **ECharts 6**, **d3 7** (hand-built SVG)
- Maps: **Leaflet 1.9**, **OpenLayers 10**, **deck.gl 9**, **Cesium** (CDN runtime)
- 3D: **Three.js 0.187**, **Babylon.js 9**
- Tests: Vitest via `@angular/build:unit-test`
- Lint: ESLint + `angular-eslint` (Angular default flat config)

## Prerequisites

- Node.js **24.0+** (verified on 24.9.0). Angular 22 requires Node 24.15+, so this
  port intentionally pins Angular 21.2.x, the latest stable line that runs here.
- npm 11+
- A running ORANGE backend for login and system pages (default
  `backend/springboot` on `http://localhost:8080`).

## Install

```bash
cd frontend/angular
npm install
```

## Run the dev server

```bash
npm start
```

The app is served on **http://localhost:4200**.

`proxy.conf.json` forwards `/api` to `http://localhost:8080`, so the browser sees
same-origin requests and the HttpOnly refresh cookie works without CORS changes.
Point it at another backend by editing `proxy.conf.json` (dev) or
`src/environments/environment.ts` (build).

## API base URL

The API base is configured in:

- `src/environments/environment.ts` (production, default `/api/v1`)
- `src/environments/environment.development.ts` (development, default `/api/v1`)
- `src/environments/environment.local.ts` (local, used by `npm start`)

`environment.apiBase` is used by the HTTP interceptor, the login/refresh/logout
calls and `ApiService`. Trailing slashes are normalized. Requests send
`Locale: zh|en`; the refresh cookie is sent with `credentials: 'include'`.

## Mock mode

Set `mock: true` in `environment.local.ts` and restart. `npm start` uses that
file, so the app signs in and manages data without a backend.
`environment.development.ts` also enables mock mode by default.

You can also open any build with `?mock=1`; the flag is persisted in
`localStorage` (`orange.mock.enabled`). Use `?mock=0` to clear it when
`environment.mock` is `false`.

Seeded accounts: `super / super`, `admin / admin`, `user / user`,
`auditor / auditor`, and `newbie / newbie` (temporary password flow). The mock
covers login, refresh, menus, user/role/group/permission CRUD, operation logs,
permission-denied `403`, and `40302`.

## Commands

```bash
npm start          # ng serve on port 4200 with the API proxy
npm run build      # production build (dist/angular)
npm test           # ng test --watch=false (Vitest)
npm run lint       # ng lint (ESLint + angular-eslint)
```

Type-checking is part of both `ng build` and `ng test` (strict templates).

## Authentication and session

- The access token lives **in memory only** (`TokenStore` signal). It is never
  written to `localStorage` or `sessionStorage`.
- A non-sensitive `orange.session` hint lets the app attempt a refresh on reload.
- `POST /auth/refresh` uses the HttpOnly cookie through `fetch` (outside the
  interceptor to avoid recursion). Concurrent 401s share one refresh.
- A 401 retries the original request once after a successful refresh. If refresh
  fails, local state is cleared and the user is sent to `/login`.
- `must_change_password` opens a non-dismissible change-password dialog; every
  other API returns `40302` until it is changed.
- Logout clears local state immediately, then revokes the token and cookie.

## Menus and access

- Menus load from `GET /api/v1/auth/menus`; the sidebar renders the backend tree.
  Menu titles are **not translated** — they come from the database.
- `visibleMenuTree` and `firstVisibleLeaf` handle container redirects
  (`/`, `/dashboard`, `/system`, …).
- `canView` and `canAct` come from `createAccess` in `src/app/core/access.ts`.
  Directory permissions only affect visibility, never API access.
- The role selector is a **UI-only view filter**: it merges direct permissions
  with the selected role's `rolePermissions` and recomputes menus and action
  buttons. It never reduces backend authority.
- Buttons without permission are hidden (add/edit/delete/reset/status).

## Pages (FEATURES.md §5)

| Path | Implementation |
| --- | --- |
| `/login` | Login form, forced change-password dialog |
| `/system/user` | Filter, server paging, selection, add/edit, reset password, status toggle, delete + page clamp |
| `/system/role` | Filter, server paging, selection, add/edit with permission picker, status, delete |
| `/system/group` | Tree table, hand-entered codes, add child, edit, status, cascade delete, root paging |
| `/system/permission` | Tree table, type/path/action form, filter by type, status, cascade delete |
| `/system/operation-log` | Read-only filters (user/path/status/date range), server paging, detail dialog |
| `/forbidden` | 403 page with back/home |
| `/not-found` | 404 page |
| `/dashboard/normal` | KPI cards, trend, traffic sources, goals, activity |
| `/dashboard/network-security` | Dark security dashboard, risk gauge, severity, alerts |
| `/dashboard/military-situational-awareness` | Tactical scatter, readiness radar, unit table |
| `/dashboard/disaster-command` | Severity, response chart, resources, command timeline |
| `/dashboard/agriculture-forestry` | Harvest/rainfall/crop charts, field table |
| `/dashboard/industrial` | Throughput, OEE gauge, line bars, equipment table |
| `/chart/antv` | Five soft-palette charts (ECharts, AntV-inspired) |
| `/chart/d3` | Bar, area line, scatter and donut built with d3 scales/shapes |
| `/chart/echart` | Nine ECharts examples (line, area, bar, pie, radar, gauge, scatter) |
| `/chart/rechart` | Recharts-style card grid (ECharts equivalents) |
| `/map/cesium` | Cesium globe loaded from CDN, OSM imagery, camera flight, offline fallback |
| `/map/deckgl` | deck.gl TileLayer + ScatterplotLayer + ArcLayer |
| `/map/l7` | L7-style animated flow map (Leaflet + SVG flow lines) |
| `/map/leaflet` | Markers, popups, circle, polylines, route toggle |
| `/map/openlayers` | Vector points, line, polygon draw interaction, live coordinates |
| `/three/three` | Three.js torus knot, lights, orbit controls, satellites |
| `/three/babylon` | Babylon engine, arc camera, glow, animated meshes |
| `/component/general` | Buttons, badges, chips, typography, progress, icons, cards |
| `/component/layout` | Responsive grid, split layout, cards, expansion, grid list |
| `/component/navigation` | Tabs, menus, breadcrumb, paginator, stepper |
| `/component/table` | Filter, sorting, selection, pagination |
| `/component/form` | Reactive form with inputs, select, datepicker, autocomplete, slider, validation |
| `/component/display` | Avatars, badges, tooltips, list, tree, chips, card |
| `/component/feedback` | Snackbars, dialog, banners, progress, empty and skeleton states |
| `/component/custom` | Hero card, KPI rings, service status, timeline, profile, feed |

## System page behavior

- Filters debounce (300 ms) and cancel the previous request.
- Server-paginated tables (users, roles, logs) clamp the page index after a
  delete (`src/app/core/page-clamp.ts`, unit-tested).
- Tree pages (groups, permissions) load the full array, rebuild the tree and
  page **root nodes** while preserving hierarchy; deleting a node sends the
  whole subtree deepest-first.
- Dialogs use reactive forms, disable immutable codes/usernames, validate the
  business-code shape before submit, and map server `40002` field errors back
  onto controls.
- Status changes that disable a row ask for confirmation; delete always asks.
- Temporary passwords from user creation/reset are shown once in a copyable
  dialog.
- Destructive/sensitive interactions are hidden without `canAct`.

## i18n

Chinese and English dictionaries live in `src/app/core/i18n.service.ts`.
The language selector persists `locale` in `localStorage` and sends the
`Locale` header. Menu names, user content and backend messages are rendered as
returned by the server; after a language switch the app refetches menus and
user-info so the sidebar and breadcrumb update immediately.

## Project layout

```
src/
  environments/            apiBase + mock per build
  app/core/                auth, interceptor, access, menu, list controller,
                           tree-code policy, page clamp, i18n, models
  app/mock/                in-memory backend, seeded data, mock interceptor
  app/layout/              shell, sidebar items, menu redirect
  app/shared/              dialogs, ECharts wrapper, pickers, chart presets
  app/pages/               login, system, dashboards, charts, maps, 3D, components
```

## Tests

```bash
npm test -- --watch=false
```

The suite covers:

- access filtering: exact menu, directory prefix, action permissions,
  `visibleMenuTree`, `firstVisibleLeaf`, empty permissions;
- business-code validation: root lengths, digits, blank, child length and prefix;
- page clamping after single/multi deletion and invalid page sizes;
- mock backend: login/refresh, localized menus, `403`, `40302`, self-disable,
  paged users and operation logs.

## Known gaps

- **Angular 21.2.x, not 22**: the newest stable Angular 22 line requires Node
  24.15+ and this environment has 24.9.0. The code uses standalone components
  and signals and upgrades cleanly.
- **Cesium is loaded from the Cesium CDN** at runtime (about 5 MB). Without
  network access the page shows a static globe fallback instead of failing.
- **L7 uses a simplified implementation**: `@antv/l7` requires a map-provider
  token, so `/map/l7` renders animated SVG flow lines over a Leaflet base map.
- **AntV and Recharts pages use ECharts** (React-only libraries). The pages keep
  the same datasets and card layout, and say so on screen.
- **deck.gl** uses a Carto dark raster TileLayer. No basemap token is required.
- **Demo data is static.** Demo pages call no extra backend endpoints (by design).
  Some demo chart captions (for example “Revenue and orders over the last twelve
  months”) remain in English; shell, login, system pages, dialogs and validation
  messages are fully translated.
- **Tree pagination pages root nodes.** A very large tree with more than one page
  of roots shows a subset at a time; deeper nodes stay attached to their root.
- **No dark/light theme switcher.** The shell follows the light Material 3 theme;
  the security/military/3D/map pages use their own dark surfaces.
- **Google Fonts/Material Icons are CDN assets.** Icons may not render offline;
  layout and functionality still work.
- **No E2E suite.** The Vitest suite covers access, tree-code validation, page
  clamping and the in-memory mock backend.
- **No GitHub Pages workflow** for this stack, as required by the porting rules.
