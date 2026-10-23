# Squircle

A CSS-first web development framework with squircle geometry, generous
whitespace, and the **Luca Ecosystem Theme** baked in.

**No build step required. No TypeScript required.** MIT licensed.

Stable **1.0** release.

## What is Squircle?

Squircle gives you a cohesive system for building modern websites through
plain HTML, CSS, and JavaScript:

- A complete, readable + minified stylesheet you can link and stop thinking about.
- A framework-independent browser runtime (`window.Squircle`) for theme
  switching and interactive components — dialogs, menus, popovers,
  tooltips, tabs, toasts, and form validation.
- A design-token system (`primitive → semantic → component`) so themes
  retune one component without touching the rest of the system.
- 44 original, hand-drawn icons (SVG sprite, individual files, and a
  manifest).
- Production unused-CSS removal via `sq-trim`, with the complete stylesheet
  always available as a fallback.

Plain browser usage and npm usage are both first-class. Framework adapters
(React, Vue, …) are intentionally deferred to **1.1** — the public
experience is HTML/CSS/JS.

## Features

| Area              | Highlights                                                                                                                                                                                |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Geometry**      | Squircle-inspired corner treatment with `corner-shape` enhancement and generous radii fallback                                                                                            |
| **Whitespace**    | Section rhythm token (`clamp(4rem, 8vw, 7rem)`); interfaces never feel cramped                                                                                                            |
| **Themes**        | Luca Ecosystem Theme is the default; ship your own by overriding semantic tokens                                                                                                          |
| **Components**    | Buttons, inputs, forms, cards, panels, dialogs, menus, popovers, tooltips, tabs, toasts, alerts, data tables, media, combobox, stepper, upload, chips, banner, carousel, rating, timeline |
| **Utilities**     | Layout, spacing, typography, color, geometry, responsive + container-query primitives                                                                                                     |
| **Icons**         | 44 original glyphs, `currentColor`-driven, sized by context                                                                                                                               |
| **Accessibility** | WCAG 2.2 AA target; always-visible focus; honors `prefers-reduced-motion`                                                                                                                 |

## Quick start (plain HTML, no build)

```html
<!doctype html>
<html lang="en" data-sq-theme="luca">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link
      rel="stylesheet"
      href="./node_modules/@luca-ecosystem/squircle/dist/squircle.min.css"
    />
  </head>
  <body>
    <main class="sq-section">
      <div class="sq-container sq-stack">
        <h1>It works.</h1>
        <p class="sq-lead">Complete stylesheet, zero configuration.</p>
        <div class="sq-cluster">
          <button class="sq-button sq-button--primary" type="button">
            Continue
          </button>
        </div>
      </div>
    </main>
    <script src="./node_modules/@luca-ecosystem/squircle/dist/squircle-runtime.js"></script>
    <script>
      Squircle.initTheme();
      Squircle.init();
    </script>
  </body>
</html>
```

## Installation

```bash
npm install @luca-ecosystem/squircle
```

## Three usage paths, one design system

| Path              | What you load                                                                                                                   | When                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **Complete CSS**  | `@luca-ecosystem/squircle/css` (readable) or `/css/min` (production)                                                            | Simple sites. Link and stop thinking.             |
| **Runtime**       | `@luca-ecosystem/squircle/browser` (classic `window.Squircle`, works from `file://`) or `@luca-ecosystem/squircle` (ES modules) | Theme switching + interactive components          |
| **Optimized CSS** | Run `sq-trim` over your sources                                                                                                 | Production builds that pay only for what they use |

```js
// Bundler / Node ESM (types included, TypeScript optional)
import { setTheme, notify, openDialog } from "@luca-ecosystem/squircle";
import "@luca-ecosystem/squircle/css"; // or "@luca-ecosystem/squircle/css/min"
```

The runtime also exposes these named exports:
`setTheme`, `getTheme`, `resetTheme`, `initTheme`, `init`, `initDialogs`,
`openDialog`, `closeDialog`, `isDialogOpen`, `initMenus`, `initPopovers`,
`positionPopover`, `initTooltips`, `initTabs`, `createTabs`, `createMenu`,
`initComboboxes`, `initCarousels`, `initUploads`,
`notify`, `dismissAll`, `enhanceForm`, `setFieldError`, `clearFieldError`,
`prefersReducedMotion`, `onReducedMotionChange`, `onThemeChange`,
`focusableChildren`.

## Theming

The Luca Ecosystem Theme is the default (`data-sq-theme="luca"`). Switch at
runtime or ship a custom theme by overriding semantic tokens — components
reference semantic tokens, never raw hex, so one override retunes a whole
surface:

```js
Squircle.setTheme("ocean"); // registered themes
Squircle.resetTheme(); // back to Luca, the default
```

## Browser support

Evergreen Chrome, Edge, Firefox, Safari **16.4+**, Android Chrome, iOS
Safari 16.4+. Container queries, `:has()`, and `color-mix()` are safe to
use; squircle geometry (`corner-shape`) enhances where supported and falls
back to generous radii elsewhere.

## Repository layout

| Package                    | Purpose                                                                       |
| -------------------------- | ----------------------------------------------------------------------------- |
| `@luca-ecosystem/squircle` | **Public** npm package — assembled `dist/` (CSS + runtime + icons + types)    |
| `@squircle/css`            | CSS foundation, geometry, components, and utilities                           |
| `@squircle/runtime`        | Framework-independent browser runtime (IIFE + ESM)                            |
| `@squircle/tokens`         | Design-token source of truth; emits CSS custom properties                     |
| `@squircle/themes`         | Theme registry, validation, and the Luca Ecosystem Theme                      |
| `@squircle/icons`          | 44 original SVG icons (sprite, individual files, manifest)                    |
| `@squircle/build-tools`    | `sq-trim` production unused-CSS removal                                       |
| `@luca-ecosystem/sq-trim`  | **Public** npm handle for the `sq-trim` CLI (executes the build-tools engine) |
| `docs-site/`               | Generated component reference site (`pnpm site:build`)                        |
| `@squircle/components`     | Component HTML contracts and documentation                                    |

The `@squircle/*` internal packages are workspace-only; the public surface
is `@luca-ecosystem/squircle`.

## Documentation

- Component contracts: [`packages/components/*.md`](packages/components/)
- Utilities: [`packages/css/UTILITIES.md`](packages/css/UTILITIES.md)
- Icons: [`packages/icons/ICONS.md`](packages/icons/ICONS.md)
- Runtime API: [`packages/runtime/API.md`](packages/runtime/API.md)
- Working examples: [`examples/`](examples/) (foundation, components, forms,
  utilities, theming, interactive, and five production templates)

## License

MIT — see [LICENSE](LICENSE).
