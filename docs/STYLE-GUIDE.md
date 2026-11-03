# Visual Consistency Guide

React is the reference. Angular and Vue must look like the same product at a glance: same accent color, spacing rhythm, surfaces, typography and shell dimensions. Pixel-identical output is not required.

## Tokens

| Token | Value | Use |
| --- | --- | --- |
| Primary | `#f97316` (orange 500) | Buttons, active menu, focus ring, links |
| Primary foreground | `#fff7ed` | Text/icons on primary |
| Background | `#ffffff` / dark `#18181b` | Page |
| Card | `#ffffff` / dark `#27272a` | Panels, dialogs, tables |
| Foreground | `#18181b` / dark `#fafafa` | Text |
| Muted foreground | `#71717a` | Secondary text |
| Muted surface | `#f4f4f5` / dark `#27272a` | Table header, hover |
| Border | `#e4e4e7` / dark `#3f3f46` | Cards, inputs, dividers |
| Destructive | `#ef4444` | Delete, errors |
| Radius | `0.65rem` (about 10px) | Cards, buttons, inputs, dialogs |
| Sidebar width | `16rem` (collapsed `3rem`, mobile `18rem`) | Shell |
| Header height | `3rem` | Top bar |
| Page padding | `0.75rem` | Page content |
| Content gap | `1rem` | Between cards/sections |
| Font | system UI stack | All text |

Tailwind/shadcn use OKLCH. Angular Material and Vuetify can use the hex equivalents above; the visual difference is small.

## Shell

- Sidebar on the left, 16rem, light surface (`#fafafa` / `#18181b` in dark), 1px right border.
- Brand/logo at the top; menu group label "菜单"; footer with the user.
- Top bar: 3rem, page title/breadcrumb on the left, language/theme/actions on the right.
- Active menu: orange-tinted background with primary text; hover: muted surface.
- Content: padded 0.75rem, cards separated by 1rem.

## Components

- Buttons: 2rem height, 0.65rem radius; primary is orange, secondary is outline.
- Inputs/selects: 2rem height, border, 0.65rem radius; focus ring orange.
- Cards: white/dark surface, 1px border, 0.65rem radius, no heavy shadow.
- Tables: muted header row, 1px row dividers, 2.5rem rows, right-aligned pagination.
- Dialogs: 0.65rem radius, title + body + footer actions, destructive action on the right.
- Status: green `#22c55e` for enabled, muted for disabled.
- Charts keep their library defaults but use the orange palette for the first series.

## Acceptance

1. Screenshot the same page (`/system/user`, `/dashboard/normal`) in all three apps at 1440×900.
2. The primary color, sidebar width, header height, page padding and card radius match.
3. No default Material/Vuetify purple or blue remains.
4. Dark mode mirrors the tokens above.
5. Fonts fall back to the system stack; no layout shift from a missing web font.
