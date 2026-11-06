# 01 — Menu and tab active-state parity

Status: resolved
Type: task

## Scope

- Parent menu active: background unchanged, text theme color + weight 500.
- Child menu active: filled background, white text in dark / foreground in light.
- Selected tab label: theme color in all three.
- Dark active pill: lifted 10% with a visible border.
- Long tab strips scroll horizontally.

## Result

Implemented in `4177722`. Verified with blue and neutral themes in light/dark;
React/Vue/Angular builds, tests and real E2E pass.

## Acceptance

- [x] Parent background does not change.
- [x] Parent text changes with the theme color.
- [x] Child selected text is white in dark mode.
- [x] Selected tab label uses the theme color.
- [x] No build/test/E2E regressions.
