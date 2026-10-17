# Squircle

A CSS-first UI framework with squircle geometry, generous whitespace,
and the Luca Ecosystem Theme baked in. **No build step required. No
TypeScript required.** MIT licensed.

## Install

```bash
npm install @luca-ecosystem/squircle
```

## Use in one minute (plain HTML, no build)

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

## Three usage paths, one design system

| Path              | What you load                                                                                                            | When                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| **Complete CSS**  | `squircle/dist/squircle.css` (readable) or `squircle.min.css` (production)                                               | Simple sites. Link and stop thinking.                                          |
| **Runtime**       | `squircle-runtime.js` (classic `window.Squircle`, works from `file://`) or `squircle-runtime.mjs` (ES modules, bundlers) | Theme switching + dialogs, menus, popovers, tooltips, tabs, toasts, validation |
| **Optimized CSS** | Run `sq-trim`-style trimming over your sources (see below)                                                               | Production builds that pay only for what they use                              |

```js
// Bundler / Node ESM (types included, TypeScript optional)
import { setTheme, notify, openDialog } from "@luca-ecosystem/squircle";
import "@luca-ecosystem/squircle/css"; // or "/css/min"
```

```js
// Icons: sprite (one request) or single files
// <svg><use href="./node_modules/@luca-ecosystem/squircle/dist/squircle-icons.svg#sq-i-menu"/></svg>
import manifest from "squircle/icons/manifest";
import menuUrl from "squircle/icons/menu.svg";
```

## Themes

The defaults **are** the Luca Ecosystem Theme (dark-first, no
light-mode toggle). Custom themes override semantic tokens:

```css
[data-sq-theme="ocean"] {
  --sq-color-background: #06222e;
  /* …only the tokens you change */
}
```

```js
Squircle.setTheme("ocean"); // persists; Squircle.resetTheme() restores Luca
```

Theme CSS is yours to author — components and utilities follow any
theme that keeps the token contract (see the contrast rules in the
repository documentation).

## Fonts and offline use

The complete stylesheet imports Manrope + DM Sans from Google Fonts
with `display=swap` and system fallbacks. Fully offline:

1. Self-host the woff2 files (see `squircle/css/fonts` for the
   reference `@font-face` source).
2. Build pages that never request the CDN import — text renders in
   fallback stacks immediately either way.

The classic runtime + complete CSS work from `file://` with zero
server. ES modules require HTTP (platform CORS rule, not a Squircle
limitation) — use the classic script for direct-file pages.

## Production trimming

Ship the complete bundle, or trim provably-unused styles. The
repository's `sq-trim` tool (conservative by design: keeps used,
safelisted, structural, token, theme, keyframe, and state-variant
styles) documents safelists, dynamic-class handling, and diagnostics.
Dynamic classes (`sq-badge--${tone}`) need explicit safelist entries —
the tool reports them instead of guessing.

## Browser support

Evergreen Chrome, Edge, Firefox, Safari **16.4+**, Android Chrome, iOS
Safari 16.4+. Container queries, `:has()`, and `color-mix()` are safe
to use; true squircles (`corner-shape`) enhance where supported and
fall back to generous radii elsewhere.

## Requirements

None. Zero runtime dependencies, zero peer dependencies, no
TypeScript needed (declarations ship for those who want them).

## License

MIT — see `dist/LICENSE`.
