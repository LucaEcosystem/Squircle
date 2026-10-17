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
  alreadyInitialized,
  focusableChildren,
  markInitialized,
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

function placeInitialFocus(dialog: HTMLDialogElement): void {
  const autofocus = dialog.querySelector("[autofocus]");
  if (autofocus instanceof HTMLElement) {
    autofocus.focus();
    return;
  }
  const first = focusableChildren(dialog)[0];
  if (first) {
    first.focus();
    return;
  }
  // Nothing focusable: make the dialog itself the target so focus is
  // never lost to <body> (prevents focus-loss announcements).
  if (!dialog.hasAttribute("tabindex")) {
    dialog.setAttribute("tabindex", "-1");
  }
  dialog.focus();
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

/** Closes a dialog and restores focus to its invoker (unless disabled). */
export function closeDialog(
  dialog: HTMLDialogElement,
  restoreFocus = true,
): void {
  if (!dialog.open) return;
  dialog.close();
  if (!restoreFocus) return;
  const invoker = invokers.get(dialog);
  if (invoker instanceof HTMLElement) invoker.focus();
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

  for (const opener of root.querySelectorAll("[data-sq-dialog-open]")) {
    if (alreadyInitialized(opener)) continue;
    markInitialized(opener);
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
    if (alreadyInitialized(dialog)) continue;
    markInitialized(dialog);
    // Native `close` (Escape, API, backdrop) restores the invoker on
    // every engine: Chromium does this natively, WebKit leaves focus
    // on <body>. Double-focus with closeDialog() is harmless (same
    // element), and the map entry is consumed to avoid stale refs.
    dialog.addEventListener(
      "close",
      () => {
        if (!(dialog instanceof HTMLDialogElement)) return;
        const invoker = invokers.get(dialog);
        invokers.delete(dialog);
        if (invoker instanceof HTMLElement) invoker.focus();
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
  };
}
