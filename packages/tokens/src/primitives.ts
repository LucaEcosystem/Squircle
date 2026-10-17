/**
 * Squircle design tokens — primitive tier.
 *
 * Raw, purpose-agnostic values. Nothing outside the token system may
 * reference these directly for styling; components and themes consume the
 * semantic tier (`semantic.ts`) instead. Brand colors live here as facts
 * about the Luca identity; their *meaning* is assigned in `semantic.ts`.
 *
 * All values are serializable data (no functions) so they can be emitted
 * verbatim as CSS custom properties by `emit-css.ts`.
 */

export const primitives = {
  color: {
    // -- Luca brand palette (authoritative hex values, see spec section 6) --
    lucaNavy: "#1d2d44",
    lucaGold: "#ae9d5d",
    lucaVert: "#00ff00",
    lucaAzure: "#00bbff",
    lucaTangerine: "#ff8c00",

    // -- Navy ramp: deliberate tints/shades so surfaces can layer without
    //    painting Luca Navy indiscriminately on every surface. --
    navyInk: "#0b1222",
    navyDeep: "#131e33",
    navyRaised: "#243655",
    navyOverlay: "#2c4066",

    // -- Warm neutrals that harmonize with Luca Gold. --
    paper: "#f4f1e8",
    sand: "#e4ddc9",
    stone: "#a8a294",
    slate: "#6f6c62",

    // -- Cool grays for secondary text and borders on dark surfaces. --
    mist: "#c9d1e0",
    fog: "#8f99ad",
    ash: "#5b6578",
  },
  font: {
    display: '"Manrope", "Avenir Next", "Segoe UI", system-ui, sans-serif',
    body: '"DM Sans", "Avenir Next", "Segoe UI", system-ui, sans-serif',
    mono: '"SFMono-Regular", "Cascadia Code", Consolas, "Roboto Mono", monospace',
  },
} as const;

export type Primitives = typeof primitives;
