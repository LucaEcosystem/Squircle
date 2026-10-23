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

/**
 * Marks distinguishing one behavior's wiring from another's. They are
 * per-behavior on purpose: co-located features share elements (a dialog
 * opener may also carry a tooltip), and a single shared mark would make
 * the first `init*()` to touch an element silently block every other.
 */
export const INITIALIZED_ATTRS = {
  dialog: "data-sq-dialogs-initialized",
  menu: "data-sq-menus-initialized",
  popover: "data-sq-popovers-initialized",
  tooltip: "data-sq-tooltips-initialized",
  tab: "data-sq-tabs-initialized",
  form: "data-sq-forms-initialized",
  combobox: "data-sq-comboboxes-initialized",
  carousel: "data-sq-carousels-initialized",
  file: "data-sq-files-initialized",
} as const;

export interface InitClaims {
  /**
   * Claims `el` for this `init*()` pass: marks it in the DOM and
   * remembers it. Returns false when an earlier, un-cleaned-up pass
   * already owns the element.
   */
  claim(el: Element): boolean;
  /**
   * Releases everything this pass claimed. Cleanup functions call this
   * so a subsequent `init*()` can re-bind after listeners were removed.
   */
  release(): void;
}

/** Creates one `init*()` pass's claim set for a given behavior mark. */
export function initMarks(attribute: string): InitClaims {
  const claimed: Element[] = [];
  return {
    claim(el: Element): boolean {
      if (el.hasAttribute(attribute)) return false;
      el.setAttribute(attribute, "");
      claimed.push(el);
      return true;
    },
    release(): void {
      for (const el of claimed) el.removeAttribute(attribute);
      claimed.length = 0;
    },
  };
}

/**
 * Programmatic focus without page scroll: restores a dialog's invoker
 * (or any other target) without the browser scrolling it into view —
 * an unwanted viewport jump right as the overlay closes.
 */
export function focusWithoutScroll(target: HTMLElement): void {
  target.focus({ preventScroll: true });
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
