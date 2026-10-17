# Stage 5 — Visual-density review record

Date: 2026-10-16. Reviewer: OpenCode (automated checks + rendered inspection).
Source: `examples/templates/*.html` on the Stage 5 build (`squircle.css`
69,960 bytes / `squircle.min.css` 59,491 bytes).

## Captures (25)

Per template (landing, article, dashboard, settings, docs):
`template-<name>-mobile/tablet/laptop/desktop.png` (360/768/1024/1440,
Luca) + `template-<name>-ocean.png` (1440, Ocean).

## Gate checklist (§8.6 + Stage 5 §7)

- [x] Generous section spacing (section token; pages scroll naturally)
- [x] Readable line lengths (measure caps; narrow containers for prose)
- [x] Component padding (panels, cards, fields, menu items, table cells)
- [x] Clear hierarchy (hero → sections; sidebar + content; tabs + panels)
- [x] Zero horizontal overflow at 360px on all five templates (measured)
- [x] Long content: table scrolls, tab labels scroll, select truncates,
      disclosure wraps, metric deltas pair arrows with words
- [x] Interactive states: mobile nav toggle, disclosure open/closed,
      menu open, dialog open, toast visible, tabs selected — all calm
- [x] Ocean consistency: all five templates re-skin from one attribute;
      error/info/success tones legible; focus ring visible
- [x] Icons: glyphs render at 1em/1.25em in both themes, currentColor

## Findings fixed during review

1. Closed `<details>` nav hid links from AT while CSS showed them at
   wide viewports — `open` is now load-bearing on `.sq-nav-menu`
   (documented in NAVIGATION.md); wide-viewport test proves links are
   found by role.
2. Test wrongly expected Escape to collapse `<details>` (native
   behavior: it doesn't) — corrected to toggle-collapse with the
   rationale recorded in-test.
3. Accessibility locator resolved to CTA copy ("Read the docs first")
   instead of the nav link — scoped to the Primary navigation landmark.

## Verdict

**PASS.** All five templates feel deliberately spaced at all four
widths in both themes, in resting and interactive states.
