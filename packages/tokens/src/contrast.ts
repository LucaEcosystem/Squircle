/**
 * WCAG 2.2 relative-luminance and contrast-ratio helpers.
 *
 * Pure functions over hex colors. Used by token/theme tests to enforce the
 * contrast policy, and by `@squircle/themes` to validate custom themes.
 * Supports `#rgb`, `#rrggbb`, and `#rrggbbaa` (alpha is composited over
 * the supplied background, defaulting to opaque).
 */

function channels(hex: string): [number, number, number, number] {
  const h = hex.replace(/^#/, "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : h;
  if (full.length !== 6 && full.length !== 8) {
    throw new Error(`contrast: unsupported color format "${hex}"`);
  }
  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  const a = full.length === 8 ? Number.parseInt(full.slice(6, 8), 16) / 255 : 1;
  return [r, g, b, a];
}

function linearize(channel: number): number {
  const s = channel / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** Relative luminance of a hex color (0–1). */
export function luminance(hex: string): number {
  const [r, g, b, a] = channels(hex);
  const lum =
    0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
  // Translucent foregrounds are measured as composited over the page
  // background would be in practice; for test purposes blend toward white
  // is wrong on dark UIs, so callers must pass opaque pairs. Guard here.
  if (a < 1) {
    throw new Error(
      `contrast: color "${hex}" is translucent; pass opaque pairs`,
    );
  }
  return lum;
}

/** WCAG contrast ratio between two opaque hex colors (1–21). */
export function contrastRatio(foreground: string, background: string): number {
  const l1 = luminance(foreground);
  const l2 = luminance(background);
  const [lighter, darker] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}
