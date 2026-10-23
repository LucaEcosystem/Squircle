# Squircle Runtime API

Framework-independent vanilla JavaScript. Two equivalent builds:

| File                        | Usage                                               | Works from `file://`                    |
| --------------------------- | --------------------------------------------------- | --------------------------------------- |
| `dist/squircle-runtime.js`  | Classic script, `window.Squircle`                   | **Yes** — no modules, no fetch          |
| `dist/squircle-runtime.mjs` | `import { setTheme } from "…/squircle-runtime.mjs"` | No (module CORS); use HTTP or a bundler |

TypeScript declarations (`index.d.ts`) are tooling-only.

## Theme switching

```html
<!-- Classic: restore the stored theme before first paint, then load CSS. -->
<script src="squircle-runtime.js"></script>
<script>
  Squircle.initTheme();
</script>
```

```js
Squircle.setTheme("ocean"); // sets data-sq-theme + persists to localStorage
Squircle.getTheme(); // "ocean" (attribute → stored → "luca" default)
Squircle.resetTheme(); // back to "luca", storage cleared
Squircle.onThemeChange(({ previous, current }) => {
  // reacts to ANY source: API, DevTools, other scripts.
});
const stop = Squircle.onThemeChange(render); // stop() unsubscribes
```

```js
import { setTheme } from "squircle-runtime.mjs"; // same API, ESM shape
```

Behavior contract:

- The **Luca theme is the default**: no attribute and no stored
  preference renders Luca (`:root` values ARE Luca). There is no
  light-mode toggle and none is added by switching themes.
- Unknown theme names (e.g. `"ocean"` without loaded Ocean CSS) fall
  back to `:root` values — switching never breaks rendering, it just
  does not re-skin until that theme's CSS is present.
- Storage failures (private mode) degrade to session-only switching;
  no exception reaches the caller.
- Custom themes override **semantic tokens only** and SHOULD pass
  `checkThemeContrast` (see `@squircle/themes`). The Ocean example
  values are pinned by `theme.test.ts`.

## Environment

```js
Squircle.prefersReducedMotion(); // mirrors the OS setting
Squircle.onReducedMotionChange((reduced) => {
  /* simplify animation at runtime */
});
```

CSS already gates entrances and transitions under
`prefers-reduced-motion`; these helpers cover JS-driven motion and
environment reactions for code that animates outside the CSS system.

## Component behaviors

Plain HTML + CSS stay first-class — nothing below is required for
styling or for native controls. Each `init*()` is idempotent (marks
elements, safe to run repeatedly) and returns a cleanup function;
`init()` runs them all and returns a combined cleanup.

Re-initialization is supported: cleanups release the idempotency
marks, so a cleanup→`init*()` cycle rebinds (the SPA/HMR-remount
case). Marks are per-behavior (`data-sq-dialogs-initialized`,
`data-sq-menus-…`, `data-sq-popovers-…`, `data-sq-tooltips-…`,
`data-sq-tabs-…`, `data-sq-forms-…`) so co-located features that share
an element — a dialog opener that also carries a tooltip — never
block each other. `createMenu`/`createTabs` return the existing handle
when an element is already bound (first binding wins until `destroy()`).

```js
Squircle.init(); // dialogs + menus + popovers + tooltips + tabs + comboboxes + carousels + uploads
const cleanup = Squircle.init(document.getElementById("app"));
```

| API                                                                                     | Purpose                                                                                                                                                                                                                     |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openDialog(el, { modal, invoker })` / `closeDialog(el, restore?)` / `isDialogOpen(el)` | Native `<dialog>` with invoker focus restoration that never scrolls the page; `restore: false` skips restoration entirely (wiring + platform close-fallback) and opt-in backdrop dismissal                                  |
| `initDialogs(root?)`                                                                    | Wires `[data-sq-dialog-open]` / `[data-sq-dialog-close]`                                                                                                                                                                    |
| `createMenu(trigger, menu, …)` / `initMenus(root?)`                                     | Action menus: click/ArrowDown/Enter/Space open (ArrowUp opens on the last item), arrows/Home/End, Escape/Tab dismissal, click-outside, focus restore                                                                        |
| `positionPopover(trigger, popover, { placement, offset })` / `initPopovers(root?)`      | Placement over the native popover API: requested → opposite → perpendicular flip order, viewport clamp, repositions on scroll/resize while open                                                                             |
| `initTooltips(root?)`                                                                   | `[data-sq-tooltip]` hints on hover/focus; transient `aria-describedby` (added on show, removed on hide)                                                                                                                     |
| `createTabs(tablist)` / `initTabs(root?)`                                               | Automatic-activation tabs with roving tabindex; arrows follow `aria-orientation` (vertical: ↑/↓, horizontal: ←/→)                                                                                                           |
| `initComboboxes(root?)`                                                                 | ARIA 1.2 listbox autocomplete: type-to-open, filter (`"off"` for server-driven), ArrowUp/Down wrap + Home/End/PageUp/Down, Enter commits (`data-value ?? label`), Escape closes then restores open-time text, outside close |
| `initCarousels(root?)`                                                                  | `[data-sq-carousel]` tracks: prev/next page by snap position (in-flight safe), disable at the ends, sign-agnostic RTL, `prefers-reduced-motion` becomes instant                                                             |
| `initUploads(root?)`                                                                    | `[data-sq-file]` drop zones: drag hover/filled presentation classes, dropped files assigned to the input with a real `change` event                                                                                         |
| `setFieldError(input, msg)` / `clearFieldError(input)`                                  | `aria-invalid` + `describedby` + message management; message ids scoped per form                                                                                                                                            |
| `notify(msg, { tone, duration, region, dismissLabel })` / `dismissAll(region?)`         | Transient toasts (plain text, live region, pause on hover/focus, localized dismiss button, cleanup incl. timers)                                                                                                            |
| `enhanceForm(form)`                                                                     | Focuses the first invalid field on submit; native UI untouched                                                                                                                                                              |
| `focusableChildren(root)`                                                               | Tab-order focusable descendants (shared helper)                                                                                                                                                                             |

## Verb contract

The surface follows one naming contract — when adding APIs, keep the
verb families separate:

| Family       | Verbs                                          | Meaning                                                                     |
| ------------ | ---------------------------------------------- | --------------------------------------------------------------------------- |
| Lifecycle    | `init*`                                        | Wire declarative behaviors under a root; idempotent; returns a cleanup      |
| Construction | `create*`                                      | Bind one element pair imperatively; returns a handle; singleton per element |
| Control      | `open*` / `close*`                             | State transition on a handle or native element                              |
| State        | `setTheme` / `getTheme` / `resetTheme`         | Theme state (attribute + storage backed)                                    |
| Subscription | `on*Change` / `prefers*` / `is*Open`           | Environment observation and state queries                                   |
| Injection    | `notify` / `setFieldError` / `clearFieldError` | Put content into a region or wire field state                               |
| Clearing     | `dismissAll`                                   | Bulk dismissal of injected toasts (timers included)                         |
| Placement    | `positionPopover`                              | One-shot geometry; no state retained                                        |
| Scanning     | `focusableChildren`                            | Pure query helper                                                           |
