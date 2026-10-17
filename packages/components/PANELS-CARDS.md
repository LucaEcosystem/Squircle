# Panels and Cards

Purpose: group related content. Panel = flat bordered surface for
sections and forms. Card = elevated + shadowed for peer-level items
(listings, stats, previews). Same geometry, different altitude.

## Usage

```html
<section class="sq-panel" aria-labelledby="billing-title">
  <div class="sq-panel__header">
    <h2 class="sq-heading--3" id="billing-title">Billing</h2>
    <p class="sq-text sq-muted">
      Invoices land here on the first of the month.
    </p>
  </div>
  <div class="sq-panel__body">
    <div class="sq-panel">
      <p class="sq-text">Nested content carves inward automatically.</p>
    </div>
  </div>
  <div class="sq-panel__footer">
    <button class="sq-button sq-button--primary" type="button">Save</button>
    <button class="sq-button sq-button--tertiary" type="button">Cancel</button>
  </div>
</section>

<article class="sq-card">
  <h3 class="sq-heading--4">Turnaround 6.2h</h3>
  <p class="sq-text sq-muted">Fleet average, trailing 7 days.</p>
</article>
```

## Variants

| Class                  | Use                                             |
| ---------------------- | ----------------------------------------------- |
| `sq-panel`             | Default flat surface.                           |
| `sq-panel--sunken`     | Inset regions (code wells, read-only previews). |
| `sq-panel--elevated`   | Panel that must float without becoming a card.  |
| `sq-panel--large`      | Roomier padding for major sections.             |
| `sq-card`              | Elevated peer item.                             |
| `sq-card--interactive` | Clickable card (see stretched link below).      |

Header/body/footer sections are optional and composable — use any
subset. The header carries a divider; the footer wraps actions with
real gaps.

## Nesting

`.sq-panel .sq-panel` steps down one radius grade and one elevation
automatically. Never hand-tune nested radii; never stack more than two
deep (restructure instead — depth is a smell).

## Interactive cards

One link per card, stretched over the surface, one tab stop:

```html
<article class="sq-card sq-card--interactive">
  <h3 class="sq-heading--4">The 64-pixel rule</h3>
  <p class="sq-text sq-muted">Section rhythm should be a token.</p>
  <a class="sq-stretched-link" href="/essays/64px">Read the essay</a>
</article>
```

The card lifts on hover (settles under reduced motion) and rings on
`focus-within` via the global focus rule. Never nest interactive
controls inside a stretched-link card — one action per surface.

## Disclosure (collapsible surfaces)

Native `<details>`/`<summary>` — no JavaScript, platform keyboard
support, state in the `open` attribute:

```html
<details class="sq-disclosure" open>
  <summary>When do exports run?</summary>
  <div class="sq-disclosure__content">
    <p class="sq-text">Nightly at 02:00 UTC, plus on demand.</p>
  </div>
</details>
```

Summary text names the section (always visible, always a complete
label); content grids with room. The accent chevron rotates on open
(static under reduced motion). This resolves the Stage 3 "no
collapsible surfaces" limitation: single-open accordion groups remain
out of scope (use separate disclosures — forcing exclusivity needs a
custom system native HTML deliberately avoids).

## Surface hierarchy

Page (deepest) → panel → nested panel / card → overlay (dialogs,
Stage 4). If everything is elevated, nothing is: default to flat
panels, promote to cards only for peer groups that must separate from
the page. Bright accents never fill large surfaces.

## Accessibility

- Panels grouping a topic get a heading (`aria-labelledby` where the
  heading is the label). Decorative wrappers stay dumb `<div>`s.
- Interactive cards keep exactly one link; the visible link text is the
  accessible name — no `aria-label` needed, none wanted.
- Dividers (`<hr class="sq-divider">`) are native separators; vertical
  dividers are `aria-hidden` presentation.

## Theme behavior

Surfaces, borders, dividers, and shadows are tokens; the navy ramp
re-maps under Ocean without markup changes. Elevation must remain
visible in every theme (shadow + border both shift, never just one).

## Common mistakes

- Card for a whole page section — use a panel; cards are peers.
- Three levels of nesting — restructure.
- Buttons inside stretched-link cards — nested interactives break
  keyboard and screen-reader users alike.

## Tested limitations

- Single-open accordion groups (use separate disclosures instead).
- `sq-card--interactive` lift is hover/keyboard-focus driven; touch
  users get the link with no lift, which is correct.
