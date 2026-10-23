/**
 * Edge-aware popover positioning over the native popover API.
 *
 * Showing, hiding, and light-dismiss stay native (`popovertarget`,
 * `popover="auto"`). This module only PLACES anchored popovers:
 * `data-sq-popover-anchor="<trigger-id>"` positions the popover beside
 * its trigger whenever it opens, trying placements in a resolved order
 * (requested first, then its opposite, then the perpendicular pair —
 * APG-style collision flipping), and clamps inside the viewport. While
 * a popover stays open, scrolling or resizing the page repositions it,
 * so it never visually detaches from its trigger. Unanchored popovers
 * keep the platform default (centered) — complete without JavaScript.
 */

import { clampToViewport, initMarks, INITIALIZED_ATTRS } from "./dom.js";

export type PopoverPlacement = "top" | "bottom" | "left" | "right";

export interface PopoverOptions {
  placement?: PopoverPlacement;
  /** Gap between trigger and popover, in px. Default 8. */
  offset?: number;
}

interface Candidate {
  left: number;
  top: number;
  width: number;
  height: number;
}

const VIEWPORT_MARGIN = 8;

const PLACEMENTS: readonly PopoverPlacement[] = [
  "top",
  "bottom",
  "left",
  "right",
];

function normalizePlacement(value: string): PopoverPlacement {
  if ((PLACEMENTS as readonly string[]).includes(value)) {
    return value as PopoverPlacement;
  }
  console.warn(
    `[squircle] Unknown popover placement "${value}" — falling back to "bottom". ` +
      `Valid placements: ${PLACEMENTS.join(", ")}.`,
  );
  return "bottom";
}

/** Ordered positions for a placement: requested, opposite, perpendicular. */
function candidateOrder(
  placement: PopoverPlacement,
): readonly PopoverPlacement[] {
  switch (placement) {
    case "top":
      return ["top", "bottom", "left", "right"];
    case "bottom":
      return ["bottom", "top", "left", "right"];
    case "left":
      return ["left", "right", "top", "bottom"];
    case "right":
      return ["right", "left", "top", "bottom"];
  }
}

function candidateFor(
  placement: PopoverPlacement,
  anchor: DOMRect,
  width: number,
  height: number,
  offset: number,
): Candidate {
  const sideTop = anchor.top + (anchor.height - height) / 2;
  switch (placement) {
    case "bottom":
      return {
        left: anchor.left,
        top: anchor.bottom + offset,
        width,
        height,
      };
    case "top":
      return {
        left: anchor.left,
        top: anchor.top - offset - height,
        width,
        height,
      };
    case "left":
      return {
        left: anchor.left - offset - width,
        top: sideTop,
        width,
        height,
      };
    case "right":
      return {
        left: anchor.right + offset,
        top: sideTop,
        width,
        height,
      };
  }
}

function fitsInViewport(rect: Candidate): boolean {
  return (
    rect.left >= VIEWPORT_MARGIN &&
    rect.top >= VIEWPORT_MARGIN &&
    rect.left + rect.width <= window.innerWidth - VIEWPORT_MARGIN &&
    rect.top + rect.height <= window.innerHeight - VIEWPORT_MARGIN
  );
}

export function positionPopover(
  trigger: Element,
  popover: HTMLElement,
  options: PopoverOptions = {},
): void {
  const placement = normalizePlacement(options.placement ?? "bottom");
  const offset = options.offset ?? 8;
  const anchor = trigger.getBoundingClientRect();
  const width = popover.offsetWidth;
  const height = popover.offsetHeight;
  if (width === 0 && height === 0) return; // not laid out — leave native.

  const preferred = candidateFor(placement, anchor, width, height, offset);
  let chosen: Candidate = preferred;
  for (const candidate of candidateOrder(placement)) {
    const rect = candidateFor(candidate, anchor, width, height, offset);
    if (fitsInViewport(rect)) {
      chosen = rect;
      break;
    }
  }

  const clamped =
    chosen === preferred
      ? clampToViewport(preferred.left, preferred.top, width, height)
      : { left: chosen.left, top: chosen.top };
  popover.style.position = "fixed";
  popover.style.inset = "auto";
  popover.style.margin = "0";
  popover.style.left = `${clamped.left}px`;
  popover.style.top = `${clamped.top}px`;
}

interface ToggleEvent extends Event {
  readonly newState?: string;
}

interface AnchoredPopover {
  triggerId: string;
  placement: PopoverPlacement;
}

/**
 * Declarative wiring (idempotent): popovers carrying
 * `data-sq-popover-anchor="<trigger-id>"` are positioned beside their
 * trigger whenever they open, and kept beside it while the page scrolls
 * or resizes. Returns a cleanup function.
 */
export function initPopovers(root: ParentNode = document): () => void {
  const controller = new AbortController();
  const signal = controller.signal;
  const marks = initMarks(INITIALIZED_ATTRS.popover);
  const open = new Map<HTMLElement, AnchoredPopover>();

  const reposition = (): void => {
    for (const [popover, config] of open) {
      if (!popover.isConnected || !popover.matches(":popover-open")) {
        open.delete(popover);
        continue;
      }
      const trigger = document.getElementById(config.triggerId);
      if (trigger) {
        positionPopover(trigger, popover, { placement: config.placement });
      }
    }
  };

  window.addEventListener("scroll", reposition, {
    signal,
    capture: true,
    passive: true,
  });
  window.addEventListener("resize", reposition, { signal });

  for (const popover of root.querySelectorAll("[data-sq-popover-anchor]")) {
    if (!(popover instanceof HTMLElement)) continue;
    // Re-runs are safe: re-adding the same toggle listener is avoided
    // by claiming the popover; options come from data attributes.
    if (!marks.claim(popover)) continue;
    const triggerId = popover.getAttribute("data-sq-popover-anchor") ?? "";
    const rawPlacement = popover.getAttribute("data-sq-popover-placement");
    const placement =
      rawPlacement !== null ? normalizePlacement(rawPlacement) : "bottom";
    popover.addEventListener(
      "toggle",
      (event) => {
        // Older engines omit `newState`: fall back to the live state.
        const opened =
          (event as ToggleEvent).newState !== undefined
            ? (event as ToggleEvent).newState === "open"
            : popover.matches(":popover-open");
        if (opened) {
          const trigger = document.getElementById(triggerId);
          if (trigger) {
            positionPopover(trigger, popover, { placement });
            open.set(popover, { triggerId, placement });
          }
        } else {
          open.delete(popover);
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
