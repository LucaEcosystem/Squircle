# Links

Purpose: navigation. Anchors go places; buttons do things. This file
keeps the two apart.

## Usage

```html
<p>Read the <a class="sq-link" href="/docs">documentation</a> first.</p>
<a class="sq-link sq-link--subtle" href="/archive">Older posts</a>
<a class="sq-link sq-link--action" href="/start">Start building</a>
<nav aria-label="Docs">
  <a class="sq-nav-link" href="/docs">Docs</a>
  <a class="sq-nav-link" href="/themes" aria-current="page">Themes</a>
</nav>
```

Bare `<a>` elements already receive the base treatment (color, offset
underline, hover, visited); `.sq-link` makes the contract explicit and
adds icon-gap support.

## Variants

| Class               | Use                                                                              |
| ------------------- | -------------------------------------------------------------------------------- |
| `sq-link`           | Inline links in prose. Strong weight, themed color, visited state.               |
| `sq-link--subtle`   | Secondary links (meta rows, footers). Muted until hover.                         |
| `sq-link--action`   | One prominent call per region. Animated arrow (decorative CSS, never announced). |
| `sq-link--disabled` | Presentation ONLY — see below.                                                   |
| `sq-nav-link`       | Link rows (header/footer). Padded, squirclish, `aria-current` aware.             |

## States

Visited uses the theme's visited token. Hover brightens; focus-visible
is the theme ring. There is no "selected link" — current pages use
`aria-current="page"` on `.sq-nav-link`.

## Disabled-like links

Anchors cannot be disabled. If an action is unavailable, either remove
the link or render it inert AND unreachable:

```html
<a class="sq-link sq-link--disabled" aria-disabled="true" tabindex="-1"
  >Export (no data yet)</a
>
```

Better: explain WHY next to it ("Export unlocks after your first
project"). Never leave a dead control unexplained.

## Accessibility

- Link text names its destination ("Read the migration guide", never
  "click here"). The action arrow is CSS `content` — never announced.
- `aria-disabled` alone does not remove tab stops or clicks; the class
  adds `pointer-events: none`, the HTML must add `tabindex="-1"`.
- Color is never the only cue: links are also underlined (inline) or
  padded surfaces (nav).

## Theme behavior

Link, hover, and visited colors are semantic tokens; both themes were
contrast-checked for link text. The action arrow inherits `currentColor`.

## Common mistakes

- `<a class="sq-button">` for an in-page action — use `<button>`.
- `<a href="#">` as a button — same defect with extra steps.
- `aria-disabled` without `tabindex="-1"` — still focusable, still announced as a link.

## Tested limitations

- No skip-to-content behavior beyond `.sq-skip-link` (utilities).
- External-link indicators are not automatic; add "(external)" text
  where the audience needs it.
