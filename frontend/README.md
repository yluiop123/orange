English | [简体中文](README.zh-CN.md)

# Frontend

Three single-page applications — React, Vue and Angular — implement the same
admin product against one HTTP contract. They share facts and conventions, not
runtime code: each stack owns its `package.json`, build and component library.
Pick the stack you are working on: [React](react/README.md) (behaviour and
visual baseline), [Vue](vue/README.md) or [Angular](angular/README.md).

## Three stacks, one boundary

| Concern | React | Vue | Angular |
| --- | --- | --- | --- |
| Entry | `src/main.tsx` → `App.tsx` | `src/main.ts` → `App.vue` | `src/main.ts` → `app.config.ts` |
| Router | React Router 8, `HashRouter` | Vue Router 4, `createWebHistory` | `provideRouter` |
| State | Zustand | Pinia | signals + injectable services |
| API | Axios instance | Axios instance | `HttpClient` + interceptors |
| Mock | MSW | Axios adapter | HTTP interceptor |
| Unit tests | Vitest | Vitest | `ng test` (Vitest builder) |

Pages sit in `src/pages/**/index.tsx` (React), `src/views/**/*.vue` (Vue) and
`src/app/pages/**/*.component.ts` (Angular). Layouts, route tables, access
helpers, auth stores, locale files and mock handlers follow the same split in
each stack.

What is shared is verifiable, not executable: the frozen OpenAPI snapshot
([openapi.json](openapi.json)), the permission catalog
and seed data ([../database/](../database/)), and the cross-stack check scripts
([../scripts/](../scripts/)). There is deliberately no workspace
package — JSX, SFC and Angular templates cannot share components, and a shared
layer would lock all three Vite/Angular versions together.

`openapi.json` is a frontend-owned frozen snapshot. Every app serves its own
Swagger UI page at `/swagger` (`#/swagger` in React) from
`public/swagger.html` and `public/openapi.json`; it never asks a running backend
for documentation. When `openapi.json` changes, copy it into all three apps'
`public/` directories; `node scripts/check-config.mjs` fails when a copy drifts.

## Routing and permission visibility

Routes are a code-level set of pages; the menu tree is data returned by
`GET /api/v1/auth/menus`. The frontend renders the tree and decides visibility,
but never generates routes from it. A page path is the permission identity:
`/system/user` is both a route and the permission node it requires.

| Capability | Meaning |
| --- | --- |
| `canView(path)` | exact menu permission, or a directory permission matching the path prefix |
| `canAct(path, action)` | an action permission exists at the same page path |
| `visibleMenuTree(nodes)` | a container is visible when at least one child is visible |
| `firstVisibleLeaf(nodes)` | default landing target for `/` and container paths |

Guards live where each router puts them:

- React has no per-route guard. `layout.tsx` checks `access.canView` before
  rendering `<Outlet />` and navigates to `/forbidden` on failure; `MenuRedirect`
  handles `/` and container paths.
- Vue checks public routes, token, user, menus and `canView` in
  `router.beforeEach`, then redirects to `/forbidden`.
- Angular attaches `authGuard` and `identityGuard` to the shell, and
  `permissionGuard` to every `page()` route.

Menu titles come from `GET /api/v1/auth/menus`. The backend stores `name` and
`name_en` on `sys_permission` and returns the one matching the `Locale` header,
so no frontend ships a menu-title catalogue. Only icons are mapped locally by
path, because the permission table has no icon column.

Switching roles is a UI-only filter: user permissions are merged with the
selected role's permissions and the menu and action buttons are recomputed. The
backend Authority is never changed, and a role without the current path lands on
`firstVisibleLeaf` or `/forbidden`.

## API and mock switching

All three call `/api/v1`, send `Authorization: Bearer <access token>` and
`Locale: zh|en`, and unwrap `{ code, message, data, timestamp, traceId }`.
Pagination is always `{ total, list, page, size, totalPages }`. The access token
lives in memory only; a page reload relies on the HttpOnly refresh cookie, and a
401 triggers one single-flight refresh and one retry. `40302` (forced password
change) and other 403 responses are handled in the fetch/axios layer.

Mock switches:

| Stack | File | Mock on | Real backend |
| --- | --- | --- | --- |
| React | `.env.development.local` | `VITE_MOCK_ENABLE=true` | `VITE_MOCK_ENABLE=false` |
| Vue | `.env.development.local` | `VITE_MOCK_ENABLE=true` | `VITE_MOCK_ENABLE=false` |
| Angular | `src/environments/environment.local.ts` | `mock: true` | `mock: false` |

Vite loads environment files in this order, later overriding earlier:
`.env` < `.env.local` < `.env.<mode>` < `.env.<mode>.local`, with process
environment variables highest. A mode file therefore overrides `.env.local`, so
turning mock off for development belongs in `.env.development.local` or in the
process environment. `pnpm dev` works without a backend because both
`.env.development` files enable mock by default.

Angular has no `.env` files. `pnpm start` always runs
`ng serve --configuration local`, which swaps in `environment.local.ts`
(`apiBase: '/api/v1'`, `mock: false`) and proxies `/api` through
`proxy.conf.json` to `http://127.0.0.1:8080`.

