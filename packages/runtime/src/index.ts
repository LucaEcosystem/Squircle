/**
 * @squircle/runtime — framework-independent behaviors.
 *
 * Vanilla TypeScript. Consumers load the built
 * `dist/squircle-runtime.js` (classic script, `window.Squircle`) or
 * `dist/squircle-runtime.mjs` (ES module) — TypeScript is a development
 * and tooling language only, never a consumer requirement.
 *
 * Plain HTML + CSS stay first-class: styling and native controls need no
 * JavaScript. Each `init*()` is idempotent (safe to run more than once)
 * and returns a cleanup function; `init()` runs them all.
 */

export type { ThemeName, ThemeChange } from "./theme.js";
export {
  setTheme,
  getTheme,
  initTheme,
  resetTheme,
  onThemeChange,
} from "./theme.js";
export { prefersReducedMotion, onReducedMotionChange } from "./motion.js";
export type { DialogOptions } from "./dialog.js";
export {
  openDialog,
  closeDialog,
  isDialogOpen,
  initDialogs,
} from "./dialog.js";
export type { MenuHandle } from "./menu.js";
export { createMenu, initMenus } from "./menu.js";
export type { PopoverPlacement, PopoverOptions } from "./popover.js";
export { positionPopover, initPopovers } from "./popover.js";
export { initTooltips } from "./tooltip.js";
export type { TabsHandle } from "./tabs.js";
export { createTabs, initTabs } from "./tabs.js";
export type { ToastTone, ToastOptions, ToastHandle } from "./toast.js";
export { notify, dismissAll } from "./toast.js";
export type { ValidatableField } from "./validation.js";
export { setFieldError, clearFieldError, enhanceForm } from "./validation.js";
export { focusableChildren } from "./dom.js";

import { initDialogs } from "./dialog.js";
import { initMenus } from "./menu.js";
import { initPopovers } from "./popover.js";
import { initTooltips } from "./tooltip.js";
import { initTabs } from "./tabs.js";

/**
 * Initializes every declarative behavior under `root` (dialogs, menus,
 * popovers, tooltips, tabs). Idempotent — elements initialize once no
 * matter how often `init()` runs. Returns a cleanup function that
 * removes all listeners installed by this call.
 */
export function init(root: ParentNode = document): () => void {
  const cleanups = [
    initDialogs(root),
    initMenus(root),
    initPopovers(root),
    initTooltips(root),
    initTabs(root),
  ];
  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}
