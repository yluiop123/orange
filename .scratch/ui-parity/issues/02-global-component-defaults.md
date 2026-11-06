# 02 — Global component default parity

Status: resolved
Type: task

## Scope

Align framework component defaults without per-page classes:

- Buttons: 36px default, 32px small, 40px large; 8px radius; 14px/500.
- Inputs: 36px, 6px radius, 14px.
- Cards: 12px radius.
- Alerts: 8px radius, 12×16 padding, 14px.
- Menus: 6px radius, 4px padding.
- Chips/badges: 20px, 12px text, pill.

## Result

Implemented in `fb2beb8` and `9e6abb3`; defaults are scoped where necessary so
header/system compact variants are not forced.

## Acceptance

- [x] Vue/Angular defaults match React metrics.
- [x] No page-specific classes added.
- [x] Builds and E2E pass.
