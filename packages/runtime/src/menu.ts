/**
 * Accessible action menus (`role="menu"` + `menuitem`s).
 *
 * Authors own the semantics (roles, labels, grouping); this module owns
 * the behavior: toggle, arrow/Home/End navigation, activation, Escape
 * and Tab dismissal, click-outside dismissal, and focus restoration.
 * Type-ahead is intentionally unsupported (documented in OVERLAYS.md).
 * Menus are for ACTIONS — navigation uses links (LINKS.md).
 */

import {
  alreadyInitialized,
  focusableChildren,
  markInitialized,
} from "./dom.js";

export interface MenuHandle {
  open(): void;
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
 * Binds a trigger to a menu. The menu starts `hidden`; the trigger needs
 * `aria-haspopup="menu"` and `aria-controls="<menu-id>"` in markup.
 * Returns a handle; `destroy()` removes every listener.
 */
export function createMenu(
  trigger: HTMLElement,
  menu: HTMLElement,
): MenuHandle {
  const controller = new AbortController();
  const signal = controller.signal;
  let open = false;

  const api: MenuHandle = {
    open() {
      if (open) return;
      open = true;
      menu.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      const first = menuItems(menu)[0];
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
    },
  };

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
  const scope: ParentNode = root;
  for (const trigger of scope.querySelectorAll("[data-sq-menu]")) {
    if (!(trigger instanceof HTMLElement) || alreadyInitialized(trigger)) {
      continue;
    }
    const menuId = trigger.getAttribute("aria-controls");
    const menu = menuId ? document.getElementById(menuId) : null;
    if (!(menu instanceof HTMLElement)) continue;
    markInitialized(trigger);
    trigger.setAttribute("aria-haspopup", "menu");
    if (!trigger.hasAttribute("aria-expanded")) {
      trigger.setAttribute("aria-expanded", "false");
    }
    handles.push(createMenu(trigger, menu));
  }
  return () => {
    for (const handle of handles) handle.destroy();
  };
}
