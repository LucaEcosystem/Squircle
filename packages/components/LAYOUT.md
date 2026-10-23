# Layout Primitives

Purpose: compose interfaces from a small set of content-first
primitives. Primitives position; utilities fine-tune; components fill.
If a layout needs a new primitive, it probably needs restructuring.

## The set

| Primitive                                    | Rule                                           | Use                                        |
| -------------------------------------------- | ---------------------------------------------- | ------------------------------------------ |
| `.sq-container` (+ `--narrow`, `--wide`)     | Centered, capped width, breathing gutters      | Page content                               |
| `.sq-section`                                | Generous vertical rhythm (`section` token)     | Major page sections; pages scroll          |
| `.sq-stack` (+ `--tight`, `--loose`)         | Even vertical gaps between flow children       | Any stacked content                        |
| `.sq-cluster`                                | Wrapping row with real gaps                    | Buttons, chips, meta rows — never collides |
| `.sq-split`                                  | Wrapping row, space-between                    | Header rows, footers, label/value lines    |
| `.sq-grid-auto`                              | Intrinsic responsive grid (no breakpoint math) | Card listings                              |
| `.sq-divider` (+ `--vertical`, `--spacious`) | Token-spaced separator                         | Between sections or inline groups          |

## Composition patterns

Page: `sq-section > sq-container > sq-stack--loose`.
Header row: `sq-split` (title left, actions right — wraps on narrow).
Card grid: `sq-grid-auto`, or explicit `sq-grid sq-grid-cols-*` with
responsive prefixes for exact column counts.
Form: `sq-panel > sq-stack > sq-field*` (fields own their labels,
help, and errors; see Stage 4 for full form behavior).

```html
<section class="sq-section">
  <div class="sq-container sq-stack--loose sq-stack">
    <div class="sq-split">
      <h2 class="sq-heading--2">Projects</h2>
      <div class="sq-cluster">
        <button class="sq-button sq-button--secondary" type="button">
          Filter
        </button>
        <button class="sq-button sq-button--primary" type="button">New</button>
      </div>
    </div>
    <div class="sq-grid-auto">
      <article class="sq-card">…</article>
    </div>
  </div>
</section>
```

## Rules

- Sections grow; pages scroll. Never cap heights to "fit the viewport".
- Narrow viewports stack (`flex-col`, single column) — never squeeze.
- `sq-cluster`/`sq-split` wrap by default; controls keep ≥13px gaps.
- Dividers separate; they never decorate. One per boundary.
- Vertical dividers stretch (`align-self: stretch`) and are
  `aria-hidden="true"` when purely visual between labeled groups.

## Responsive notes

Primitives are fluid by construction. Add responsive utilities
(`sq-md-flex-row`, `sq-lg-grid-cols-3`) only for deliberate breakpoints,
documented in UTILITIES.md. Overflow utilities (`sq-overflow-x-auto`)
handle wide tables/code — never the page itself.

## Common mistakes

- New wrapper classes per page (`project-list`, `dashboard-grid`) when
  `sq-grid-auto` or `sq-stack` already compose.
- Fixed heights on content regions — content decides height.
- `sq-split` for three balanced columns — that's a grid.

## Tested limitations

- No masonry/source-order-independent layouts (write page CSS).
- `sq-grid-auto` tiles never shrink below `--sq-layout-tile-min` (18rem
  default); narrower tiles need an explicit grid or a token override.
