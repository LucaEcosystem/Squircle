/**
 * Accessible dialog behavior over native `<dialog>`.
 *
 * The platform provides modality, Escape, and focus containment for
 * `showModal()` — this module adds only what authors repeat by hand:
 * invoker-tracked focus restoration, opt-in backdrop dismissal, and
 * declarative open/close wiring. Non-modal dialogs (`show()`) keep
 * native behavior with the same focus guarantees.
 *
 * Backdrop policy (documented, enforced): clicking the backdrop closes
 * the dialog ONLY when it carries `data-sq-dismiss="backdrop"`. Dialogs
 * frequently guard unsaved work; silent backdrop dismissal would lose it.
 */

import {
  focusWithoutScroll,
  focusableChildren,
  INITIALIZED_ATTRS,
  initMarks,
} from "./dom.js";

export interface DialogOptions {
  /** Default true. False uses `show()` (non-modal). */
  modal?: boolean;
  /**
   * Element to restore focus to on close. Defaults to
   * `document.activeElement` at open time (unless it is `<body>`,
   * which some engines report when buttons are mouse-clicked without
   * taking focus). Declarative openers pass themselves automatically.
   */
  invoker?: Element | null;
}

const invokers = new WeakMap<HTMLDialogElement, Element | null>();

/**
 * One-shot suppression flag: `closeDialog(dialog, false)` closes without
 * restoring focus, but the module's own `close` listener (Esc, backdrop,
 * nesting) would still restore. `closeDialog` plants the flag; the next
 * `close` event consumes it.
 */
const suppressRestore = new WeakSet<HTMLDialogElement>();

function placeInitialFocus(dialog: HTMLDialogElement): void {
  const autofocus = dialog.querySelector("[autofocus]");
  if (autofocus instanceof HTMLElement) {
    autofocus.focus({ preventScroll: true });
    return;
  }
  const first = focusableChildren(dialog)[0];
  if (first) {
    first.focus({ preventScroll: true });
    return;
  }
  // Nothing focusable: make the dialog itself the target so focus is
  // never lost to <body> (prevents focus-loss announcements).
  if (!dialog.hasAttribute("tabindex")) {
    dialog.setAttribute("tabindex", "-1");
  }
  dialog.focus({ preventScroll: true });
}

/** Opens a dialog (idempotent — opening an open dialog is a no-op). */
export function openDialog(
  dialog: HTMLDialogElement,
  options: DialogOptions = {},
): void {
  if (dialog.open) return;
  const active = document.activeElement;
  invokers.set(
    dialog,
    options.invoker ??
      (active instanceof HTMLElement && active !== document.body
        ? active
        : null),
  );
  if (options.modal === false) dialog.show();
  else dialog.showModal();
  placeInitialFocus(dialog);
}

/**
 * Closes a dialog. Restores focus to the invoker by default;
 * `restoreFocus: false` closes without moving focus — which drops the
 * platform's own close-restoration as well (Chromium refocuses the
 * opener natively). Leaving or closing an overlay never scrolls the
 * page: an engine-baked scroll inside `close()` is set back.
 */
export function closeDialog(
  dialog: HTMLDialogElement,
  restoreFocus = true,
): void {
  if (!dialog.open) return;
  const wakeup = !restoreFocus;
  if (wakeup) suppressRestore.add(dialog);
  const invoker = invokers.get(dialog);
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  dialog.close();
  if (window.scrollX !== scrollX || window.scrollY !== scrollY) {
    window.scrollTo({ left: scrollX, top: scrollY, behavior: "instant" });
  }
  if (!wakeup) {
    if (invoker instanceof HTMLElement) focusWithoutScroll(invoker);
    return;
  }
  // Chromium hands focus back to the opener inside close(); drop it so
  // "restore: false" lands on a clean, unfocused page state.
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
  // The suppression flag was either consumed by the wiring's close
  // listener (synchronously during close()) or nobody will ever fire —
  // drop it so unwired dialogs' future closes restore normally.
  if (!dialog.hasAttribute(INITIALIZED_ATTRS.dialog)) {
    suppressRestore.delete(dialog);
  }
}

/** True while the dialog is open (modal or not). */
export function isDialogOpen(dialog: HTMLDialogElement): boolean {
  return dialog.open;
}

function dialogFromId(id: string): HTMLDialogElement | null {
  const el = document.getElementById(id);
  return el instanceof HTMLDialogElement ? el : null;
}

/**
 * Declarative wiring (idempotent; safe to call more than once):
 *  - `[data-sq-dialog-open="<dialog-id>"]` opens on click.
 *  - `[data-sq-dialog-close]` inside a dialog closes it on click.
 *  - Backdrop clicks close only dialogs with
 *    `data-sq-dismiss="backdrop"`.
 * Returns a cleanup function removing all listeners.
 */
export function initDialogs(root: ParentNode = document): () => void {
  const controller = new AbortController();
  const signal = controller.signal;
  const marks = initMarks(INITIALIZED_ATTRS.dialog);

  for (const opener of root.querySelectorAll("[data-sq-dialog-open]")) {
    if (!marks.claim(opener)) continue;
    opener.addEventListener(
      "click",
      () => {
        const dialog = dialogFromId(
          opener.getAttribute("data-sq-dialog-open") ?? "",
        );
        // The opener is the invoker: some engines (WebKit) do not move
        // focus to buttons on mouse click, so activeElement alone cannot
        // identify where focus must return.
        if (dialog) openDialog(dialog, { invoker: opener });
      },
      { signal },
    );
  }

  for (const dialog of root.querySelectorAll("dialog.sq-dialog")) {
    if (!(dialog instanceof HTMLDialogElement)) continue;
    if (!marks.claim(dialog)) continue;
    // Native `close` (Escape, API, backdrop) restores the invoker on
    // every engine: Chromium does this natively, WebKit leaves focus
    // on <body>. Double-focus with closeDialog() is harmless (same
    // element), and the map entry is consumed to avoid stale refs.
    // Scrolling is suppressed: closing an overlay must not jump the
    // viewport back to the opener.
    dialog.addEventListener(
      "close",
      () => {
        const invoker = invokers.get(dialog);
        invokers.delete(dialog);
        if (suppressRestore.delete(dialog)) return;
        if (invoker instanceof HTMLElement) focusWithoutScroll(invoker);
      },
      { signal },
    );
    dialog.addEventListener(
      "click",
      (event) => {
        if (!(event.target instanceof Element)) return;
        if (event.target.closest("[data-sq-dialog-close]")) {
          const host = event.target.closest("dialog");
          if (host instanceof HTMLDialogElement) closeDialog(host);
          return;
        }
        // Backdrop = the dialog element itself (not its content).
        if (
          event.target === dialog &&
          dialog.getAttribute("data-sq-dismiss") === "backdrop"
        ) {
          closeDialog(dialog as HTMLDialogElement);
        }
      },
      { signal },
    );
  }

  return () => {
    controller.abort();
    marks.release();
  };
}
