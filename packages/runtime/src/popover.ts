/**
 * Edge-aware popover positioning over the native popover API.
 *
 * Showing, hiding, and light-dismiss stay native (`popovertarget`,
 * `popover="auto"`). This module only PLACES anchored popovers:
 * `data-sq-popover-anchor="<trigger-id>"` positions the popover beside
 * its trigger on `toggle`, preferring below, flipping above when space
 * runs out, and clamping inside the viewport. Unanchored popovers keep
 * the platform default (centered) — complete without JavaScript.
 */

import { clampToViewport } from "./dom.js";

export type PopoverPlacement = "top" | "bottom" | "left" | "right";

export interface PopoverOptions {
  placement?: PopoverPlacement;
  /** Gap between trigger and popover, in px. Default 8. */
  offset?: number;
}

export function positionPopover(
  trigger: Element,
  popover: HTMLElement,
  options: PopoverOptions = {},
): void {
  const placement = options.placement ?? "bottom";
  const offset = options.offset ?? 8;
  const anchor = trigger.getBoundingClientRect();
  const width = popover.offsetWidth;
  const height = popover.offsetHeight;
  if (width === 0 && height === 0) return; // not laid out — leave native.

  let left = anchor.left;
  let top = anchor.bottom + offset;
  const fitsBelow = anchor.bottom + offset + height <= window.innerHeight - 8;
  const fitsAbove = anchor.top - offset - height >= 8;

  if (placement === "bottom" && !fitsBelow && fitsAbove) {
    top = anchor.top - offset - height;
  } else if (placement === "top" && !fitsAbove && fitsBelow) {
    top = anchor.bottom + offset;
  } else if (placement === "top") {
    top = anchor.top - offset - height;
  } else if (placement === "left") {
    left = anchor.left - offset - width;
    top = anchor.top;
  } else if (placement === "right") {
    left = anchor.right + offset;
    top = anchor.top;
  }

  const clamped = clampToViewport(left, top, width, height);
  popover.style.position = "fixed";
  popover.style.inset = "auto";
  popover.style.margin = "0";
  popover.style.left = `${clamped.left}px`;
  popover.style.top = `${clamped.top}px`;
}

interface ToggleEvent extends Event {
  readonly newState?: string;
}

/**
 * Declarative wiring (idempotent): popovers carrying
 * `data-sq-popover-anchor="<trigger-id>"` are positioned beside their
 * trigger whenever they open. Returns a cleanup function.
 */
export function initPopovers(root: ParentNode = document): () => void {
  const controller = new AbortController();
  const signal = controller.signal;
  for (const popover of root.querySelectorAll("[data-sq-popover-anchor]")) {
    if (!(popover instanceof HTMLElement)) continue;
    // Re-runs are safe: re-adding the same toggle listener is avoided
    // by marking the popover; options come from data attributes.
    if (popover.hasAttribute("data-sq-initialized")) continue;
    popover.setAttribute("data-sq-initialized", "");
    const triggerId = popover.getAttribute("data-sq-popover-anchor") ?? "";
    const placement =
      (popover.getAttribute(
        "data-sq-popover-placement",
      ) as PopoverPlacement | null) ?? "bottom";
    popover.addEventListener(
      "toggle",
      (event) => {
        if ((event as ToggleEvent).newState !== "open") return;
        const trigger = document.getElementById(triggerId);
        if (trigger) positionPopover(trigger, popover, { placement });
      },
      { signal },
    );
  }
  return () => {
    controller.abort();
  };
}
