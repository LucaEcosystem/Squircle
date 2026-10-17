# sq-trim — conservative unused-CSS removal

Ships the complete stylesheet by default; trims what a project provably
does not use. Conservative means: **when in doubt, keep.**

## Two build options (both official)

- **Complete CSS** — `packages/css/dist/squircle.css` (+ `.min.css`).
  Simple projects link this and stop thinking. (~33 KB readable,
  ~28 KB minified at Stage 2.)
- **Optimized CSS** — run `sq-trim` over your sources. Fixture results:
  blog 32,959 → 16,482 bytes (−50%), dashboard 32,959 → 14,542 (−56%).

## Usage

```bash
sq-trim --css dist/squircle.css --sources "site/**/*.html" \
  --sources "site/**/*.js" --out dist/squircle.trimmed.css \
  --report dist/trim-report.json
```

Or a config file (`--config squircle.config.json`):

```json
{
  "css": "packages/css/dist/squircle.css",
  "sources": ["site/**/*.{html,js}"],
  "out": "site/squircle.trimmed.css",
  "report": "site/trim-report.json",
  "safelist": [
    "sq-bg-success",
    { "prefix": "sq-md-" },
    { "pattern": "^sq-cols-" }
  ]
}
```

Glob subset: `*`, `**`, `?`, `{a,b}`. `node_modules` and `dist` are
never scanned.

## What is kept, unconditionally

`:root` token variables (utilities resolve them at runtime — dropping
an "unused" variable breaks dynamic themes), all `[data-sq-theme]`
blocks, element/base styles, `@font-face`, `@keyframes`, `@import`,
unknown at-rules, and any rule whose state variant shares a kept base
class (`.sq-panel:hover` survives with `sq-panel`).

## What is scanned

`class="…"` attributes in HTML/Vue/Svelte/Astro, string literals and
`classList` calls in JS/TS/JSX, **including inline `<script>` bodies**.
`data-sq-theme="…"` names are collected for the report.

## Dynamic classes (read this before shipping trimmed CSS)

The scanner resolves literals only. These patterns produce
**diagnostics, not kept styles**:

- `` `sq-button--${variant}` `` — safelist each variant, or
  `{ "prefix": "sq-button--" }`.
- `"sq-bg-" + state` — safelist each fill explicitly (preferred over
  broad prefixes: `"sq-bg-"` would keep every fill).
- Framework `:class` bindings and ternaries with literals
  (`isOpen ? "sq-hidden" : ""`) ARE detected — the literal is there.

If a report lists `dynamicHints`, add safelist entries and re-run
until it is empty. A trimmed build with unaddressed hints is not
production-ready.

## Diagnostics reference

| Report field       | Meaning                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `unknownClasses`   | Used but not defined — almost always a typo (this caught a real `sq-lg-grid-cols-4` gap during Stage 2, which extended the documented matrix instead). |
| `safelistMisses`   | Safelist entries matching nothing — typo or stale entry.                                                                                               |
| `dynamicHints`     | Unresolvable patterns with file locations — safelist required.                                                                                         |
| `themesReferenced` | `data-sq-theme` names seen (theme CSS is always preserved).                                                                                            |

Exit code 2 refuses to write output with zero `sq-*` rules (sources
missed the project). Diagnostics inform; they never fail the build —
except that refusal, which guards against shipping an empty stylesheet.
