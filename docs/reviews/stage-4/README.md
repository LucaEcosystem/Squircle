# Stage 4 — Visual-density review record

Date: 2026-10-16. Reviewer: OpenCode (automated checks + rendered inspection).
Source: `examples/forms.html` + `examples/interactive.html` on the Stage 4
build (`squircle.css` 49,796 bytes / `squircle.min.css` 42,231 bytes).

## Captures

- `forms-mobile/tablet/laptop/desktop.png` — 360/768/1024/1440px, full
  page, validation messages revealed (empty submit before capture)
- `forms-ocean.png` — Ocean theme, 1440px, error state visible
- `interactive-mobile/tablet/laptop/desktop.png` — 360/768/1024/1440px
- `interactive-ocean.png` — Ocean theme, 1440px

## Gate checklist (§8.6 + Stage 4 §5)

- [x] Internal padding (fields, checks, menu items, dialog, popover, tabs)
- [x] Separation between labels, controls, help, errors, groups
- [x] Long labels/descriptions (radio descriptions, switch text wrap cleanly)
- [x] Multiple simultaneous errors (email + password messages coexist, each names its fix)
- [x] Long option labels (select truncates natively, zero overflow at 360px)
- [x] Dense form groups (contact fieldset, plan radios — padded rows, never cramped)
- [x] Dialogs with substantial content (notice/delete/activity, scrim + ring verified)
- [x] Menus/popovers near edges (anchored popover clamps in-viewport; menu max-width guards)
- [x] Tabs with many/long labels (quarter set scrolls horizontally at 360px, page overflow 0)
- [x] Keyboard focus visible in every state (azure ring asserted on inputs, switch track, menu/tab stops)
- [x] Narrow-screen overflow: 0 measured on both pages at 360px
- [x] Luca + Ocean consistency (error red, invalid borders, focus ring legible in both)

## Findings fixed during review

1. `[hidden]` lost to component `display` rules (`sq-field__error` flex
   overrode `hidden`) — global `[hidden] { display: none !important; }`
   in base.css; hidden is now the unbreakable hide contract.
2. `submit` never fires under native validation — `enhanceForm` focus
   and the example's message-reveal were dead code on the invalid path.
   Both moved to `invalid`-event capture; invalid-border class toggles
   with messages; documented in FORMS.md.
3. Focused invalid fields showed the accent border (specificity):
   `.sq-input--invalid:focus` keeps the error border under focus (ring
   unaffected) — asserted in-browser.
4. WebKit leaves focus on `<body>` after native Escape (no invoker
   restore) and never focuses buttons on mouse click — `openDialog`
   accepts `invoker`, declarative openers pass themselves, and a
   `close`-event listener restores focus on every engine. Verified on
   WebKit + mobile.
5. `textMuted`/Ocean-muted brightened after axe caught 4.23:1 on
   elevated cards (Stage 3 carry-over, re-verified here with axe clean
   on both new pages).

## Verdict

**PASS.** Forms and interactive behaviors feel deliberately spaced and
legible at all four widths in both themes, in resting and error/open
states. Re-run the gate for Stage 5.
