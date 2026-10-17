# Data display

Purpose: present structured information with native semantics intact.
One API per purpose — no overlapping table/list/card systems.

## Tables

Style a real `<table>`. `thead`/`tbody`, `th scope`, `caption` for
context. The scroll wrapper (not reflowed divs) carries narrow screens:

```html
<div
  class="sq-table-scroll"
  role="region"
  aria-labelledby="fleet-caption"
  tabindex="0"
>
  <table class="sq-table">
    <caption id="fleet-caption">
      Berth schedule, week 42
    </caption>
    <thead>
      <tr>
        <th scope="col">Vessel</th>
        <th scope="col">Berth</th>
        <th scope="col" class="sq-table__number">TEU</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th scope="row">Meridian Star</th>
        <td>07</td>
        <td class="sq-table__number">4,200</td>
      </tr>
    </tbody>
  </table>
</div>
```

- `tabindex="0"` on the scroll region makes overflow keyboard-reachable
  (scroll containers are focusable only when focusable — platform rule).
- `sq-table--striped` is opt-in zebra (often visual noise; default is
  hover-highlight only).
- Numbers right-align with tabular figures (`sq-table__number`).
- Cells wrap (`overflow-wrap: anywhere`); headers stay nowrap. Minimum
  table width (36rem) triggers the scroll wrapper instead of squeezing.

## Description lists

```html
<dl class="sq-datalist">
  <div>
    <dt>Registry</dt>
    <dd>Monrovia — IMO 9 812 044</dd>
  </div>
</dl>
```

`div` wrappers inside `dl` are valid HTML and carry the row dividers.
Terms are secondary, definitions primary — hierarchy without headings.

## Avatars

```html
<span class="sq-avatar" role="img" aria-label="Ada Lovelace">AL</span>
<span class="sq-avatar sq-avatar--large"
  ><img src="ada.jpg" alt="Ada Lovelace"
/></span>
```

Initials are real text (announced, localizable); images crop with
`alt` naming the person. Sizes: small 32px, medium 48px, large 64px.
In a labeled context (message author named beside it) the avatar is
decorative — no `role="img"` needed.

## Metrics

```html
<div class="sq-metric">
  <p class="sq-metric__value">94%</p>
  <p class="sq-metric__label">On schedule, trailing 7 days</p>
  <p class="sq-metric__delta sq-metric__delta--up">↑ 2 points vs last week</p>
</div>
```

Fluid display numerals, tabular figures, deltas pair arrows with
words (direction never travels alone; color never travels alone).

## Accessibility

- Table headers scope correctly; captions name the table; scroll
  regions are labeled + focusable.
- Never rebuild tables from divs for "responsive" reasons — the
  scroll wrapper preserves semantics AND narrow screens.
- Avatars: named when alone, decorative when redundant.
- Metric deltas announce as text ("up 2 points"), not as color.

## Theme behavior

Header wash, row dividers, hover, avatar surface, and delta tones are
tokens; both themes were contrast-checked including secondary text on
header wash.

## Customization

Override `--sq-table-*`, `--sq-avatar-*` or restyle later. Keep the
scroll wrapper's border/radius paired — a borderless scroll region
reads as a broken table.

## Responsive behavior

Tables scroll horizontally in their wrapper (page never scrolls
sideways); datalists stack; metrics reflow in grids. At 360px cells
wrap, numbers stay tabular, captions stay readable.

## Common mistakes

- Div-tables for responsiveness — semantics destroyed for zero gain.
- Scroll region without `tabindex` — keyboard users cannot reach the overflow.
- `th` without `scope` — association becomes guesswork.
- Missing captions ("the table below") — name it.
- Zebra striping + hover + selected + sorted all at once — pick one emphasis.

## Tested limitations

- No sortable-column behavior (buttons in headers + JS sorting are
  application logic; the styles support them when added).
- No virtualized tables (1.1+ candidate, documented exclusion).
- Column pinning (`position: sticky` cells) is page CSS, untested.
