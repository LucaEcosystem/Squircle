/**
 * Accessible tooltips: non-interactive supplementary hints.
 *
 * Contract: content comes from `data-sq-tooltip` (plain text — never
 * HTML, never essential-only information; the page must make sense
 * without it). One shared live element per `initTooltips()` call, so at
 * most one tooltip exists at a time. Shown on hover AND keyboard focus,
 * hidden on leave, blur, Escape, and scroll. Instant show/hide —
 * reduced-motion safe by construction. `aria-describedby` wiring is
 * transient: the tooltip's id is appended while the tooltip shows and
 * removed when it hides, preserving any author-provided descriptions.
 */

import { clampToViewport, initMarks, INITIALIZED_ATTRS } from "./dom.js";

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

function describedTokens(trigger: HTMLElement): string[] {
  return (trigger.getAttribute("aria-describedby") ?? "")
    .split(/\s+/)
    .filter((token) => token !== "");
}

function describeWith(trigger: HTMLElement, id: string): void {
  const tokens = describedTokens(trigger);
  if (!tokens.includes(id)) tokens.push(id);
  trigger.setAttribute("aria-describedby", tokens.join(" "));
}

function describeWithout(trigger: HTMLElement, id: string): void {
  const tokens = describedTokens(trigger).filter((token) => token !== id);
  if (tokens.length > 0)
    trigger.setAttribute("aria-describedby", tokens.join(" "));
  else trigger.removeAttribute("aria-describedby");
}

/**
 * Declarative wiring (idempotent): every `[data-sq-tooltip]` shows its
 * text on hover/focus. Returns a cleanup function removing listeners
 * and the shared element (if this call created it).
 */
export function initTooltips(root: ParentNode = document): () => void {
  const controller = new AbortController();
  const signal = controller.signal;
  const marks = initMarks(INITIALIZED_ATTRS.tooltip);
  const owned = document.getElementById("sq-tooltip") === null;
  const tip = ensureTooltipElement();
  let current: Element | null = null;

  const show = (trigger: Element): void => {
    const text = trigger.getAttribute("data-sq-tooltip") ?? "";
    if (text.trim() === "") return;
    current = trigger;
    tip.textContent = text;
    describeWith(trigger as HTMLElement, tip.id);
    placeNear(tip, trigger);
  };

  const hide = (): void => {
    tip.hidden = true;
    if (current instanceof HTMLElement) describeWithout(current, tip.id);
    current = null;
  };

  for (const trigger of root.querySelectorAll("[data-sq-tooltip]")) {
    if (!(trigger instanceof HTMLElement)) continue;
    if (!marks.claim(trigger)) continue;
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
    hide(); // leaves no dangling aria-describedby on a removed element.
    controller.abort();
    marks.release();
    if (owned) tip.remove();
  };
}
