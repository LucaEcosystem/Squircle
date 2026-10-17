# Stage 1 — Visual-density review record

Date: 2026-10-16. Reviewer: OpenCode (automated checks + rendered inspection).
Source: `examples/foundation.html` on the Stage 1 build (`squircle.css`
14,943 bytes / `squircle.min.css` 13,055 bytes).

## Captures

- `foundation-desktop.png` — 1440px, full page
- `foundation-tablet.png` — 768px, full page
- `foundation-mobile.png` — 360px, full page
- `foundation-state-focus.png` — keyboard focus ring on a primary control
- `foundation-state-hover.png` — hover state on a secondary control

## Gate checklist (§8.6)

- [x] Sufficient internal padding (panels, cards, form, dialog n/a Stage 1)
- [x] Separation between neighboring elements (clusters, stacks, fields)
- [x] No crowded headings, paragraphs, forms, or navigation
- [x] No excessive information density
- [x] Consistent spacing and alignment
- [x] Content areas not unnecessarily narrow (68ch measure, 3 containers)
- [x] Clear separation between unrelated sections (section rhythm)
- [x] Responsive layouts reflow without collisions (360px: zero x-overflow,
      measured; clusters wrap; grid collapses 3 → 2 → 1)
- [x] No accidental unbalanced empty space

## Findings fixed during review

1. Fluid type tokens (`--sq-font-fluid-*`) resolved empty: `flatten()`
   did not split letter→digit boundaries (`fluid2xl` vs `fluid-2xl`),
   collapsing all display headings to body size. Fixed in
   `packages/tokens/src/flatten.ts`; pinned by a regression test
   (`tokens.test.ts` → "emits the exact variable names").
2. Mobile buttons appeared full-width in a downscaled capture; measured
   in-browser (188.5px in a 350px cluster) — content-width, no defect.
3. WebKit tabs to form controls before links (platform behavior, not a
   framework defect); the focus-state test is tag-agnostic and passes on
   all engines.

## Verdict

**PASS.** Every first-party surface and state in Stage 1 scope feels
deliberately spaced and comfortable at all three widths. The gate must be
re-run for every new component and template in Stages 2–5.
