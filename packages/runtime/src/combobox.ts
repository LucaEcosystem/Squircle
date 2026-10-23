/**
 * Combobox: a native text input driving a listbox panel (ARIA 1.2
 * "combobox + listbox" pattern). The input keeps every native behavior —
 * it is always the value carrier, so forms submit it without help.
 *
 * Markup contract:
 *
 *   <input id="cb" role="combobox" aria-expanded="false"
 *          aria-controls="cb-list" aria-autocomplete="list"
 *          autocomplete="off" data-sq-combobox>
 *   <ul id="cb-list" class="sq-combobox__list" role="listbox" hidden>
 *     <li role="option" data-value="DE">Germany<span class="sq-combobox__meta">DE</span></li>
 *     <li class="sq-combobox__empty" hidden>No matches</li>
 *   </ul>
 *
 * - The list panel must be positioned/hidden by the CSS layer; this
 *   module only toggles state.
 * - Options live in the author's list: content (avatars, meta) is
 *   theirs to compose; `data-value` overrides what gets written back.
 * - `data-sq-combobox-filter="off"` hands matching back to the author
 *   (server-driven lists never close under client filtering).
 */

import { initMarks, INITIALIZED_ATTRS } from "./dom.js";

/** Generated ids for options the author did not give one. */
const idPrefix = "sq-cb-opt-";
let generatedCounter = 0;

export interface ComboboxHandle {
  destroy(): void;
}

