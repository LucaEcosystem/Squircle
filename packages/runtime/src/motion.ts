/**
 * Reduced-motion helpers (unchanged Stage 1–2 API).
 */

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Subscribes to reduced-motion changes. Returns an unsubscribe function.
 */
export function onReducedMotionChange(
  callback: (reduced: boolean) => void,
): () => void {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  const listener = (event: MediaQueryListEvent): void => {
    callback(event.matches);
  };
  query.addEventListener("change", listener);
  return () => {
    query.removeEventListener("change", listener);
  };
}
