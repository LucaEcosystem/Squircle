/**
 * Accessible action menus (`role="menu"` + `menuitem`s).
 *
 * Authors own the semantics (roles, labels, grouping); this module owns
 * the behavior: toggle, arrow/Home/End navigation, activation, Escape
 * and Tab dismissal, click-outside dismissal, and focus restoration.
 * Type-ahead is intentionally unsupported (documented in OVERLAYS.md).
 * Menus are for ACTIONS — navigation uses links (LINKS.md).
 */

import { focusableChildren, initMarks, INITIALIZED_ATTRS } from "./dom.js";

export interface MenuOpenOptions {
  /**
   * Which menuitem receives focus on open. Default "first" (APG);
   * "last" supports the standard ArrowUp-open affordance.
   */
  focus?: "first" | "last";
}

export interface MenuHandle {
  open(options?: MenuOpenOptions): void;
  close(restoreFocus?: boolean): void;
  readonly isOpen: boolean;
  destroy(): void;
}

function menuItems(menu: HTMLElement): HTMLElement[] {
  return focusableChildren(menu).filter(
    (el) => el.getAttribute("aria-disabled") !== "true",
  );
}

/**
 * One binding per trigger: `createMenu` re-creating a handle for an
 * already-bound trigger would double-bind clicks (toggle -> open ->
 * close each press) and double-step arrow keys. First handle wins until
 * `destroy()`; two DIFFERENT triggers may share one menu element (each
 * gets its own handle).
 */
const menusByTrigger = new WeakMap<HTMLElement, MenuHandle>();

/**
 * Binds a trigger to a menu. The menu starts `hidden`; the trigger needs
 * `aria-haspopup="menu"` and `aria-controls="<menu-id>"` in markup.
 * Rebinding an already-bound trigger returns the existing handle.
 * Returns a handle; `destroy()` removes every listener.
 */
export function createMenu(
  trigger: HTMLElement,
  menu: HTMLElement,
): MenuHandle {
  const existing = menusByTrigger.get(trigger);
  if (existing) return existing;

  const controller = new AbortController();
  const signal = controller.signal;
  let open = false;

  const api: MenuHandle = {
    open(options: MenuOpenOptions = {}) {
      if (open) return;
      open = true;
      menu.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      const items = menuItems(menu);
      const first =
        options.focus === "last" ? items[items.length - 1] : items[0];
      if (first) first.focus();
    },
    close(restoreFocus = true) {
      if (!open) return;
      open = false;
      menu.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      if (restoreFocus) trigger.focus();
    },
    get isOpen() {
      return open;
    },
    destroy() {
      controller.abort();
      menusByTrigger.delete(trigger);
    },
  };

  menusByTrigger.set(trigger, api);

  const toggle = (): void => {
    if (api.isOpen) api.close();
    else api.open();
  };

  trigger.addEventListener("click", toggle, { signal });
  trigger.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "ArrowDown" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        api.open();
      } else if (event.key === "ArrowUp") {
        // APG: ArrowUp opens the menu and focuses its LAST item.
        event.preventDefault();
        api.open({ focus: "last" });
      }
    },
    { signal },
  );

  menu.addEventListener(
    "keydown",
    (event) => {
      const items = menuItems(menu);
      const current = items.indexOf(document.activeElement as HTMLElement);
      if (event.key === "Escape") {
        event.preventDefault();
        api.close(true);
      } else if (event.key === "Tab") {
        api.close(false); // let focus travel naturally — never trap.
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        const next = items[(current + 1) % items.length];
        if (next) next.focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        const prev = items[(current - 1 + items.length) % items.length];
        if (prev) prev.focus();
      } else if (event.key === "Home") {
        event.preventDefault();
        const first = items[0];
        if (first) first.focus();
      } else if (event.key === "End") {
        event.preventDefault();
        const last = items[items.length - 1];
        if (last) last.focus();
      }
      // Enter/Space on a focused item activates natively (click) — no
      // interception, so authors' handlers run untouched.
    },
    { signal },
  );

  document.addEventListener(
    "pointerdown",
    (event) => {
      if (!api.isOpen) return;
      const target = event.target;
      if (
        target instanceof Node &&
        !menu.contains(target) &&
        !trigger.contains(target)
      ) {
        api.close(false);
      }
    },
    { signal },
  );

  return api;
}

/**
 * Declarative wiring (idempotent): every `[data-sq-menu]` trigger with
 * `aria-controls` binds to its menu. Returns a cleanup function.
 */
export function initMenus(root: ParentNode = document): () => void {
  const handles: MenuHandle[] = [];
  const marks = initMarks(INITIALIZED_ATTRS.menu);
  const scope: ParentNode = root;
  for (const trigger of scope.querySelectorAll("[data-sq-menu]")) {
    if (!(trigger instanceof HTMLElement)) continue;
    const menuId = trigger.getAttribute("aria-controls");
    const menu = menuId ? document.getElementById(menuId) : null;
    if (!(menu instanceof HTMLElement) || !marks.claim(trigger)) continue;
    trigger.setAttribute("aria-haspopup", "menu");
    if (!trigger.hasAttribute("aria-expanded")) {
      trigger.setAttribute("aria-expanded", "false");
    }
    handles.push(createMenu(trigger, menu));
  }
  return () => {
    for (const handle of handles) handle.destroy();
    marks.release();
  };
}
