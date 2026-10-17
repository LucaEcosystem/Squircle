/**
 * Shared DOM helpers for `@squircle/runtime` behaviors.
 *
 * No framework assumptions. No global state — callers keep their own
 * handles and cleanup functions.
 */

/** Focusable descendants, in tab order, excluding hidden ones. */
export function focusableChildren(root: ParentNode): HTMLElement[] {
  const selector =
    "a[href], button:not([disabled]), input:not([disabled]), " +
    "select:not([disabled]), textarea:not([disabled]), " +
    '[tabindex]:not([tabindex="-1"])';
  const found: HTMLElement[] = [];
  for (const el of root.querySelectorAll(selector)) {
    const html = el as HTMLElement;
    if (html.getClientRects().length > 0) found.push(html);
  }
  return found;
}

/** Marks an element initialized so repeated `init*()` calls are safe. */
const INITIALIZED = "data-sq-initialized";

export function alreadyInitialized(el: Element): boolean {
  return el.hasAttribute(INITIALIZED);
}

export function markInitialized(el: Element): void {
  el.setAttribute(INITIALIZED, "");
}

/** Clamps a popup rect inside the viewport with a margin. */
export function clampToViewport(
  left: number,
  top: number,
  width: number,
  height: number,
  margin = 8,
): { left: number; top: number } {
  const maxLeft = Math.max(margin, window.innerWidth - width - margin);
  const maxTop = Math.max(margin, window.innerHeight - height - margin);
  return {
    left: Math.min(Math.max(margin, left), maxLeft),
    top: Math.min(Math.max(margin, top), maxTop),
  };
}
