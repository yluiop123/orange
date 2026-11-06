# ORANGE — Vue 3 + Vuetify frontend

A Vue 3 port of the ORANGE admin console, at parity with `frontend/react` for the product
scope described in [`docs/FEATURES.md`](../../docs/FEATURES.md), the API contract in
[`docs/API.md`](../../docs/API.md), and the porting checklist in
[`docs/PORTING.md`](../../docs/PORTING.md).

Design docs: [frontend/docs](../docs/README.md) · configuration:
[frontend/docs/CONFIGURATION.md](../docs/CONFIGURATION.md).

Stack: Vue 3.5 · Vite 8 · TypeScript · Vuetify 3 · Pinia · Vue Router · vue-i18n · Axios.
Charts use ECharts, Chart.js and D3; maps use Leaflet, OpenLayers, deck.gl and Cesium; 3D uses
Three.js and Babylon.js.

## Prerequisites

- Node.js 20.19+ or 22.12+ (Vite 8 requirement)
- pnpm 10+ (`packageManager` is pinned to `pnpm@12.15.0`)
- Optional: a running ORANGE backend, default `http://localhost:8080`

## Install and run

```bash
cd frontend/vue
pnpm install
pnpm dev
```

The dev server listens on **http://localhost:5174**. It proxies `/api` to
`VITE_PROXY_TARGET` (default `http://localhost:8080`) so the HttpOnly refresh cookie stays
same-origin in development.

Local development enables the in-browser mock by default (`.env.development`), so the demo runs
without a backend:

| Account | Password | Notes |
| --- | --- | --- |
| `super` | `super` | all roles and permissions |
| `admin` | `admin` | system management, no `super` grant |
| `user` | `user` | dashboards only |
| `newbie` | `newbie` | forced initial password change |

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE` | `/api/v1/` | API root. Keep the trailing slash. Can be absolute for cross-origin. |
| `VITE_MOCK_ENABLE` | `false` in `.env`, `true` in `.env.development` | Enables the local demo adapter. |
| `VITE_PROXY_TARGET` | `http://localhost:8080` | Vite dev proxy target for `/api`. |

To run against the real backend:

```bash
# .env.local
VITE_MOCK_ENABLE=false
VITE_API_BASE=/api/v1/
VITE_PROXY_TARGET=http://localhost:8080
```

Cross-origin direct connections require the backend to allow the frontend origin **with
credentials**; the access token is sent as `Authorization: Bearer …`, the refresh token is an
HttpOnly cookie scoped to `/api/v1/auth`.

## Scripts

```bash
pnpm dev         # Vite dev server on 5174
pnpm build       # vue-tsc -b && vite build
pnpm preview     # preview the production build on 5174
pnpm typecheck   # vue-tsc -b
pnpm test        # Vitest: access filtering, tree-code policy, path matching, page clamping
pnpm lint        # ESLint 10 + eslint-plugin-vue + Prettier config, zero warnings allowed
pnpm format      # Prettier
```

## Auth and session behavior

- The access token is held **in memory only** (`src/auth/token.ts`) and is never written to
  `localStorage`.
- Login stores a non-sensitive session hint and sets the token; a page reload restores the
  session through the HttpOnly refresh cookie.
- On `401`, a single-flight `POST /auth/refresh` rotates the token and retries the original
  request. Concurrent 401s share one refresh. If refresh fails, state is cleared and the user is
  sent to `/login` with a `redirect` query.
- `40302` (must change the initial password) opens a non-dismissible change-password dialog. The
  dialog also offers sign-out. Other `403`s open a forbidden dialog with the server message and
  path; the failed request is still rejected to the caller.
- Logout revokes the access token with its own bearer header, clears the refresh cookie
  server-side, and clears all local state.

## Menus, access and role switch

- `/auth/menus` is the only source of menu names, paths and order. The sidebar renders the
  backend tree; container nodes expand and all parent chain nodes auto-expand for the active
  route. Breadcrumbs are built from the same chain.
- `/` and every container path (`/system`, `/dashboard`, `/chart`, `/map`, `/three`,
  `/component`) redirect to the first visible leaf for the current role view.
- `src/lib/access.ts` implements `canView`, `canAct`, `visibleMenuTree`, `firstVisibleLeaf`.
  Directory permissions control visibility only; actions never appear without the matching
  `action#path:action` grant (`ActionAuth` component).
- The header role switch is **UI-only**. It recomputes direct + selected-role grants from
  `userPermissions` / `rolePermissions` and never changes backend authority. If the active route
  becomes invisible, it redirects to the first visible leaf or `/forbidden`.
- The selected role is remembered per username in `localStorage`; the token never is.

## System pages

All five system pages share `useResourceList` / `useResourcePage`:

