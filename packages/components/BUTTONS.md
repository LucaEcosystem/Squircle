# Buttons

Purpose: trigger actions. Semantic HTML is `<button>` with an explicit
`type` (`button`, `submit`, `reset`). An `<a class="sq-button">` is
navigation wearing a button's surface — same look, anchor semantics.

## Usage

```html
<button class="sq-button sq-button--primary" type="button">Continue</button>
<button class="sq-button sq-button--secondary" type="submit">Save draft</button>
<button class="sq-button sq-button--tertiary" type="button">Not now</button>
<button class="sq-button sq-button--danger" type="button">
  Delete project
</button>
```

## Variants and sizes

| Class                  | Use                                                                             |
| ---------------------- | ------------------------------------------------------------------------------- |
| `sq-button--primary`   | The one main action per view. Gold fill, ink text.                              |
| `sq-button--secondary` | Alternative actions. Elevated surface, strong border.                           |
| `sq-button--tertiary`  | Quiet actions (cancel, dismiss). Transparent until hover.                       |
| `sq-button--danger`    | Destructive actions. Error fill + contrast ink. Never the only cue (see below). |
| `sq-button--small`     | Dense rows only (40px height). Default is `md` (48px).                          |
| `sq-button--large`     | Hero and stretched-touch moments (56px).                                        |
| `sq-button--block`     | Full-width (forms, mobile sheets).                                              |
| `sq-button--icon-only` | Square button for an icon + `aria-label`.                                       |

## Labels

Keep labels short (1–3 words) — buttons never clip, long labels wrap and
stay centered, but a paragraph in a button is a design problem, not a
feature. Never communicate meaning through color alone: pair every
color cue with an explicit verb.

## Icons

```html
<button class="sq-button sq-button--secondary" type="button">
  <span class="sq-button__icon" aria-hidden="true">
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      focusable="false"
    >
      <path d="M12 5v14M5 12h14" stroke-linecap="round" />
    </svg>
  </span>
  New project
</button>
<button
  class="sq-button sq-button--secondary sq-button--icon-only"
  type="button"
  aria-label="Close dialog"
>
  <span class="sq-button__icon" aria-hidden="true"><!-- svg --></span>
</button>
```

Slot rules: `.sq-button__icon` wraps the SVG, always `aria-hidden`;
icon-only buttons always carry `aria-label`. The full icon set arrives
in Stage 5 — any inline SVG works today.

## States

- Hover/active/focus-visible/disabled are built in. Focus is always the
  theme ring; never restyle it away.
- Disabled: native `disabled` (cuts activation + tab stop). For
  would-be-disabled links, see LINKS.md.
- Loading: keep the button `disabled`, add `aria-busy="true"`, swap the
  visible label ("Saving…"), and show `.sq-button__spinner`:

```html
<button
  class="sq-button sq-button--primary"
  type="button"
  disabled
  aria-busy="true"
>
  <span class="sq-button__spinner" aria-hidden="true"></span>
  Saving…
</button>
```

Reduced motion freezes the spin; the busy label still communicates.

## Accessibility

- Meaning never comes from color alone: danger pairs the error fill
  with explicit verbs ("Delete project", never "Confirm" in red).
- 48px default targets; `small` only where rows are already dense.
- Touch: `:active` scale is instant feedback; nothing essential happens
  on hover alone.

## Theme behavior

A theme may retune semantic tokens; fills derive from tokens, so they
follow the retune — Ocean retunes `--sq-color-accent`, and primary fills
ride along (that is one override retuning the surface). Tokens the theme
does not retune keep their values: danger stays red under Ocean. Text,
radius, spacing, and ring follow the active theme. Verified under Luca
and Ocean, including focus-ring contrast.

## Customization

Override tokens (`--sq-button-radius`) or variant properties in a later
stylesheet at equal specificity — no `!important` needed. Do not restyle
`:focus-visible` globally.

## Common mistakes

- `<div class="sq-button">` — not keyboard-operable, not announced. Use `<button>`.
- `<button>` without `type` inside a form — defaults to `submit`.
- Spinner without a label change — motion-only status excludes
  reduced-motion and screen-reader users.
- Icon-only button without `aria-label` — announced as "button", nothing else.

## Tested limitations

- No split-button variant (deferred post-1.0 — menu-buttons compose from
  `data-sq-menu` + OVERLAYS.md; split-buttons need their own contract).
- `filter: brightness()` hover on primary/danger shifts hue slightly
  under exotic custom themes; acceptable, documented.
