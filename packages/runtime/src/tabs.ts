/**
 * Accessible tabs with automatic activation.
 *
 * Arrows move AND select (Home/End jump, click selects). Automatic
 * activation keeps focus and selection together — predictable for
 * keyboard, pointer, touch, and screen-reader users alike.
 * Authors write `role=tablist/tab/tabpanel` with `aria-controls`;
 * missing tab/panel ids are generated deterministically (`sq-tab-N`).
 * Panels hide with `hidden` (removes from tab order AND the
 * accessibility tree — no ARIA needed for that).
 */

import { alreadyInitialized, markInitialized } from "./dom.js";

export interface TabsHandle {
  /** Selects a tab by index (clamped). Focus follows. */
  select(index: number): void;
  /** Currently selected index. */
  readonly selectedIndex: number;
  destroy(): void;
}

let tabsSerial = 0;

function tabsIn(tablist: Element): HTMLElement[] {
  return [...tablist.querySelectorAll('[role="tab"]')].filter(
    (el): el is HTMLElement => el instanceof HTMLElement,
  );
}

function panelFor(tab: HTMLElement): HTMLElement | null {
  const id = tab.getAttribute("aria-controls");
  const panel = id ? document.getElementById(id) : null;
  return panel instanceof HTMLElement ? panel : null;
}

/**
 * Binds one tablist. Requires `role=tablist` with `role=tab` children
 * carrying `aria-controls`; panels need `role=tabpanel`. Returns a
 * handle; `destroy()` removes every listener.
 */
export function createTabs(tablist: HTMLElement): TabsHandle {
  const controller = new AbortController();
  const signal = controller.signal;
  const tabs = tabsIn(tablist);
  let selected = Math.max(
    0,
    tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true"),
  );

  // Deterministic ids where authors omitted them (explicit ids preferred).
  for (const tab of tabs) {
    if (!tab.id) tab.id = `sq-tab-${++tabsSerial}`;
    const panel = panelFor(tab);
    if (panel && !panel.hasAttribute("aria-labelledby")) {
      panel.setAttribute("aria-labelledby", tab.id);
    }
  }

  const api: TabsHandle = {
    select(index: number) {
      if (tabs.length === 0) return;
      const clamped = Math.min(Math.max(0, index), tabs.length - 1);
      selected = clamped;
      for (const [i, tab] of tabs.entries()) {
        const on = i === clamped;
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.tabIndex = on ? 0 : -1;
        const panel = panelFor(tab);
        if (panel) panel.hidden = !on;
        if (on) tab.focus();
      }
    },
    get selectedIndex() {
      return selected;
    },
    destroy() {
      controller.abort();
    },
  };

  for (const [i, tab] of tabs.entries()) {
    const on = i === selected;
    tab.setAttribute("aria-selected", on ? "true" : "false");
    tab.tabIndex = on ? 0 : -1;
    const panel = panelFor(tab);
    if (panel) panel.hidden = !on;
    tab.addEventListener("click", () => api.select(i), { signal });
    tab.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          api.select((i + 1) % tabs.length);
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          api.select((i - 1 + tabs.length) % tabs.length);
        } else if (event.key === "Home") {
          event.preventDefault();
          api.select(0);
        } else if (event.key === "End") {
          event.preventDefault();
          api.select(tabs.length - 1);
        }
      },
      { signal },
    );
  }

  return api;
}

/**
 * Declarative wiring (idempotent): every `[data-sq-tabs]` tablist binds.
 * Returns a cleanup function.
 */
export function initTabs(root: ParentNode = document): () => void {
  const handles: TabsHandle[] = [];
  for (const tablist of root.querySelectorAll("[data-sq-tabs]")) {
    if (!(tablist instanceof HTMLElement) || alreadyInitialized(tablist)) {
      continue;
    }
    markInitialized(tablist);
    handles.push(createTabs(tablist));
  }
  return () => {
    for (const handle of handles) handle.destroy();
  };
}