- 250 ms debounced fetching with `AbortController` cancellation on filter/page changes;
- server pagination for users, roles and operation logs; client tree pagination for groups and
  permissions;
- row selection, bulk delete, labelled delete/status confirmations and page clamping after a
  delete;
- `FormDialog` drives add/edit forms, validates the same boundaries as the backend, maps
  `40002` field errors back to inputs, and closes only after a successful write;
- group and permission codes are validated by the shared `checkTreeCode` rule (root length,
  parent prefix, digits) before submit;
- disabling is confirmed; the self account cannot be deleted or disabled; the UI shows a
  temporary password once after user creation or reset.

## i18n and theming

- Chinese and English messages live in `src/i18n/zh-CN.ts` and `en-US.ts`. The locale persists in
  `localStorage` and is sent to the backend as the `Locale` header.
- Menu titles are **not translated by the frontend**. They come from the backend menu tree. The
  demo mock localizes them from the `Locale` header; switching language refetches menus and
  user info.
- Light/dark theme is a Vuetify theme switch persisted in `localStorage`.

## Page coverage

`docs/FEATURES.md §5` has 33 routes; 31 product pages if the two error routes are excluded.
Every route below is implemented and reachable through the backend menu (or as a dedicated
error route):

| Group | Routes |
| --- | --- |
| Auth / errors | `/login` (login + forced password change), `/forbidden`, `/not-found` |
| System | `/system/user`, `/system/role`, `/system/group`, `/system/permission`, `/system/operation-log` |
| Dashboards (6) | `/dashboard/normal`, `/dashboard/network-security`, `/dashboard/military-situational-awareness`, `/dashboard/disaster-command`, `/dashboard/agriculture-forestry`, `/dashboard/industrial` |
| Charts (4) | `/chart/antv`, `/chart/d3`, `/chart/echart`, `/chart/rechart` |
| Maps (5) | `/map/cesium`, `/map/deckgl`, `/map/l7`, `/map/leaflet`, `/map/openlayers` |
| 3D (2) | `/three/three`, `/three/babylon` |
| Components (8) | `/component/general`, `/component/layout`, `/component/navigation`, `/component/table`, `/component/form`, `/component/display`, `/component/feedback`, `/component/custom` |

All routes are lazy-loaded. The shell, sidebar, header and error pages remain usable if a demo
chunk fails to load.

## Demo data

`VITE_MOCK_ENABLE=true` installs a small Axios adapter (`src/mock/`) that implements the contract
in memory: login/refresh/logout/change-password, user-info, menus, CRUD for users/roles/groups/
permissions, operation logs, validation errors, status guards, delete guards, temporary
passwords and write logging. State is in memory and resets on reload; the current username is
kept in `localStorage` so refresh-on-reload can resume the demo session. No mock code runs when
the flag is off.

## Known gaps

- **AntV page**: AntV G2 is not bundled; `/chart/antv` renders the AntV palette and chart grammar
  with ECharts. L7/LarkMap itself was not added because it needs a Mapbox/AMap token.
- **L7 map**: `/map/l7` renders the same POI-layer demo and a dark basemap with Leaflet instead
  of AntV L7, again to avoid a commercial map token.
- **Recharts page**: Recharts is React-only, so `/chart/rechart` demonstrates the same chart set
  with Chart.js.
- **Cesium**: `/map/cesium` uses `vite-plugin-cesium-build` (assets copied to
  `dist/cesium-package/`) and loads `Cesium.js` only on that route. It uses OpenStreetMap imagery,
  so no Ion token is required. The build emits the Cesium package as static files; deploy them
  with `dist/`.
- **deck.gl**: the page uses a tokenless dark canvas (like the React reference) rather than a
  raster basemap.
- **Maps and 3D** need WebGL and network access for OSM tiles. A failed tile/server does not take
  down the shell.
- **Mock vs backend**: mock behavior covers the flows exercised by the UI, not lockout counters,
  token rotation internals, retention jobs or every backend guard. Production builds expect a
  real backend.
- **Operation log** is read-only and uses ordinary offset paging (`page`/`size`), matching the
  contract; keyset paging is not implemented.
- **Demo/gallery microcopy**: the shell, auth, system pages and menu chrome are fully bilingual;
  some component-gallery section labels and sample rows are intentionally English/library names
  and are not translated.
- **No E2E suite in CI**: Vitest covers access filtering, path boundaries, tree-code validation
  and page clamping. Browser smoke checks were run manually during development.
- **Bundle size**: route-split demo chunks are still large (Babylon.js and ECharts are each
  around 1.1 MB minified). They are lazy-loaded only on their pages, but the first visit to those
  pages is heavier than the system pages.
- No GitHub Pages workflow is added for this stack, by design.
