# Overlays: Dialog, Menu, Popover, Tooltip

Purpose: content above content — each with a native foundation, a
documented dismissal contract, and no focus traps.

## Dialog

Native `<dialog>`, dressed. Modal is the default (`showModal()` gives
Escape, backdrop, and focus containment free).

```html
<dialog class="sq-dialog" id="confirm-delete" aria-labelledby="confirm-title">
  <button
    class="sq-button sq-button--secondary sq-button--icon-only sq-dialog__close"
    type="button"
    data-sq-dialog-close
    aria-label="Close dialog"
  >
    …
  </button>
  <div class="sq-stack">
    <h2 class="sq-heading--3" id="confirm-title">Delete project?</h2>
    <p class="sq-text">
      This removes the project and its history. This cannot be undone.
    </p>
    <div class="sq-cluster">
      <button class="sq-button sq-button--danger" type="button">
        Delete project
      </button>
      <button
        class="sq-button sq-button--tertiary"
        type="button"
        data-sq-dialog-close
      >
        Keep it
      </button>
    </div>
  </div>
</dialog>
<button
  class="sq-button sq-button--primary"
  type="button"
  data-sq-dialog-open="confirm-delete"
>
  Delete…
</button>
<script>
  Squircle.initDialogs(); // once; idempotent
  // Or explicitly:
  Squircle.openDialog(document.getElementById("confirm-delete"));
  Squircle.closeDialog(document.getElementById("confirm-delete")); // restores invoker focus
</script>
```

Sizes: default 36rem, `--large` 48rem. Panel sections compose inside.

**Backdrop policy:** backdrop clicks close ONLY dialogs carrying
`data-sq-dismiss="backdrop"`. Dialogs often guard unsaved work;
silent dismissal would lose it. Escape always works (platform).

**Modal vs non-modal:** `openDialog(el)` is modal; `{ modal: false }`
uses `show()` (page stays interactive, no backdrop) with the same
focus placement and restoration. Platform note: Escape closes modal
dialogs natively but NOT modeless ones — every modeless dialog needs
its visible close control (tested behavior, not an omission).

**Focus:** opens on `[autofocus]`, else the first focusable control,
else the dialog itself (never lost to `<body>`). Closes restore the
invoker. No traps: Tab cycles natively in modal dialogs; non-modal
dialogs never capture Tab.

## Menu (actions, not navigation)

```html
<button
  class="sq-button sq-button--secondary"
  type="button"
  data-sq-menu
  aria-controls="export-menu"
>
  Export
</button>
<ul
  class="sq-menu"
  id="export-menu"
  role="menu"
  aria-label="Export options"
  hidden
>
  <li role="none">
    <button class="sq-menu__item" role="menuitem" type="button">
      PDF document
    </button>
  </li>
  <li role="none">
    <button class="sq-menu__item" role="menuitem" type="button">
      CSV data <span class="sq-menu__hint">⌘E</span>
    </button>
  </li>
  <li><hr class="sq-menu__separator" /></li>
  <li role="none">
    <button
      class="sq-menu__item sq-menu__item--danger"
      role="menuitem"
      type="button"
    >
      Delete export
    </button>
  </li>
</ul>
<script>
  Squircle.initMenus();
</script>
```

`data-sq-menu` + `aria-controls` binds trigger to menu (also via
`createMenu(trigger, menu)`). Opens on click/ArrowDown/Enter/Space;
ArrowUp/Down/Home/End move; Enter/Space activate natively; Escape
closes and restores; Tab closes WITHOUT restoring (focus travels
naturally — never trapped); click-outside closes. Disabled items use
`aria-disabled="true"` (skipped by arrows, not activated).

`sq-menu__item--danger` pairs the error color with an explicit verb —
never color alone. `sq-menu__hint` shows shortcut text (informational,
also documented in prose where it matters).

**Limitations:** no type-ahead; submenus are out of scope (flatten the
actions instead); `role="menu"` expects `menuitem` children — authors
own the roles, the runtime owns the behavior.

## Popover (supplementary content)

```html
<button
  class="sq-button sq-button--tertiary"
  type="button"
  id="quota-info"
  popovertarget="quota-pop"
>
  How is quota counted?
</button>
<div
  class="sq-popover"
  id="quota-pop"
  popover="auto"
  data-sq-popover-anchor="quota-info"
  aria-labelledby="quota-title"
>
  <h2 class="sq-popover__title" id="quota-title">
    Quota counts seats, not invites
  </h2>
  <p class="sq-text sq-muted">Pending invitations never consume a seat.</p>
</div>
<script>
  Squircle.initPopovers();
</script>
```

Show/hide/light-dismiss stay native. Without the anchor attribute the
popover centers (platform default — complete alone). With it,
`positionPopover` places it beside the trigger, flips when space runs
out, and clamps inside the viewport (`data-sq-popover-placement="top"`
opts into above-first). No animation (instant both ways —
reduced-motion safe by construction).

## Tooltip (hints, never essentials)

```html
<button
  class="sq-button sq-button--secondary"
  type="button"
  data-sq-tooltip="Exports include archived projects."
>
  Export
</button>
<script>
  Squircle.initTooltips();
</script>
```

Plain-text content, one shared live element, shown on hover AND focus,
hidden on leave/blur/Escape/scroll. Wired into `aria-describedby`
(preserving author descriptions). The page must make full sense with
tooltips disabled — if the information is essential, print it inline.

## Accessibility notes (all four)

- Semantics are author-owned and native (`dialog`, `popover`,
  `menu/menuitem`, `role="tooltip"`); the runtime manages behavior only.
- Contrast verified under Luca and Ocean, including disabled items and
  tooltip text.
- Touch: everything opens by tap; nothing essential is hover-only;
  targets honor the 48px policy (menu items 44px in dense rows — the
  documented exception, still above the 44px floor).
- Reduced motion: dialogs/popovers/tooltips appear instantly; the
  switch-like transitions that remain are gated.

## Theme behavior

Surfaces, borders, scrims, and text are tokens. The scrim darkens both
themes without hiding page context entirely.

## Common mistakes

- Backdrop-dismissed confirmations (`data-sq-dismiss` on a delete
  dialog) — data loss by misclick.
- Menus for site navigation — links, always.
- Tooltips carrying the only copy of an error or price.
- `role="menu"` on a list of links — that is navigation, not a menu.

## Tested limitations

- Menu type-ahead unsupported; submenus unsupported.
- Popover anchor positioning measures on open — hidden-then-shown
  popovers position correctly; never-positioned ones center natively.
- Dialog `autofocus` inside non-modal dialogs scrolls the page to the
  dialog on open (platform behavior).
