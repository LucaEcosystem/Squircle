# Changelog

All notable changes to Squircle are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] - 2026-10-17

### Initial stable release

**Public package — `@luca-ecosystem/squircle`**

- CSS-first UI framework with squircle geometry, generous whitespace, and the
  Luca Ecosystem Theme as the default.
- No build step required; no TypeScript required by consumers (`.d.ts` ships
  but is optional).
- Complete readable (`/css`) and minified (`/css/min`) stylesheets, plus
  token-only (`/css/tokens`) and font-only (`/css/fonts`) entry points.
- Browser runtime (`/browser` classic `window.Squircle`, works from `file://`,
  and ESM default export) with 25 named exports covering theme switching,
  dialogs, menus, popovers, tooltips, tabs, toasts, and form validation.
- 44 original hand-drawn icons: SVG sprite, individual per-icon files, and a
  JSON manifest (`/icons/*`).
- Zero runtime dependencies; MIT licensed.
- `sq-trim` conservative unused-CSS removal with safelist, dynamic-class
  hints, and the complete stylesheet always available as a fallback.

**Design system**

- Design tokens across three tiers: primitive → semantic → component, emitted
  as CSS custom properties.
- Squircle-inspired corner geometry with generous-radii fallbacks for
  browsers without `corner-shape`.
- Generous whitespace enforced by section-rhythm tokens.

**Accessibility**

- WCAG 2.2 AA target.
- Always-visible focus ring; honors `prefers-reduced-motion`.

**Browser baseline**

- Evergreen Chrome, Edge, Firefox; Safari 16.4+; Android Chrome; iOS Safari
  16.4+.

### Notes

- Framework adapters (React, Vue, …) are intentionally deferred to **1.1**.
- Internal workspace packages (`@squircle/*`) are versioned in lockstep with
  the public package; only `@luca-ecosystem/squircle` is published to npm.

[1.0.0]: https://github.com/LucaEcosystem/Squircle/releases/tag/v1.0.0
