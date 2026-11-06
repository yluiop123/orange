# UI parity spec

Status: ready-for-agent
Feature: three-frontend visual parity (React / Vue / Angular)

## Problem

The three frontends implement the same product but diverge visually. Recent
work aligned the shell, login, tabs, menus and the component tab inventory. The
remaining work is to make the same route render the same pixels, using the
routing chosen in this thread.

## Decisions

1. **Keep framework-native components.** React uses its shadcn/Base UI
   components, Vue uses Vuetify (`v-btn`, `v-card`, `v-field`), Angular uses
   Angular Material (`mat-button`, `mat-card`, `mat-form-field`).
2. **Change common/global styles only.** No per-page button classes, no
   per-component style additions. Global overrides live in:
   - `frontend/vue/src/styles/main.css`
   - `frontend/angular/src/styles.scss`
   - `frontend/react/src/index.css`
3. **Layout primitives live in each app's main stylesheet.** No shared file:
   Vue `styles/main.css`, Angular `styles.scss`, React `index.css`. The
   classes use the `orange-*` namespace (`.orange-root`, `.orange-body`,
   `.orange-title`, `.orange-row`, `.orange-section`). They must not define
   alternative button/card components.
4. **React is the content baseline.** React styles may be adjusted when needed
   to make the shared rules sensible.
5. **Menus:** parent active background stays unchanged; parent text uses the
   theme color and weight 500. Child active keeps the filled background; child
   text is white in dark mode and foreground in light mode.
6. **Tabs:** selected label uses the theme color. In dark mode the active pill is
   lifted 10% with a visible border. Long tab strips scroll horizontally.
7. **Two palettes are verified:** default neutral and colored (blue) theme, in
   light and dark.
8. **Screenshot protocol:** Chrome, viewport 1440×900, DPR 1, locale `zh`,
   animations disabled, same route, same scroll position. Diff is computed with
   mean absolute error (MAE) and the share of pixels whose max channel delta is
   greater than 12.

## Scope

In scope: login, shell, menus, breadcrumbs, tabs, all component demo tabs,
dashboards, charts, maps, 3D pages, system pages.

Out of scope: backend/API behaviour, database schema, deployment.

## Acceptance criteria

- No route has a blank page or runtime console error in any frontend.
- Menu and tab active states match the rules above in light/dark and neutral/blue
  themes.
- For static DOM pages (login, menus, component demos, system pages):
  MAE < 1 and pixels > 12 below 0.5%.
- For canvas pages (charts, maps, 3D): same layout, labels, card geometry and
  data; canvas-internal diff may be reported separately and must be stable.
- `typecheck`, `lint`, unit tests, production build and real-backend E2E pass for
  React, Vue and Angular.

## Current state (2026-11-06)

- Component gallery and Recharts: 77 tabs per frontend, same labels/order.
- Menu parent/child active rules and theme-colored tabs implemented in
  `4177722`.
- Global component defaults (buttons, inputs, cards, alerts, menus, chips) are in
  `fb2beb8` and `9e6abb3`.
- Pixel diff on `组件/通用` is still dominated by page content/section structure,
  not component CSS.
