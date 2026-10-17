# Stage 3 — Visual-density review record

Date: 2026-10-16. Reviewer: OpenCode (automated checks + rendered inspection).
Source: `examples/components.html` on the Stage 3 build (`squircle.css`
39,144 bytes / `squircle.min.css` 32,971 bytes).

## Captures

- `components-mobile.png` — 360px, full page
- `components-tablet.png` — 768px, full page
- `components-laptop.png` — 1024px, full page
- `components-desktop.png` — 1440px, full page
- `components-ocean.png` — Ocean theme, 1440px (precedence check: primary
  fill stays Luca gold per CONTRACT.md §4 while surfaces re-skin)

## Gate checklist (§8.6 + Stage 3 §9)

- [x] Internal padding (buttons, panels, cards, tiles, form-adjacent rows)
- [x] Separation between neighboring controls (clusters wrap with gaps)
- [x] Typography and line height (fluid display, 1.65 body, code chips inline)
- [x] Heading-to-content spacing (arrival space above, clean handoff below)
- [x] Alignment and visual hierarchy (sections → panels → content)
- [x] Long labels wrap (block button wraps to two centered lines, zero overflow)
- [x] Mobile behavior (stacks, full-width-friendly rows, zero x-overflow measured)
- [x] Luca and Ocean consistency (both themes calm; accent voices distinct)
- [x] No unintended overflow or clipping (360px measured: 0)
- [x] States reviewed: default, hover (lift verified in-browser), focus ring
      (azure, captured Stage 1 + asserted here), active, disabled, loading
      (spinner + busy label), visited, aria-current, stretched-link cover

## Findings fixed during review

1. Long-label button overflowed 1101px at 360px: `white-space: nowrap`
   survived on `.sq-button` from the Stage 1 preview. Removed (labels wrap,
   centered); long-label wrapping is now an asserted behavior.
2. axe `color-contrast` on muted text over elevated cards (4.23:1):
   brightened `--sq-color-text-muted` to `#a3aec2` (≥4.62 on every
   surface) and pinned muted-on-elevated in token tests, theme
   validation, and axe. Ocean muted had the same latent defect (4.45) —
   fixed to `#8fb3ba` in the shared `examples/ocean.css`.
3. Ocean CSS was triplicated across examples — extracted to shared
   `examples/ocean.css`, still pinned by `theme.test.ts`.
4. Components spec initially expected the Ocean accent fill on primary
   buttons — wrong per the documented precedence (variant default wins
   for the fill). Test now asserts the contract correctly.

## Verdict

**PASS.** Every foundational component and state feels deliberately
spaced at all four widths in both themes. Re-run the gate for Stages 4–5.
