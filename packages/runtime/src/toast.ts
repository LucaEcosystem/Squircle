/**
 * Transient toast notifications.
 *
 * Toasts are for supplementary status ("Saved", "Export ready") — never
 * the only copy of essential information (that belongs in alerts or
 * inline text). The region is a live area; assertion level follows the
 * tone (error asserts, everything else is polite). Auto-dismiss pauses
 * while the toast is hovered or focused; an auto-dismiss that expired
 * during such a pause takes effect when the pause ends (never stays
 * hidden forever, never lingers frozen). Every toast has a dismiss
 * button — `dismissLabel`, or the region's
 * `data-sq-toast-dismiss-label` attribute for localized UIs. Entrance
 * uses the `sq-rise-in` animation, flattened under reduced motion.
 * Deterministic cleanup: each `notify()` returns a dismiss function,
 * and `dismissAll()` clears a region INCLUDING its pending timers.
 */

export type ToastTone = "info" | "success" | "warning" | "error";

export interface ToastOptions {
  /** Visual tone + announcement level. Default "info". */
  tone?: ToastTone;
  /** Auto-dismiss after ms. Default 6000. 0 (or negative) = persist. */
  duration?: number;
  /** Region to append to. Defaults to `[data-sq-toasts]`, created if missing. */
  region?: HTMLElement;
  /**
   * Dismiss button label for screen readers. Defaults to the region's
   * `data-sq-toast-dismiss-label` attribute, then "Dismiss notification".
   */
  dismissLabel?: string;
}

export interface ToastHandle {
  readonly element: HTMLElement;
  dismiss(): void;
}

/** Live toasts by handle, with their region — `dismissAll` uses this to
 * cancel not just the DOM nodes but each toast's pending auto-dismiss. */
const liveToasts = new Map<ToastHandle, HTMLElement>();

function ensureRegion(preferred?: HTMLElement): HTMLElement {
  if (preferred instanceof HTMLElement) return preferred;
  const existing = document.querySelector("[data-sq-toasts]");
  if (existing instanceof HTMLElement) return existing;
  const region = document.createElement("div");
  region.className = "sq-toasts";
  region.setAttribute("data-sq-toasts", "");
  region.setAttribute("role", "status");
  document.body.append(region);
  return region;
}

/** Repairs a live region the author forgot to role (announcements
 * silently fail without `role="status"`); labeled/roled regions are
 * left untouched. */
function repairLiveRegion(region: HTMLElement): void {
  if (!region.hasAttribute("role")) region.setAttribute("role", "status");
}

/**
 * Shows a toast with plain-text `message` (never HTML — callers pass
 * strings, so injection is impossible by construction). Returns a
 * handle; the toast removes itself after `duration` (paused on hover
 * or focus) or when dismissed.
 */
export function notify(
  message: string,
  options: ToastOptions = {},
): ToastHandle {
  // Called before <body> exists (early <head> scripts): defer the whole
  // build to DOMContentLoaded instead of crashing on the region append.
  // The returned handle stays functional: `dismiss()` cancels the
  // deferred toast, `element` resolves once it exists.
  if (!document.body && options.region === undefined) {
    const flush = (): void => void notify(message, options);
    document.addEventListener("DOMContentLoaded", flush, { once: true });
    const placeholder = document.createElement("div");
    return {
      get element(): HTMLElement {
        return placeholder;
      },
      dismiss() {
        document.removeEventListener("DOMContentLoaded", flush);
      },
    };
  }

  const tone = options.tone ?? "info";
  const duration = options.duration ?? 6000;
  const region = ensureRegion(options.region);
  repairLiveRegion(region);

  const toast = document.createElement("div");
  toast.className = `sq-toast${tone === "info" ? "" : ` sq-toast--${tone}`}`;
  // Errors assert; everything else is polite via the region's status role.
  if (tone === "error") toast.setAttribute("role", "alert");

  const text = document.createElement("p");
  text.className = "sq-toast__text";
  text.textContent = message;
  toast.append(text);

  const dismissButton = document.createElement("button");
  dismissButton.className = "sq-button sq-button--tertiary sq-button--small";
  dismissButton.type = "button";
  dismissButton.setAttribute(
    "aria-label",
    options.dismissLabel ??
      region.getAttribute("data-sq-toast-dismiss-label") ??
      "Dismiss notification",
  );
  dismissButton.textContent = "✕";
  toast.append(dismissButton);

  let timer: ReturnType<typeof setTimeout> | null = null;
  let remaining = duration;
  let startedAt = 0;

  const clear = (): void => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const handle: ToastHandle = {
    element: toast,
    dismiss() {
      clear();
      liveToasts.delete(handle);
      toast.remove();
    },
  };

  liveToasts.set(handle, region);
  dismissButton.addEventListener("click", () => handle.dismiss());

  if (remaining > 0) {
    const arm = (): void => {
      clear();
      startedAt = Date.now();
      timer = setTimeout(() => {
        if (!toast.isConnected) return; // already removed another way
        handle.dismiss();
      }, remaining);
    };
    // Pause the countdown while the user reads or hovers; an expiry
    // that elapsed during the pause lands when the pause ends.
    toast.addEventListener("mouseenter", () => {
      if (timer !== null) {
        remaining = Math.max(0, remaining - (Date.now() - startedAt));
        clear();
      }
    });
    toast.addEventListener("mouseleave", () => {
      if (!toast.isConnected) return;
      if (remaining > 0) arm();
      else handle.dismiss();
    });
    toast.addEventListener("focusin", () => {
      if (timer !== null) {
        remaining = Math.max(0, remaining - (Date.now() - startedAt));
        clear();
      }
    });
    toast.addEventListener("focusout", () => {
      if (!toast.isConnected) return;
      if (remaining > 0) arm();
      else handle.dismiss();
    });
    arm();
  }

  region.append(toast);
  return handle;
}

/**
 * Dismisses every toast in `region` (default: the shared region) —
 * including toasts whose auto-dismiss timer is about to fire, which a
 * bare DOM removal would leave running on orphaned nodes.
 */
export function dismissAll(region?: HTMLElement): void {
  const target =
    region instanceof HTMLElement
      ? region
      : document.querySelector("[data-sq-toasts]");
  if (!(target instanceof HTMLElement)) return;
  for (const [handle, toastRegion] of [...liveToasts]) {
    if (toastRegion === target) handle.dismiss();
  }
}
