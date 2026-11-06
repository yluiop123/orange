# 03 — Pixel-align the 组件/通用 sample page

Status: ready-for-agent
Type: task
Blocked by: none

## Scope

Route: `/component/general` (Button, FloatButton, Affix, Typography).

Use framework-native components and the shared layout primitives only. Do not
add per-button classes.

## Work

1. Compare React/Vue/Angular at 1440×900, DPR 1, zh, dark and light.
2. Align page padding, section spacing, title typography and row gaps via
   `frontend/shared/demo.css` and global styles.
3. Align the visible default Button tab first; then FloatButton/Affix/Typography.
4. Re-run the screenshot diff after each tab.

## Acceptance

- Static DOM diff MAE < 1 and pixels > 12 < 0.5% for the Button tab.
- All four tabs render without console errors.
- Builds, lint, tests and real E2E pass.
