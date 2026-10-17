# Navigation

Purpose: move between pages and places. Every pattern here is real
links in semantic landmarks — never buttons pretending to navigate,
never action menus pretending to be navigation.

## Patterns

**Navbar** — brand + link group + optional actions:

```html
<header class="sq-navbar">
  <div class="sq-container sq-navbar__inner">
    <a class="sq-navbar__brand" href="/">Harbor Notes</a>
    <nav aria-label="Primary">
      <ul class="sq-nav">
        <li><a class="sq-nav__link" href="/articles">Articles</a></li>
        <li>
          <a class="sq-nav__link" href="/about" aria-current="page">About</a>
        </li>
      </ul>
    </nav>
  </div>
</header>
```

**Collapsible mobile nav** — `<details class="sq-nav-menu" open>` wraps
the link list; below 48rem it toggles behind a "Menu" summary, at 48rem+
the summary hides and links show inline. Zero JavaScript:

```html
<nav aria-label="Primary">
  <details class="sq-nav-menu" open>
    <summary>Menu</summary>
    <ul class="sq-nav">
      <li><a class="sq-nav__link" href="/articles">Articles</a></li>
    </ul>
  </details>
</nav>
```

The `open` attribute is load-bearing, not a default to strip: closed
`<details>` content stays hidden from assistive technology even when
CSS displays it, so removing `open` would show links to sighted users
at wide viewports while hiding them from screen readers. Default-open
keeps both trees in agreement at every width; mobile users collapse
with one toggle.

**Breadcrumbs** — ordered trail; separators are CSS (never announced);
the current page is plain text with `aria-current="page"`:

```html
<nav aria-label="Breadcrumb">
  <ol class="sq-breadcrumbs">
    <li><a href="/">Home</a></li>
    <li><a href="/articles">Articles</a></li>
    <li aria-current="page">The 64-pixel rule</li>
  </ol>
</nav>
```

**Pagination** — page navigation with `rel`, visible prev/next labels,
current page as text:

```html
<nav aria-label="Articles pages">
  <ul class="sq-pagination">
    <li><a href="/articles?p=1" rel="prev">← Newer</a></li>
    <li><a href="/articles?p=1">1</a></li>
    <li aria-current="page">2</li>
    <li><a href="/articles?p=3">3</a></li>
    <li><a href="/articles?p=3" rel="next">Older →</a></li>
  </ul>
</nav>
```

**Sidebar** — vertical nav column; stacks above content on narrow,
sticky beside it at 64rem+:

```html
<div class="sq-with-sidebar">
  <nav class="sq-sidebar sq-sidebar--sticky" aria-label="Docs">
    <p class="sq-sidebar__title">Guides</p>
    <ul class="sq-nav sq-nav--vertical">
      <li>
        <a class="sq-nav__link" href="/docs" aria-current="page">Start</a>
      </li>
    </ul>
  </nav>
  <div><!-- content --></div>
</div>
```

## Variants and states

`sq-nav--vertical` (stacked links); `sq-sidebar--sticky` (opt-in
stickiness); hover/active via `aria-current="page"` (also `"true"`).
Disabled-like nav links follow the LINKS.md pattern
(`aria-disabled` + `tabindex="-1"` + explanation nearby).

## Accessibility

- Landmarks (`nav` + `aria-label`) name each navigation region —
  "Primary", "Breadcrumb", "Docs" — never two unlabeled navs.
- `aria-current="page"` marks the current location (CSS hooks the same
  attribute — state and style cannot disagree).
- The `details` toggle is keyboard-native (Enter/Space on summary);
  Escape is not needed (nothing traps, nothing overlays).
- Breadcrumb separators and pagination ellipses are CSS/text without
  link semantics — screen readers hear the trail, not the slashes.
- 44px+ targets everywhere (pagination cells are 48px).

## Theme behavior

Surfaces, borders, active washes, and the current-page ring are
tokens; Ocean re-skins without markup changes. Focus is the global
ring in both themes.

## Customization

Override `--sq-nav-*` tokens or restyle `.sq-nav__link` states in a
later stylesheet. Keep current-page indication visible in every theme
(wash + ring + `aria-current`, never color alone).

## Responsive behavior

Navbars wrap; nav lists wrap; sidebars stack below 64rem; long labels
wrap or scroll the page — never clipped, never squeezed. The only
breakpoint-gated change is the `details` collapse at 48rem.

## Common mistakes

- `role="menu"` for site navigation — menus are for actions (OVERLAYS.md).
- Links to the current page as clickable links — current page is text.
- Breadcrumb separators as characters in markup ("Home / Articles") —
  announced slashes are noise; CSS `::before` is silent.
- JavaScript hamburger toggles with hand-rolled `aria-expanded` when
  `details` does it natively.

## Tested limitations

- No mega-menus or dropdown navigation (links + disclosure compose for
  simple cases; complex cases need page CSS).
- `position: sticky` sidebar needs a scrolling ancestor without
  `overflow: hidden` (platform constraint).
- Single-open accordion sidebar groups are out of 1.0 scope.