function optionLabel(option: HTMLElement): string {
  return (option.getAttribute("data-label") ?? option.textContent ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function createCombobox(input: HTMLInputElement): ComboboxHandle {
  const listId = input.getAttribute("aria-controls");
  const listElement = listId !== null ? document.getElementById(listId) : null;
  if (!(listElement instanceof HTMLElement)) return { destroy() {} };
  const list: HTMLElement = listElement;

  // Options live in the panel; the empty message (when authored) hides
  // with the list and reappears only when nothing matched. From here on
  // the narrowing holds: `list` is a present HTML element.
  const allOptions = [...list.querySelectorAll<HTMLElement>('[role="option"]')];
  const empty = list.querySelector<HTMLElement>(".sq-combobox__empty");
  const filterOff = input.getAttribute("data-sq-combobox-filter") === "off";

  for (const option of allOptions) {
    if (option.id === "") option.id = `${idPrefix}${generatedCounter++}`;
  }

  const signal = new AbortController().signal;
  let open = false;
  let selectedIndex = -1;
  let matched = allOptions.slice();
  let valueAtOpen = "";
  // Enter/selection commits survive Escape (the user chose); typing
  // that was merely explored restores on a second Escape.
  let committed = false;

  list.hidden = true;

  function isOpen(): boolean {
    return open;
  }

  function selectIndex(index: number, commit: boolean): void {
    const option = matched[index];
    if (option === undefined) return;
    for (const candidate of allOptions) {
      candidate.setAttribute("aria-selected", "false");
    }
    option.setAttribute("aria-selected", "true");
    input.setAttribute("aria-activedescendant", option.id);
    selectedIndex = index;
    if (commit) {
      const value = option.getAttribute("data-value") ?? optionLabel(option);
      if (value !== "") input.value = value;
      committed = true;
      close(false);
    } else {
      option.scrollIntoView({ block: "nearest" });
    }
  }

  function recompute(): void {
    const query = input.value.trim().toLowerCase();
    if (filterOff || query === "") {
      matched = allOptions.slice();
    } else {
      matched = allOptions.filter((option) =>
        optionLabel(option).toLowerCase().includes(query),
      );
    }
    for (const option of allOptions) {
      option.hidden = !matched.includes(option);
    }
    if (empty !== null) empty.hidden = matched.length > 0;
    selectedIndex = -1;
  }

  function move(step: number): void {
    if (matched.length === 0) return;
    const current = selectedIndex;
    const next =
      current === -1
        ? step > 0
          ? 0
          : matched.length - 1
        : (current + step + matched.length) % matched.length;
    selectIndex(next, false);
  }

  function jumpToEnd(edge: "first" | "last"): void {
    if (matched.length === 0) return;
    selectIndex(edge === "first" ? 0 : matched.length - 1, false);
  }

  function openList(): void {
    if (open) return;
    open = true;
    committed = false;
    valueAtOpen = input.value;
    recompute();
    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
  }

  function close(restore: boolean): void {
    if (!open) return;
    open = false;
    if (restore) input.value = valueAtOpen;
    list.hidden = true;
    input.removeAttribute("aria-activedescendant");
    input.setAttribute("aria-expanded", "false");
    for (const option of allOptions) {
      option.setAttribute("aria-selected", "false");
    }
    selectedIndex = -1;
  }

  input.addEventListener(
    "input",
    () => {
      if (filterOff && !open) return;
      openList();
      recompute();
      if (!filterOff) selectedIndex = -1;
    },
    { signal },
  );

  input.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (!open) openList();
        move(1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (!open) openList();
        move(-1);
      } else if (event.key === "Home" && open) {
        event.preventDefault();
        jumpToEnd("first");
      } else if (event.key === "End" && open) {
        event.preventDefault();
        jumpToEnd("last");
      } else if (event.key === "PageDown" && open) {
        event.preventDefault();
        move(5);
      } else if (event.key === "PageUp" && open) {
        event.preventDefault();
        move(-5);
      } else if (event.key === "Enter" && open && selectedIndex !== -1) {
        event.preventDefault();
        selectIndex(selectedIndex, true);
      } else if (event.key === "Escape") {
        if (open) {
          event.preventDefault();
          close(false); // First Escape: close, keep what was typed.
        } else if (
          !committed &&
          valueAtOpen !== "" &&
          input.value !== valueAtOpen
        ) {
          // Second Escape: revert the explored text to the open-time one.
          event.preventDefault();
          input.value = valueAtOpen;
        }
      } else if (event.key === "Tab" && open) {
        close(false); // focus travels; never trap.
      }
    },
    { signal },
  );

  list.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const option = target.closest<HTMLElement>('[role="option"]');
      if (option === null) return;
      const index = matched.indexOf(option);
      if (index !== -1) selectIndex(index, true);
    },
    { signal },
  );

  // pointerdown keeps text-selection drags from pre-empting the click.
  document.addEventListener(
    "pointerdown",
    (event) => {
      if (!isOpen()) return;
      const target = event.target;
      if (
        target instanceof Node &&
        (list.contains(target) || input === target)
      ) {
        return;
      }
      close(false);
    },
    { signal },
  );

  // Lost focus without Tab (mouse click to the outside): close silently.
  input.addEventListener(
    "focusout",
    () => {
      window.setTimeout(() => {
        if (!isOpen()) return;
        const active = document.activeElement;
        if (
          active !== input &&
          !(active instanceof Node && list.contains(active))
        ) {
          close(false);
        }
      }, 0);
    },
    { signal },
  );

  return {
    destroy(): void {
      close(false);
    },
  };
}

/**
 * Declarative wiring (idempotent): every `[data-sq-combobox]` input with
 * `aria-controls` binds to its listbox. Returns a cleanup function.
 */
export function initComboboxes(root: ParentNode = document): () => void {
  const handles: ComboboxHandle[] = [];
  const marks = initMarks(INITIALIZED_ATTRS.combobox);
  for (const trigger of root.querySelectorAll("[data-sq-combobox]")) {
    if (!(trigger instanceof HTMLInputElement)) continue;
    if (!trigger.hasAttribute("aria-controls")) continue;
    if (!marks.claim(trigger)) continue;
    trigger.setAttribute("role", "combobox");
    if (!trigger.hasAttribute("aria-expanded")) {
      trigger.setAttribute("aria-expanded", "false");
    }
    if (!trigger.hasAttribute("aria-autocomplete")) {
      trigger.setAttribute("aria-autocomplete", "list");
    }
    handles.push(createCombobox(trigger));
  }
  return () => {
    for (const handle of handles) handle.destroy();
    marks.release();
  };
}
