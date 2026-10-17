# Typography Components

Purpose: one voice for every word. Bare elements (`h1–h6`, `p`, `code`,
`pre`, `blockquote`, lists) already carry the full treatment — these
classes extend the same voice to other elements and document the
patterns.

## Elements (no classes needed)

Headings `h1–h6` (Manrope 800, fluid, balanced, generous arrival space),
paragraphs (DM Sans 500, 1.65, 68ch), `.sq-lead`, lists with gold
markers, blockquotes with accent rules, `pre` code blocks, `small`.

## Classes (same voice, other elements)

| Class                          | Mirrors                      | Use                                          |
| ------------------------------ | ---------------------------- | -------------------------------------------- |
| `sq-heading--1…4`              | `h1`, `h2`, `h3`, `h2-size`… | Heading treatment on non-`h` elements        |
| `sq-text`                      | `p`                          | Body text on other elements                  |
| `sq-label`                     | form `<label>`               | Label treatment (pairs with inputs, Stage 4) |
| `sq-code`                      | `code`                       | Inline code chip on any element              |
| `sq-lead`                      | —                            | Standfirst paragraphs                        |
| `sq-muted` / `sq-small`        | —                            | Supporting text (utilities)                  |
| `sq-truncate` / `sq-clamp-2/3` | —                            | Single-line / N-line clamping (utilities)    |

Base `.sq-heading` sets family/weight/leading; the numbered modifier
sets size and spacing. Always pair them:
`<p class="sq-heading sq-heading--3">`.

## Patterns

- **Page title**: one `h1` per page, `sq-lead` after it, actions in a
  `sq-cluster` below. Never two `h1`s.
- **Section**: `h2` + supporting `p`, then content. Headings arrive
  with space (`xl/lg` above) and hand off cleanly (`sm/xs` below).
- **Long content**: `sq-text`/`p` cap at 68ch automatically. In wide
  containers, constrain the prose column (`sq-max-w-measure`), not the
  reader's patience.
- **Code**: inline `` `code` `` gets `.sq-code` treatment natively;
  blocks use `pre` (sunken, bordered, horizontal scroll, never wrap).
- **Clamping**: `sq-clamp-2/3` for previews only — full text always
  exists one link away. Never clamp the only copy.

## Accessibility

- Heading levels order (`h1→h2→h3`, no skipping for size — size with
  classes, outline with levels).
- `sq-heading--*` on a non-heading element does NOT confer heading
  semantics; in third-party markup prefer native elements, classes are
  the fallback.
- Truncated/clamped text keeps its full string in the accessibility
  tree (CSS clipping only) — still, link to the full copy.
- Code blocks get `aria-label` or a preceding heading naming the language.

## Theme behavior

All type color is semantic (`text-primary/secondary/muted`, accent
markers, link tokens). Manrope/DM Sans load per FONTS config with
system fallbacks; the scale is fluid and viewport-relative.

## Common mistakes

- `h3` chosen because "it looks right" — outline first, style second.
- `sq-heading--2` without `.sq-heading` — size without the voice.
- Clamping body copy with no full-text path.
- Centered paragraphs longer than a line or two — center labels and
  headings, left-align reading text.

## Tested limitations

- `text-wrap: balance` is progressive (unsupported engines fall back
  to normal wrapping — never broken, just less even).
- CJK/RTL specifics are untested in 1.0 scope; logical properties are
  used throughout (`margin-inline`, `padding-block`, `inset`).
