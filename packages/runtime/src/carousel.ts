/**
 * Carousel: a scroll-snap track plus optional prev/next controls. The
 * track keyboard-pans natively; the runtime only adds buttons that
 * page by one slide and flip to `disabled` at the ends — real button
 * semantics, no synthetic focus clamping.
 *
 * Markup contract:
 *
 *   <div class="sq-carousel" data-sq-carousel>
 *     <div class="sq-carousel__track"> … `.sq-carousel__slide` children … </div>
 *     <div class="sq-carousel__controls">
 *       <button class="sq-carousel__prev" aria-label="Previous">…</button>
 *       <button class="sq-carousel__next" aria-label="Next">…</button>
 *     </div>
 *   </div>
 *
 * - Slides are fully authored content; `--half` shows two per page.
 * - Scroll behavior honors `prefers-reduced-motion` (live).
 * - End detection is sign-agnostic, so RTL tracks read correctly.
 */

import { prefersReducedMotion, onReducedMotionChange } from "./motion.js";
import { initMarks, INITIALIZED_ATTRS } from "./dom.js";

export interface CarouselHandle {
  next(): void;
  prev(): void;
  destroy(): void;
}

function atStart(track: HTMLElement): boolean {
  return Math.abs(track.scrollLeft) < 1;
}

function atEnd(track: HTMLElement): boolean {
  const max = track.scrollWidth - track.clientWidth;
  // Engines may settle a clamped snap a few pixels short of the range
  // end; a small relative epsilon keeps the end state honest without
  // hiding real distance.
  const epsilon = Math.max(24, max * 0.02);
  return Math.abs(max - Math.abs(track.scrollLeft)) < epsilon;
}

function createCarousel(root: HTMLElement): CarouselHandle {
  const track =
    root instanceof HTMLElement && root.classList.contains("sq-carousel__track")
      ? root
      : (root.querySelector<HTMLElement>(".sq-carousel__track") ?? root);
  const prev = root.querySelector<HTMLButtonElement>(".sq-carousel__prev");
  const next = root.querySelector<HTMLButtonElement>(".sq-carousel__next");

  const controller = new AbortController();
  const { signal } = controller;

  let reduced = prefersReducedMotion();
  const motion = (): ScrollBehavior => (reduced ? "instant" : "smooth");

  function update(): void {
    if (
      inFlight !== null &&
      snapIndex(snapPositions(), logicalScroll()) === inFlight
    ) {
      inFlight = null;
    }
    if (prev !== null && !prev.disabled && atStart(track)) {
      prev.disabled = true;
    } else if (prev !== null && prev.disabled && !atStart(track)) {
      prev.disabled = false;
    }
    if (next !== null && !next.disabled && atEnd(track)) {
      next.disabled = true;
    } else if (next !== null && next.disabled && !atEnd(track)) {
      next.disabled = false;
    }
  }

  // Snap positions instead of raw deltas: rapid clicks land on the next
  // snap start regardless of how far the smooth scroll has run, so
  // paging never stalls or overshoots mid-animation. Positions are
  // relative to the first slide (all slides share an offsetParent) and
  // scroll values are negated under RTL, where engines expose negative
  // scrollLeft.
  function snapPositions(): number[] {
    const stops = track.querySelectorAll<HTMLElement>(".sq-carousel__slide");
    const first = stops[0] ?? null;
    if (first === null) return [0];
    const positions: number[] = [0];
    for (let i = 1; i < stops.length; i += 1) {
      const slide = stops[i];
      const left = slide?.offsetLeft ?? 0;
      positions.push(Math.max(left - first.offsetLeft, 0));
    }
    if (positions.length === 1) return [0];
    return positions;
  }

  function isRtl(): boolean {
    return getComputedStyle(track).direction === "rtl";
  }

  function logicalScroll(): number {
    return isRtl() ? -track.scrollLeft : track.scrollLeft;
  }

  function scrollToLogical(value: number, behavior: ScrollBehavior): void {
    track.scrollTo({ left: isRtl() ? -value : value, behavior });
  }

  function snapIndex(positions: number[], position: number): number {
    let best = 0;
    for (let i = 1; i < positions.length; i += 1) {
      const probe = positions[i];
      const bestAt = positions[best];
      if (probe !== undefined && bestAt !== undefined) {
        if (Math.abs(probe - position) < Math.abs(bestAt - position)) {
          best = i;
        }
      }
    }
    return best;
  }

  // The snap index the current animation is flying toward; rapid
  // clicks resolve against it instead of the mid-flight scroll, so a
  // second click always advances (or retracts) one more page.
  let inFlight: number | null = null;

  function page(direction: -1 | 1): void {
    const positions = snapPositions();
    const base =
      inFlight !== null ? (positions[inFlight] ?? 0) : logicalScroll();
    const index = snapIndex(positions, base);
    const target = Math.min(
      Math.max(index + direction, 0),
      positions.length - 1,
    );
    const at = positions[target];
    if (at === undefined) return;
    inFlight = target;
    scrollToLogical(at, motion());
  }

  prev?.addEventListener("click", () => page(-1), { signal });
  next?.addEventListener("click", () => page(1), { signal });

  let frame = 0;
  track.addEventListener(
    "scroll",
    () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    },
    { signal, passive: true },
  );

  const offMotion = onReducedMotionChange((value) => {
    reduced = value;
  });
  window.addEventListener("resize", update, { signal, passive: true });
  update();

  return {
    next() {
      page(1);
    },
    prev() {
      page(-1);
    },
    destroy(): void {
      cancelAnimationFrame(frame);
      offMotion();
      controller.abort();
    },
  };
}

/**
 * Declarative wiring (idempotent): every `[data-sq-carousel]` element
 * binds its track and optional controls. Returns a cleanup function.
 */
export function initCarousels(root: ParentNode = document): () => void {
  const handles: CarouselHandle[] = [];
  const marks = initMarks(INITIALIZED_ATTRS.carousel);
  for (const carousel of root.querySelectorAll("[data-sq-carousel]")) {
    if (!(carousel instanceof HTMLElement)) continue;
    if (!carousel.querySelector(".sq-carousel__track")) continue;
    if (!marks.claim(carousel)) continue;
    handles.push(createCarousel(carousel));
  }
  return () => {
    for (const handle of handles) handle.destroy();
    marks.release();
  };
}
