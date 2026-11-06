# 03 — Pixel-align the 组件/通用 sample page

Status: ready-for-human
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

## Result (2026-11-06)

The page structure now follows React for all four tabs. Button, FloatButton,
Affix and Typography use the shared layout primitives; panel cards and
subtitles were removed. The parity tool (`scripts/e2e/parity.mjs`) reports both
the full viewport and a content crop (page area below the header and right of
the sidebar).

Representative content-crop results for the Button tab:

| Theme / palette | Vue vs React MAE | Angular vs React MAE |
| --- | --- | --- |
| dark / neutral | 3.03 | 1.62 |
| dark / blue | 5.81 | 5.11 |
| light / neutral | 3.13 | 1.69 |
| light / blue | 2.09 | 1.23 |

The MAE target of < 1 and > 12 share < 0.5% is not met. The remaining diff is
sub-pixel text rendering and 1–2px component-library button metrics; the diff
images show glyph outlines rather than layout or color errors. Shell chrome
(sidebar icons, header controls) is excluded from the content crop but still
appears in the full-viewport number.

All four tabs render without console errors. Typecheck, lint, unit tests,
production builds and real-backend E2E pass for React, Vue and Angular.

## Remaining

- Decide whether to relax the numeric threshold to match what three native
  component libraries can realistically produce, or invest in per-library text
  and button metric overrides.
- Shell chrome (sidebar icon glyphs, header controls) is outside this ticket's
  content crop and is tracked by the login/shell parity work.
