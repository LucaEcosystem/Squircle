/**
 * Accessible tooltips: non-interactive supplementary hints.
 *
 * Contract: content comes from `data-sq-tooltip` (plain text — never
 * HTML, never essential-only information; the page must make sense
 * without it). One shared live element per `initTooltips()` call, so at
 * most one tooltip exists at a time. Shown on hover AND keyboard focus,
 * hidden on leave, blur, Escape, and scroll. Instant show/hide —
 * reduced-motion safe by construction. `aria-describedby` wiring
 * preserves any author-provided descriptions.
 */

import { clampToViewport } from "./dom.js";

function ensureTooltipElement(): HTMLElement {
  let el = document.getElementById("sq-tooltip");
  if (el instanceof HTMLElement) return el;
  el = document.createElement("div");
  el.id = "sq-tooltip";
  el.className = "sq-tooltip";
  el.setAttribute("role", "tooltip");
  el.hidden = true;
  document.body.append(el);
  return el;
}

function placeNear(tip: HTMLElement, trigger: Element): void {
  tip.hidden = false; // measure laid out, then position.
  const anchor = trigger.getBoundingClientRect();
  const width = tip.offsetWidth;
  const height = tip.offsetHeight;
  const offset = 8;
  const above = anchor.top - offset - height;
  const top = above >= 8 ? above : anchor.bottom + offset;
  const left = anchor.left + anchor.width / 2 - width / 2;
  const clamped = clampToViewport(left, top, width, height);
  tip.style.position = "fixed";
  tip.style.left = `${clamped.left}px`;
  tip.style.top = `${clamped.top}px`;
}

function describedByWith(trigger: HTMLElement, id: string): void {
  const current = (trigger.getAttribute("aria-describedby") ?? "")
    .split(/\s+/)
    .filter((token) => token !== "");
  if (!current.includes(id)) current.push(id);
  trigger.setAttribute("aria-describedby", current.join(" "));
  if (!trigger.hasAttribute("data-sq-describedby")) {
    trigger.setAttribute("data-sq-describedby", "managed");
  }
}

/**
 * Declarative wiring (idempotent): every `[data-sq-tooltip]` shows its
 * text on hover/focus. Returns a cleanup function removing listeners
 * and the shared element (if this call created it).
 */
export function initTooltips(root: ParentNode = document): () => void {
  const controller = new AbortController();
  const signal = controller.signal;
  const owned = document.getElementById("sq-tooltip") === null;
  const tip = ensureTooltipElement();
  let current: Element | null = null;

  const show = (trigger: Element): void => {
    const text = trigger.getAttribute("data-sq-tooltip") ?? "";
    if (text.trim() === "") return;
    current = trigger;
    tip.textContent = text;
    describedByWith(trigger as HTMLElement, tip.id);
    placeNear(tip, trigger);
  };

  const hide = (): void => {
    tip.hidden = true;
    current = null;
  };

  for (const trigger of root.querySelectorAll("[data-sq-tooltip]")) {
    if (!(trigger instanceof HTMLElement)) continue;
    if (trigger.hasAttribute("data-sq-initialized")) continue;
    trigger.setAttribute("data-sq-initialized", "");
    trigger.addEventListener("mouseenter", () => show(trigger), { signal });
    trigger.addEventListener("mouseleave", hide, { signal });
    trigger.addEventListener("focus", () => show(trigger), { signal });
    trigger.addEventListener("blur", hide, { signal });
    trigger.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape" && current === trigger) hide();
      },
      { signal },
    );
  }
  document.addEventListener("scroll", hide, {
    signal,
    capture: true,
    passive: true,
  });

  return () => {
    controller.abort();
    if (owned) tip.remove();
  };
}
