English | [简体中文](README.zh-CN.md)

# Frontend

Three single-page applications — React, Vue and Angular — implement the same admin
product against one HTTP contract. They share facts and conventions, not runtime
code: each stack owns its `package.json`, build and component library.

| Stack | Directory | Dev port | Stack documentation |
| --- | --- | --- | --- |
| React 19 + Vite + shadcn/Base UI | `frontend/react` | 5173 | [react/README.md](react/README.md) |
| Vue 3 + Vuetify 3 + Vite | `frontend/vue` | 5174 | [vue/README.md](vue/README.md) |
| Angular 21 + Material | `frontend/angular` | 4200 | [angular/README.md](angular/README.md) |

## API conventions

All three call `/api/v1`, send `Authorization: Bearer <access token>` and
`Locale: zh|en`, and unwrap the same envelope:

```json
{ "code": 200, "message": "success", "data": {}, "timestamp": 1762483200000, "traceId": "9f8c1b2d3e4f5a6b" }
```

Pagination is always `{ total, list, page, size, totalPages }`. The access token
lives in memory only; a page reload relies on the HttpOnly refresh cookie, and a
401 triggers one single-flight refresh and one retry. `40302` means the user must
change the initial password; other 403 responses open the forbidden state.

The frozen consumer snapshot is [openapi.json](openapi.json). React generates
`src/api/schema.d.ts` from it with `pnpm gen:api`; Vue and Angular mirror the
types by hand. Each app also serves its own Swagger page at `/swagger`
(`#/swagger` in React) from `public/swagger.html` and `public/openapi.json`; it
never asks a running backend for documentation.

## Authentication and permissions

- The menu tree is data from `GET /api/v1/auth/menus`, not a frontend route
  table. The backend stores a default `sys_permission.name` plus per-locale rows
  in `sys_permission_i18n` and resolves the `Locale` header.
- `canView(path)` checks an exact menu permission or a directory permission
  matching the path prefix. `canAct(path, action)` requires an action permission
  at the same page path. Directory permissions affect visibility only.
- Role switching is a UI-only filter: the menu and action buttons are recomputed
  from the selected role, but backend Authority never changes.
- Guards differ by router: React checks `canView` in `layout.tsx`; Vue checks in
  `router.beforeEach`; Angular attaches `authGuard`, `identityGuard` and
  `permissionGuard` to routes.

## UI, theme and styles

The default accent is neutral (`#18181b` light / `#fafafa` dark). Orange is one of
seven optional palettes: `blue`, `green`, `orange`, `red`, `rose`, `violet` and
`yellow`. All three default to dark and only use light when the user has stored
it. Persistence keys are `theme-mode` / `theme-color` (React), `orange.theme` /
`orange.color` (Vue) and `orange.angular.theme` / `orange.angular.color`
(Angular).

Use semantic classes and tokens (`bg-background`, `text-foreground`,
`text-muted-foreground`, `border-border`, Vuetify/Material equivalents) so light,
dark and palette themes keep working. Never hard-code `#fff` or `gray-100`.

Layout sizes shared by the stacks: header `4rem`, sidebar `16rem` (`3rem`
collapsed, `18rem` mobile), page padding `0.75rem`, content gap `1rem`, radius
`0.625rem`.

## Mock

Development mode enables the in-browser mock by default, so the demo runs without
a backend.

| Stack | Implementation | Mock file | Default | Disable |
| --- | --- | --- | --- | --- |
| React | MSW | `src/mock/` + `public/mockServiceWorker.js` | on (`.env.development`) | `VITE_MOCK_ENABLE=false` |
| Vue | Axios adapter | `src/mock/index.ts`, `seed.ts` | on (`.env.development`) | `VITE_MOCK_ENABLE=false` |
| Angular | HTTP interceptor | `src/app/mock/` | off (`environment.local.ts`) | `?mock=0` or `mock: false` |

Vite precedence is `.env` < `.env.local` < `.env.<mode>` < `.env.<mode>.local`.
Turning mock off for development therefore belongs in `.env.development.local` or
the process environment, not `.env.local`. Changing a switch requires restarting
the dev server. Angular has no `.env` files: `pnpm start` uses the `local`
configuration and `environment.local.ts`, or `?mock=1` for a one-off.

Mock covers UI, style, i18n, routing and screenshots. It cannot verify
refresh-cookie rotation, CORS, login lockout, validation or backend
authorization.

## Runtime configuration

| Item | React | Vue | Angular |
| --- | --- | --- | --- |
| Dev server | `0.0.0.0:5173` | `0.0.0.0:5174` | `localhost:4200` |
| Port location | `vite.config.ts` (`VITE_PORT`) | `vite.config.ts` (`VITE_PORT`) | `angular.json` (`serve.options.port`) |
| API base | `VITE_BASE_API` (`/api/v1/`) | `VITE_API_BASE` (`/api/v1/`) | `environment.apiBase` (`/api/v1`) |
| Dev proxy | `/api` → `VITE_PROXY_TARGET` | `/api` → `VITE_PROXY_TARGET` | `/api` → `proxy.conf.json` |
| Env files | `.env`, `.env.development`, `.env.production` | `.env`, `.env.development`, `.env.production` | `src/environments/environment*.ts` |

The default proxy target is `http://127.0.0.1:8080` (Spring Boot). Use
`127.0.0.1` rather than `localhost` consistently: they are different origins and
do not share cookies. Proxies apply only to the dev server; production builds
need same-origin hosting or explicit backend CORS.

## Add a page

1. Create the page: `src/pages/**/index.tsx` (React), `src/views/**/*.vue` plus a
   route entry (Vue), or a component plus `page()` / `container()` entries
   (Angular).
2. Add the menu node, action nodes and role grants to
   [../database/permissions.json](../database/permissions.json). Root permission
   codes are 4 digits and gain 2 digits per level; sibling order follows the
   code.
3. Copy the seed block into all seven `database/*/dml.sql` files and update the
   React/Vue mock catalog by hand; Angular's `core/permission-catalog.ts` is also
   a hand-written mirror.
4. Add page-level translations (React `react-intl`, Vue `vue-i18n`, Angular
   `i18n.service.ts`). Menu titles are not translated on the frontend: set `name`
   and `translations` in the permission seed instead.
5. Run the stack's tests and type-check, then verify the page as `super` and as a
   role that lacks the permission.

## Tests

| Stack | Commands |
| --- | --- |
| React | `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` |
| Vue | `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` |
| Angular | `pnpm test`, `pnpm run build`, `pnpm run lint` |

React's `pnpm test` also checks pages against menu permissions and verifies the
permission seed block in `database/postgres/dml.sql`. There is no automated
end-to-end suite; each stack's test command covers unit and component behaviour.

See the [repository README](../README.md) for the full stack matrix.
