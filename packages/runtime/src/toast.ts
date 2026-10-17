/**
 * Transient toast notifications.
 *
 * Toasts are for supplementary status ("Saved", "Export ready") — never
 * the only copy of essential information (that belongs in alerts or
 * inline text). The region is a live area; assertion level follows the
 * tone (error asserts, everything else is polite). Auto-dismiss pauses
 * while the toast is hovered or focused, and every toast has a dismiss
 * button. No slide/fade animation — instant both ways, reduced-motion
 * safe by construction. Deterministic cleanup: each `notify()` returns
 * a dismiss function, and `dismissAll()` clears a region.
 */

export type ToastTone = "info" | "success" | "warning" | "error";

export interface ToastOptions {
  /** Visual tone + announcement level. Default "info". */
  tone?: ToastTone;
  /** Auto-dismiss after ms. Default 6000. 0 (or negative) = persist. */
  duration?: number;
  /** Region to append to. Defaults to `[data-sq-toasts]`, created if missing. */
  region?: HTMLElement;
}

export interface ToastHandle {
  readonly element: HTMLElement;
  dismiss(): void;
}

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
  const tone = options.tone ?? "info";
  const duration = options.duration ?? 6000;
  const region = ensureRegion(options.region);

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
  dismissButton.setAttribute("aria-label", "Dismiss notification");
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
      toast.remove();
    },
  };

  dismissButton.addEventListener("click", () => handle.dismiss());

  if (remaining > 0) {
    const arm = (): void => {
      clear();
      startedAt = Date.now();
      timer = setTimeout(() => handle.dismiss(), remaining);
    };
    // Pause the countdown while the user reads or hovers.
    toast.addEventListener("mouseenter", () => {
      if (timer !== null) {
        remaining -= Date.now() - startedAt;
        clear();
      }
    });
    toast.addEventListener("mouseleave", () => {
      if (remaining > 0) arm();
    });
    toast.addEventListener("focusin", () => {
      if (timer !== null) {
        remaining -= Date.now() - startedAt;
        clear();
      }
    });
    toast.addEventListener("focusout", () => {
      if (remaining > 0) arm();
    });
    arm();
  }

  region.append(toast);
  return handle;
}

/** Dismisses every toast in `region` (default: the shared region). */
export function dismissAll(region?: HTMLElement): void {
  const target =
    region instanceof HTMLElement
      ? region
      : document.querySelector("[data-sq-toasts]");
  if (!(target instanceof HTMLElement)) return;
  for (const toast of target.querySelectorAll(".sq-toast")) {
    toast.remove();
  }
}
