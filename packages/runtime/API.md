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
`prefers-reduced-motion`; these helpers cover JS-driven motion, which
arrives with component behaviors in Stage 4.

## Component behaviors (Stage 4)

Plain HTML + CSS stay first-class — nothing below is required for
styling or for native controls. Each `init*()` is idempotent (marks
elements, safe to run repeatedly) and returns a cleanup function;
`init()` runs them all and returns a combined cleanup.

```js
Squircle.init(); // dialogs + menus + popovers + tooltips + tabs
const cleanup = Squircle.init(document.getElementById("app"));
```

| API                                                                                     | Purpose                                                                                                               |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `openDialog(el, { modal, invoker })` / `closeDialog(el, restore?)` / `isDialogOpen(el)` | Native `<dialog>` with invoker focus restoration (explicit `invoker` or opener-tracked) and opt-in backdrop dismissal |
| `initDialogs(root?)`                                                                    | Wires `[data-sq-dialog-open]` / `[data-sq-dialog-close]`                                                              |
| `createMenu(trigger, menu)` / `initMenus(root?)`                                        | Action menus: arrows/Home/End, Escape/Tab dismissal, click-outside, focus restore                                     |
| `positionPopover(trigger, popover, { placement, offset })` / `initPopovers(root?)`      | Edge-aware placement over the native popover API                                                                      |
| `initTooltips(root?)`                                                                   | `[data-sq-tooltip]` hints on hover/focus, `aria-describedby` wiring                                                   |
| `createTabs(tablist)` / `initTabs(root?)`                                               | Automatic-activation tabs with roving tabindex                                                                        |
| `setFieldError(input, msg)` / `clearFieldError(input)`                                  | `aria-invalid` + `describedby` + message management                                                                   |
| `notify(msg, { tone, duration, region })` / `dismissAll(region?)`                       | Transient toasts (plain text, live region, pause on hover/focus, cleanup handles)                                     |
| `enhanceForm(form)`                                                                     | Focuses the first invalid field on submit; native UI untouched                                                        |
| `focusableChildren(root)`                                                               | Tab-order focusable descendants (shared helper)                                                                       |
