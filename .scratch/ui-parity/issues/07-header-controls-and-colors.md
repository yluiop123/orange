# 07 — Header controls, multi-language, and theme colors

Status: resolved
Type: task
Blocked by: none

## Scope

1. Make the dark/light toggle and language switch use the same visual pattern
   on the login page and the shell header in React, Vue and Angular.
2. Make the language menu data-driven so adding a locale only requires a
   dictionary entry and a registry entry; persist the choice and set
   `<html lang>` from the locale.
3. Fix Angular's color-picker default swatch so it stays neutral when another
   palette is active.
4. Verify component colors in dark and light mode, including the neutral and
   blue palettes.

## Result

- Added a shared locale switcher and theme toggle per framework:
  - React: `components/locale-switcher.tsx`, `components/theme-toggle.tsx`.
  - Vue: `components/layout/LocaleSwitcher.vue`, `ThemeToggle.vue`.
  - Angular: `shared/locale-switcher.component.ts`,
    `shared/theme-toggle.component.ts`.
- Login and shell now render the same controls. The language trigger shows the
  current locale with a translate icon and opens a menu built from
  `SUPPORTED_LOCALES` / `I18nService.languages`. Adding a locale is a registry
  plus dictionary change, not a template change.
- `document.documentElement.lang` now follows the selected locale through a
  per-locale `htmlLang` mapping instead of a zh/en conditional.
- Angular's default color swatch uses `swatchColor()`, which returns the
  neutral foreground for `default` and `item.hex` for other palettes. Selecting
  blue no longer recolors the default swatch.
- Demo card surfaces follow React per palette: neutral dark uses the page
  background, colored dark palettes use the raised surface, light uses white.
- `scripts/e2e/check-controls.mjs` verifies the login/header language and theme
  controls, locale switching, and the Angular default swatch in a real browser.
  `scripts/e2e/parity.mjs` verifies the component page in dark/light and
  neutral/blue.

## Verification

- `typecheck`, `lint`, unit tests and production builds pass for React, Vue and
  Angular.
- Real-backend E2E: React 14/14, Vue 15/15, Angular 15/15.
- `check-controls.mjs`: language switches zh→en→zh on login and shell in all
  three; theme toggles light/dark; Angular default swatch stays neutral in
  dark and light and after selecting blue.
- Component color matrix run for all four general tabs in dark/light and
  neutral/blue; no blank pages or console errors.

## Notes

- `frontend/shared/demo.css` gained page-level layout helpers for the four
  general tabs. They compose framework-native controls; they do not define
  alternative button or card components. The original spec listed the initial
  five primitives, so this is a deliberate expansion of the shared layout
  vocabulary.
- Semantic demo button classes (`demo-blue`, `demo-secondary`, `demo-success`,
  `demo-danger`, `demo-destructive-tonal`, shape helpers) live in each
  framework's global stylesheet, not in a page-scoped stylesheet. Angular
  Material has no hex-color input, so a shared global class is the only
  framework-native route.
- The Affix sliders now drive the sticky top header and bottom footer offsets;
  the footer sticks inside the scroll frame instead of covering the viewport.
- The locale registries are the single list the menus render from. React/Vue
  derive their locale type from the registry; Angular derives `Locale` from
  `DICTIONARIES`, so adding a locale is a dictionary + languages entry.

## Acceptance

- [x] Login and shell language controls match.
- [x] Login and shell theme controls match.
- [x] Locale switching is data-driven and persists.
- [x] Angular default swatch stays neutral.
- [x] Component colors checked in dark and light.
- [x] Builds, lint, tests and real E2E pass.
