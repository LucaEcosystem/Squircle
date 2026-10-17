# Tabs

Purpose: switch between associated panels in place. Automatic
activation — arrows move AND select, so focus, selection, and content
never disagree.

## Usage

```html
<div data-sq-tabs>
  <div class="sq-tablist" role="tablist" aria-label="Project views">
    <button
      class="sq-tab"
      role="tab"
      type="button"
      aria-controls="tab-overview"
      aria-selected="true"
    >
      Overview
    </button>
    <button
      class="sq-tab"
      role="tab"
      type="button"
      aria-controls="tab-activity"
      aria-selected="false"
      tabindex="-1"
    >
      Activity
    </button>
    <button
      class="sq-tab"
      role="tab"
      type="button"
      aria-controls="tab-settings"
      aria-selected="false"
      tabindex="-1"
    >
      Settings
    </button>
  </div>
  <section class="sq-tabpanel" role="tabpanel" id="tab-overview" tabindex="0">
    <p class="sq-text">…</p>
  </section>
  <section class="sq-tabpanel" role="tabpanel" id="tab-activity" hidden>
    …
  </section>
  <section class="sq-tabpanel" role="tabpanel" id="tab-settings" hidden>
    …
  </section>
</div>
<script>
  Squircle.initTabs();
</script>
```

`data-sq-tabs` binds the tablist (`createTabs(el)` for explicit use).
Missing tab ids are generated (`sq-tab-N`); missing
`aria-labelledby` on panels is backfilled. Explicit ids preferred.

## Keyboard

Left/Right (Up/Down) select the neighbor with wrapping; Home/End jump;
click selects and focuses. `tabindex` roves (selected tab is `0`, the
rest `-1`), so Tab enters the set once, not once per tab.

## Panels

Panels hide with `hidden` — out of the tab order AND the accessibility
tree, no ARIA needed. Give scrollable panels `tabindex="0"`; static
panels need no tabindex. Long tab labels never wrap: the tablist
scrolls horizontally (`overflow-x: auto`) instead of squeezing.

## Accessibility

- `aria-selected` mirrors selection; `aria-controls`/`aria-labelledby`
  bind tabs to panels (generated when omitted, explicit preferred).
- Never skip heading levels to fake tab size; never use tabs for
  sequential steps (that is a stepper, later stage) or for navigation
  between pages (those are links).
- Content under tabs must be reachable another way when it matters
  (deep-linking tabs is out of 1.0 scope — document the limitation to
  users when panels hold shareable content).

## Theme behavior

Tab text, hover wash, selected wash, and the accent indicator are
tokens; the indicator clears 3:1 against both themes' washes
(non-text). Selected state pairs the indicator with `aria-selected` —
never color alone.

## Responsive behavior

Labels truncate by scroll, not by ellipsis: the tablist scrolls.
Panels reflow like any stacked content. At 360px the set stays one
thumb-reachable row — verified, not assumed.

## Customization

Override `--sq-tab-*` tokens or restyle `.sq-tab[aria-selected]`
states in a later stylesheet. Keep the indicator visible in every
theme; keep unselected tabs at ≥4.5:1.

## Common mistakes

- Manual activation expectations (arrows move but do not select) —
  Squircle tabs are automatic; say so in user docs.
- `hidden` replaced with `display:none` utilities on panels — same
  effect, but `hidden` is the contract the runtime toggles.
- Tab lists for wizards or page navigation.

## Tested limitations

- No vertical tablists (write page CSS; the runtime is orientation-agnostic).
- No deep-linking / hash routing for panels.
- No animated panel transitions (instant swap; reduced-motion safe).
