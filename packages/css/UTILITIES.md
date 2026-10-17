# Squircle Utilities

Single-purpose `sq-*` classes. Every utility references a design token —
no hardcoded colors, spacing, radii, shadows, or timing. If a value you
need is not a token, the utility does not exist: use plain CSS or propose
a token, never a one-off hex.

## Naming

`sq-<property>-<scale>`. Scales reuse token names: `sq-p-md` is
`var(--sq-space-md)`, `sq-text-muted` is `var(--sq-color-text-muted)`,
`sq-rounded-lg` is `var(--sq-radius-lg)`. Learn the tokens, know the
utilities.

## Categories

| Area                     | Examples                                                                                                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Display / visibility     | `sq-block`, `sq-flex`, `sq-grid`, `sq-hidden`, `sq-visible`, `sq-invisible`                                                                                                |
| Flexbox / grid           | `sq-flex-row/col`, `sq-flex-wrap`, `sq-flex-1`, `sq-grow`, `sq-shrink-0`, `sq-grid-cols-1…4`, `sq-col-span-full`                                                           |
| Alignment / gap          | `sq-items-center`, `sq-justify-between`, `sq-self-start`, `sq-place-center`, `sq-gap-xs…xl`                                                                                |
| Margin / padding         | `sq-m-*`, `sq-mt/mb/ml/mr/ms/me-*`, `sq-mx-auto`, `sq-p-*`, `sq-px/py/pt/pb-*`                                                                                             |
| Sizing                   | `sq-w-full`, `sq-h-full`, `sq-min-h-screen`, `sq-max-w-measure/narrow/base/wide`, `sq-aspect-video/square`, `sq-object-cover`                                              |
| Position / stacking      | `sq-relative/absolute/fixed/sticky`, `sq-inset-0`, `sq-top-0…`, `sq-z-dialog…` (token order)                                                                               |
| Typography               | `sq-text-xs…5xl`, `sq-font-display/body/mono`, `sq-weight-*`, `sq-leading-*`, `sq-text-left/center/right`, `sq-truncate`, `sq-clamp-2/3`, `sq-measure`                     |
| Color                    | `sq-text-primary/secondary/muted/accent/link/success/info/warning/error`, `sq-bg-background/sunken/surface/elevated/accent/…` (fills set their contrast ink automatically) |
| Border / radius / shadow | `sq-border(-strong/-accent)`, `sq-rounded-xs…full`, `sq-shadow-sm/md/lg`                                                                                                   |
| Overflow                 | `sq-overflow-*`, `sq-overflow-x/y-*`                                                                                                                                       |
| Interaction              | `sq-transition`, `sq-duration-*`, `sq-ease-*`, `sq-hover-lift`, `sq-active-press`, `sq-motion-none`, `sq-cursor-*`, `sq-pointer-events-*`, `sq-select-*`                   |
| Entrance                 | `sq-fade-in`, `sq-rise-in` (both become instant under `prefers-reduced-motion`)                                                                                            |
| Accessibility            | `sq-sr-only`, `sq-skip-link`, `sq-focus-ring`                                                                                                                              |

## Responsive (bounded matrix)

Mobile-first prefixes: `sq-sm-` (≥40rem) · `sq-md-` (≥48rem) ·
`sq-lg-` (≥64rem) · `sq-xl-` (≥80rem). Each prefix supports exactly:
`hidden`, `block`, `flex`, `grid`, `flex-row`, `flex-col`,
`grid-cols-1/2/3/4`, `text-left`, `text-center`.

Anything outside this matrix (responsive spacing, sizing, colors) is
intentionally unsupported: write a component rule or a page-level media
query instead. Crowded viewports reflow or stack — never squeeze.

## Container queries

`.sq-cq` establishes `container-type: inline-size`.
`.sq-cq-split` stacks below a 30rem container and sits side-by-side
above it. Supported since Safari 16.0; the stacked default is complete
alone, so there is no fallback cliff.

## Deliberate omissions

- **No hover/focus color variants** (beyond lift/press): state styling
  belongs to components, which arrive in Stages 3–4.
- **No `sq-text-justify`**: justified text creates rivers; use
  `sq-text-left` (the default).
- **No arbitrary-value syntax** (`sq-p-[13px]` and friends): use an
  inline `style` attribute referencing tokens
  (`style="padding: var(--sq-space-md)"`), or write a rule. The
  optimizer only understands documented classes plus safelist entries.
- **No `sq-w-screen`** (100vw causes horizontal scroll with scrollbars);
  use `sq-w-full`.

## Accessibility rules

Utilities never replace semantics: `sq-hidden` is `display:none`
(like the `hidden` attribute); hiding must also remove from the
accessibility tree, which `display:none` does. `sq-invisible` keeps
layout AND screen-reader presence — choose deliberately. Interactive
targets keep ≥48px heights via component tokens, not utilities.
