# Frontend Documentation

Design and operations documentation for the three frontend implementations. The
product and API contract live in [`../../docs/`](../../docs/README.md); this
directory only covers code that exists under `frontend/`.

## Documents

| Document | Content |
| --- | --- |
| [GETTING-STARTED.md](./GETTING-STARTED.md) | Prerequisites, install, run and test commands |
| [CONFIGURATION.md](./CONFIGURATION.md) | Environment files, generated config, mock vs real mode |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Shell, routing, state, i18n, theme and parity rules |
| [STYLE-GUIDE.md](./STYLE-GUIDE.md) | Colour tokens, spacing, typography and component rules |

## The three apps

| App | Stack | Port | Entry |
| --- | --- | --- | --- |
| React | React 19 · Vite · TypeScript · Tailwind · shadcn/Base UI · Zustand | 5173 | [`../react`](../react/README.md) |
| Vue | Vue 3.5 · Vite · TypeScript · Vuetify 3 · Pinia | 5174 | [`../vue`](../vue/README.md) |
| Angular | Angular 21 · Angular Material · signals | 4200 | [`../angular`](../angular/README.md) |

React is the reference implementation for page content and interaction. Vue and
Angular must match its routes, menu tree, icons, theme tokens, tab styling and
page structure. The visual rules are in [STYLE-GUIDE.md](./STYLE-GUIDE.md).

## Quick commands

```bash
# React
cd frontend/react && pnpm install && pnpm dev

# Vue
cd frontend/vue && pnpm install && pnpm dev

# Angular
cd frontend/angular && npm install && npm start
```

All three dev servers proxy `/api` to the backend, so the refresh cookie stays
same-origin. See [CONFIGURATION.md](./CONFIGURATION.md) for the target and the
mock switch.