Changing a switch requires restarting the dev server: Vite evaluates
`import.meta.env` and Angular applies `fileReplacements` only at startup. Pass
the variable to the process for a one-off run, e.g. `VITE_MOCK_ENABLE=false pnpm dev`.

Mock implementations differ: React uses MSW, Vue replaces the Axios adapter with
seeded data, and Angular returns in-memory responses from an interceptor. Mock
covers UI, style, i18n, routing and screenshots; it cannot verify refresh-cookie
rotation, CORS, login lockout, validation or backend authorization.

In development the frontend proxies `/api` to the backend so that the browser
sees same-origin requests and can send the refresh cookie. The default target is
`http://127.0.0.1:8080` (Spring Boot); change the proxy target rather than the
API prefix in source. `localhost` and `127.0.0.1` are different origins and do
not share cookies — prefer `127.0.0.1`. Proxies apply only to the dev server;
production builds need same-origin hosting or explicit backend CORS.

## Design system

React defines the default neutral tokens in `src/index.css`; Vue mirrors the
same values in its Vuetify theme; Angular maps `--app-*` onto `--mat-sys-*` in
`styles.scss`.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--background` | `#ffffff` | `#0a0a0a` | page surface |
| `--foreground` | `#18181b` | `#fafafa` | primary text |
| `--primary` | `#18181b` | `#fafafa` | primary button, selection |
| `--muted` / `--secondary` | `#f4f4f5` | `#27272a` | secondary surfaces |
| `--muted-foreground` | `#71717a` | `#a1a1aa` | secondary text |
| `--border` / `--input` | `#e4e4e7` | `#3f3f46` | borders, inputs |
| `--destructive` | `#ef4444` | dark red | delete, error |
| `--sidebar` | `#fafafa` | `#18181b` | sidebar |

The default accent is neutral — `#18181b` in light mode, `#fafafa` in dark.
Orange is a brand color and one of seven optional palettes (`blue`, `green`,
`orange`, `red`, `rose`, `violet`, `yellow`). Selecting one adds
`theme-<color>` to `<html>`; React and Angular toggle `html.dark`, Vue calls
`theme.change('dark')`. All three default to dark and only use light when the
user has explicitly stored it. Persistence keys are `theme-mode`/`theme-color`
(React), `orange.theme`/`orange.color` (Vue) and
`orange.angular.theme`/`orange.angular.color` (Angular).

Sizes come from code, not from the retired style guide:

| Item | Value |
| --- | --- |
| Header | `4rem` (`h-16`, `--orange-header-height`, `--app-header-height`) |
| Sidebar | `16rem`; `3rem` collapsed; `18rem` mobile |
| Page padding / content gap | `0.75rem` / `1rem` |
| Radius | `0.625rem` default, `0.65rem` in palette themes |
| Table row / button | `2.5rem` / `2.25rem` |

Typography is the system UI stack, with no web fonts. Vue and Angular page
titles use `1.25rem/1.75rem/700` (`.orange-title`); body uses `1rem/1.75rem/400`.

Use semantic classes only — `bg-background`, `text-foreground`,
`text-muted-foreground`, `border-border`, `rounded-lg`, or the Vuetify/Material
equivalents. They follow dark mode and all seven palettes. Never hard-code
`#fff` or `gray-100`.

## Add a page: the shortest path

1. Create the page file: `src/pages/reports/sales/index.tsx` (React, the route
   is collected by `import.meta.glob` and derived from the path), a view plus a
   `src/router/index.ts` child (Vue), or a component plus `page()` and
   `container()` entries (Angular).
2. Add the menu node, action nodes and role grants to
   [../database/permissions.json](../database/permissions.json). Permission
   codes are 4 digits at the root and gain 2 digits per level; sibling order
   follows the code.
3. From the repository root run `pnpm run permissions:sync`. This regenerates
   the seed block in all seven `database/*/dml.sql` files and the React/Vue mock
   catalog; Angular's `core/permission-catalog.ts` only feeds its mock and is
   updated by hand.
4. Add page-level translations (React `page.reports.sales.*`, Vue page keys,
   Angular `i18n.service.ts`). Menu titles are not translated on the frontend:
   set `name` and `name_en` in the permission seed instead.
5. Style with design tokens and wrap actions in `ActionAuth` (React/Vue) or
   `auth.canAct(path, 'add')` (Angular).
6. Run the stack's tests and typecheck, then verify the page as a `super` user
   and as a role that lacks the permission.

Directory permissions only affect menu visibility and grant no API access.
Action permissions must match the same page path and action name; the backend
still enforces Authority.

## Tests

| Stack | Commands |
| --- | --- |
| React | `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` |
| Vue | `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` |
| Angular | `pnpm test`, `pnpm run build`, `pnpm run lint` |

React's `pnpm test` includes a bidirectional check between pages and menu
permissions, plus the generated seed block in `database/postgres/dml.sql`.
`pnpm gen:api` regenerates `src/api/schema.d.ts` from the contract; Vue and
Angular type the envelope by hand, so contract changes rely on review.

There is no automated end-to-end suite in this repository; each frontend's own
test command covers unit and component behaviour, and [../scripts/](../scripts/)
holds the cross-stack checks. For the product-level view, see the
[repository README](../README.md).