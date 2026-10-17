# Squircle Icons

44 original glyphs, drawn for Squircle (MIT, this repository — no
third-party paths, no redistribution constraints). 24×24 grid, 2px
stroke, round caps and joins, `currentColor` throughout: icons follow
text color in every theme automatically, and generic icons contain no
brand colors.

## The set (44)

- **Navigation (11):** menu, close, chevron-down/up/left/right,
  arrow-left/right/up-right, home, external-link
- **Actions (17):** plus, minus, check, search, download, upload,
  trash, edit, copy, eye, eye-off, filter, refresh, send, more,
  sliders, lock
- **Feedback (6):** info, check-circle, alert-triangle, x-circle,
  help-circle, bell
- **Objects (10):** user, users, calendar, clock, folder, file-text,
  image, mail, globe, tag

## Usage

Inline (full control, works everywhere including `file://`):

```html
<span class="sq-alert__icon" aria-hidden="true">
  <svg
    class="sq-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    focusable="false"
  >
    <path d="M12 4 2.5 20h19L12 4Z" />
    <path d="M12 10v4" />
  </svg>
</span>
```

Sprite (one request, selective use — reference only what you need):

```html
<svg class="sq-icon" aria-hidden="true" focusable="false">
  <use href="/icons/squircle-icons.svg#sq-i-menu"></use>
</svg>
```

Per-icon files live in `dist/icons/<name>.svg`; the sprite in
`dist/squircle-icons.svg`; `dist/icons.json` manifests names, symbols,
and files. Sources (`src/original/`) are the editable truth; `dist/`
is generated and gitignored (separation enforced by
`check-separation.mjs` + `icons.test.ts`).

## Accessibility

- **Decorative** (buttons/badges/alerts with text labels):
  `aria-hidden="true"` + `focusable="false"` on the SVG. The label
  announces; the icon stays silent.
- **Meaningful alone** (icon-only buttons): the CONTROL carries
  `aria-label` ("Close dialog"); the SVG stays `aria-hidden`.
- **Standalone meaning** (a status icon with no adjacent text): inline
  SVG with `<title>` + `role="img"`, or visible text beside it
  (preferred — text is always clearer than glyphs).
- `focusable="false"` keeps IE-legacy and SVG-focus quirks away from
  the tab order in every engine.
- Sizes: `.sq-icon` (1.25em, default), `--small` (1em),
  `--large` (1.75em). Icons scale with text (em) so zoom reflows
  cleanly; tested at 16/20/28px in both themes.

## Customization

`color` recolors (currentColor); `width`/`height` resize. Stroke width
is a source-level decision (2px grid) — do not restyle per instance.
New glyphs: add a source SVG following the conventions, rebuild,
update this list. The build validates viewBox, kebab names, and the
no-hardcoded-color rule — violations fail loudly.

## Tested limitations

- 44 glyphs by design; requests belong in the 1.1 backlog, not in
  scope creep. No social-brand logos (trademark minefield, documented
  exclusion).
- External-sprite `<use>` requires same-origin or CORS-enabled hosting
  (platform rule); inline for `file://` or cross-origin.
