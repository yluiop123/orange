# Context checkpoint — 2026-11-06

## Goal

Three frontends (React / Vue / Angular) must stay visually aligned. React is the
content baseline. The chosen pixel-alignment route is **C**: keep each
framework's native components (`Button`, `v-btn`, `mat-button`) and change only
global/common styles; no per-page or per-button classes.

## Completed

- `7ed94f8` — Vue/Angular component gallery and Recharts now have the same 77
  tabs as React, same labels/order. All routes render; tabs scroll horizontally.
- `1faefc5` — removed extra Vue/Angular component-page headers to match React's
  page chrome.
- `fb2beb8` — global Vuetify/Material component defaults aligned with React:
  buttons (36/32/40px, 8px radius, 14px/500), inputs (36px, 6px), cards (12px).
- `6057943` — added `frontend/shared/demo.css` + `--demo-*` token mappings.
- `9e6abb3` — global alerts, menus, chips, and shared layout tokens.
- Earlier: login/tab styling `f77114c`, docs/config split `e1f3497`,
  per-stack config + Chinese backend READMEs `224c8e1`.

## Uncommitted (3 files)

- `frontend/react/src/index.css`
- `frontend/vue/src/styles/main.css`
- `frontend/angular/src/styles.scss`

Change: dark active tab pill lifted 10% (`color-mix(foreground 10%, muted)`) with
a visible border. Verified on Angular `/component/display`: clicking Badge now
shows a clearly selected pill and switches content.

## Open issue (next)

Vue: selecting a submenu does not style the parent menu. Menu styling also
differs across React/Vue/Angular.

Files:
- `frontend/vue/src/components/layout/AppSidebar.vue`
- `frontend/vue/src/components/layout/MenuTreeItem.vue`
- `frontend/angular/src/app/layout/sidebar-item.component.ts`
- `frontend/react/src/components/sidebar-menutree.tsx`

Observed:
- Angular branch active sets `background: transparent`, only text color changes
  (no visible parent state).
- React parent uses `bg-sidebar` + active foreground when a descendant path is
  active.
- Need a consistent parent-active style in all three: 32px rows, 4px gaps,
  8px radius, active background/foreground, 16px icons, 14px labels,
  submenu inset/left rule.

## Verification state

- React/Vue builds pass; Vue typecheck/lint pass.
- Angular last background build exited `134` (likely OOM from concurrent builds);
  rerun `npm run build && npm run lint && npm test`.
- Real E2E passed for React/Vue/Angular before the last CSS tweak; rerun after
  menu fixes.
- Dev servers running: 5173, 5174, 4200; FastAPI 8080; PostgreSQL container
  `orange-test-pg` on 55432.

## Next steps

1. Fix parent-menu active style and unify menu CSS across three apps.
2. Rerun builds/lint/tests + real E2E.
3. Commit the dark-tab + menu changes.
4. Continue pixel work on `组件/通用`: page sections still differ in structure
   (React plain sections vs Vue/Angular panel cards); global CSS alone cannot
   close that gap.
