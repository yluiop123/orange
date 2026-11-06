> English | [简体中文](./ARCHITECTURE.zh-CN.md)

# Frontend Architecture

## Shape

Three independent SPAs implement the same product. They share the HTTP
contract, the menu data and the visual language, but not code. A change to a
page is not complete until React, Vue and Angular agree.

```text
frontend/
  react/     React 19 + Vite + Tailwind + shadcn/Base UI + Zustand
  vue/       Vue 3.5 + Vite + Vuetify 3 + Pinia
  angular/   Angular 21 + Angular Material + signals
  docs/      this documentation
```

## Layers

| Layer | React | Vue | Angular |
| --- | --- | --- | --- |
| App shell | `src/App.tsx`, layout components | `src/layouts/AppLayout.vue` | `src/app/layout/shell.component.ts` |
| Routing | React Router 8, `HashRouter` | Vue Router 4, `createWebHistory` | Angular Router, `provideRouter` |
| State | Zustand (`src/store`) | Pinia (`src/stores`) | signals + injectable services |
| API client | Axios (`src/lib/axios.ts`) | Axios (`src/api`) | `HttpClient` + interceptor |
| i18n | react-intl (`src/locale`) | vue-i18n (`src/i18n`) | `I18nService` (`src/app/core`) |
| Theme | CSS variables + `data-theme` | Vuetify theme + CSS variables | CSS variables + Material tokens |
| UI kit | shadcn/Base UI | Vuetify | Angular Material |
| Tests | Vitest | Vitest | Vitest via Angular builder |

The framework-free rules for routes, menus, theme tokens and tab styling are in
[STYLE-GUIDE.md](./STYLE-GUIDE.md). Page content is ported from React; do not
invent a different layout for the same menu entry.

## Shell

Every app renders the same shell:

1. Login page (split hero + card, language and theme controls).
2. Sidebar with the menu tree returned by `GET /auth/menus`.
3. Header with breadcrumb, collapse control, language switch and theme switch.
4. Content area with the page container and, where the page has tabs, the
   segmented tab list.

The sidebar is fixed and the content area owns scrolling. Menu labels, icons,
order and visibility come from the backend response; only the rendering is
local. Access filtering must match React's rules:

- A menu is visible when its path is in the user's granted paths.
- A parent is visible when at least one child is visible.
- Switching to a role without the current path redirects to the first visible
  page.

## Session and API

- The access token is kept in memory, never in `localStorage`.
- The refresh token is an HttpOnly cookie scoped to the API auth paths.
- A single-flight refresh retries concurrent `401` responses and rotates the
  token once.
- `40302` (initial password change required) opens a non-dismissible dialog.
  Other `403` responses surface the server message and still reject the
  request.
- All requests send `Locale: zh|en`; `traceId` is echoed by the backend.

## Mock and real mode

| App | Mock switch | Implementation |
| --- | --- | --- |
| React | `VITE_MOCK_ENABLE` | MSW worker (`src/mock`) |
| Vue | `VITE_MOCK_ENABLE` | in-browser demo adapter |
| Angular | `ANGULAR_MOCK_ENABLE` or `?mock=1` | in-browser demo adapter |

Mock mode covers login, refresh, menus, CRUD, operation logs and the main error
codes. Real mode uses the Vite/Angular proxy so the refresh cookie stays
same-origin.

## Visual parity

- Default primary is neutral (`#18181b` light, `#fafafa` dark); brand orange is
  reserved for brand marks such as the login logo.
- The segmented tab list is 32 px tall with a 25 px pill, 3 px padding, 10 px
  container radius and 8 px pill radius. The active pill uses the same shadow
  and border relationship as the React implementation.
- Menus, buttons, links and active tabs follow the selected primary colour.
- The full token and component rules live in
  [STYLE-GUIDE.md](./STYLE-GUIDE.md).

## Testing

- Unit tests cover access filtering, tree-code policy, path matching and page
  clamping.
- Playwright suites under [`../../scripts/e2e`](../../scripts/e2e/README.md)
  cover login, navigation, CRUD and permission flows in mock and real mode.
- Visual checks compare screenshots of the same route across the three apps.
