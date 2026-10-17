/**
 * Squircle design tokens — semantic tier.
 *
 * Purpose-driven aliases over `primitives.ts`. Components, themes, and
 * utilities reference ONLY these names — never brand hex values directly.
 *
 * Luca mapping policy (deliberate, not indiscriminate):
 * - Luca Navy appears as layered surfaces (deep -> raised), never as a flat
 *   wash over every surface. Page background is the deeper `navyDeep`.
 * - Luca Gold is the secondary/brand voice: borders, premium accents, and
 *   dark-on-gold fills — never large text runs.
 * - Luca Vert / Azure / Tangerine are reserved for feedback and interactive
 *   emphasis. Bright accents are NEVER body-text colors; each has a
 *   `*Text` variant tuned for contrast on dark backgrounds, and a
 *   `*Contrast` ink color for text placed ON the accent fill.
 * - Error red is a semantic-only addition (the Luca palette contains no
 *   red); it is documented as such and never presented as a brand color.
 *
 * Contrast policy: every `text* on background/surface` pair and every
 * `*Contrast on *fill` pair must meet WCAG 2.2 AA (4.5:1). Enforced by
 * `test/contrast.test.ts` — change values, not assertions.
 */

import { primitives } from "./primitives.js";

const brand = primitives.color;

export const semantic = {
  color: {
    background: brand.navyDeep,
    backgroundSunken: brand.navyInk,
    surface: brand.lucaNavy,
    surfaceElevated: brand.navyRaised,
    surfaceOverlay: brand.navyOverlay,

    textPrimary: brand.paper,
    textSecondary: brand.mist,
    // Muted must clear 4.5:1 on the LIGHTEST surface it can sit on
    // (surfaceOverlay) — axe caught #8f99ad failing on elevated cards.
    textMuted: "#a3aec2",
    textDisabled: "#6d7790",

    border: "#33415c",
    borderStrong: "#4d6084",
    divider: "#2a3a56",

    focus: brand.lucaAzure,

    link: "#4dd2ff",
    linkHover: "#8fe3ff",
    linkVisited: "#c9a6f2",

    accent: brand.lucaGold,
    accentBright: "#cfc08a",
    accentContrast: brand.navyInk,

    success: brand.lucaVert,
    successText: "#7bff7b",
    successContrast: brand.navyInk,

    info: brand.lucaAzure,
    infoText: "#66d9ff",
    infoContrast: brand.navyInk,

    warning: brand.lucaTangerine,
    warningText: "#ffab4d",
    warningContrast: brand.navyInk,

    // Semantic-only: the Luca palette contains no red. Required for
    // error feedback; never used as a brand expression.
    error: "#ff6b6b",
    errorText: "#ff8585",
    errorContrast: brand.navyInk,

    selectedBackground: "#1b3a5c",
    selectedBorder: brand.lucaAzure,
    disabledBackground: "#26334d",

    scrim: "rgba(11, 18, 34, 0.72)",
    shadowColor: "rgba(4, 8, 18, 0.45)",
  },

  space: {
    "3xs": "0.25rem",
    "2xs": "0.5rem",
    xs: "0.75rem",
    sm: "1rem",
    md: "1.5rem",
    lg: "2rem",
    xl: "3rem",
    "2xl": "4.5rem",
    "3xl": "6.5rem",
    // Generous page rhythm: sections breathe, gutters grow with viewport.
    section: "clamp(4rem, 8vw, 7rem)",
    pageGutter: "clamp(1.25rem, 4vw, 2.5rem)",
  },

  font: {
    familyDisplay: primitives.font.display,
    familyBody: primitives.font.body,
    familyMono: primitives.font.mono,

    sizeXs: "0.8125rem",
    sizeSm: "0.875rem",
    sizeBase: "1.0625rem",
    sizeLg: "1.25rem",
    sizeXl: "1.5rem",
    size2xl: "2rem",
    size3xl: "2.75rem",
    size4xl: "3.75rem",
    size5xl: "5rem",

    fluidXl: "clamp(1.375rem, 1.1rem + 1.4vw, 1.75rem)",
    fluid2xl: "clamp(1.625rem, 1.25rem + 2vw, 2.25rem)",
    fluid3xl: "clamp(2rem, 1.4rem + 3.2vw, 3rem)",
    fluid4xl: "clamp(2.5rem, 1.6rem + 4.8vw, 4.25rem)",

    lineTight: "1.15",
    lineSnug: "1.3",
    lineBody: "1.65",
    lineLoose: "1.8",

    weightBody: "500",
    weightStrong: "700",
    weightDisplay: "800",

    measure: "68ch",
  },

  radius: {
    xs: "0.5rem",
    sm: "0.875rem",
    md: "1.375rem",
    lg: "2rem",
    xl: "2.75rem",
    full: "999px",
  },

  shadow: {
    sm: "0 1px 2px rgba(4, 8, 18, 0.4), 0 2px 8px rgba(4, 8, 18, 0.28)",
    md: "0 2px 6px rgba(4, 8, 18, 0.4), 0 12px 32px rgba(4, 8, 18, 0.32)",
    lg: "0 4px 12px rgba(4, 8, 18, 0.45), 0 24px 64px rgba(4, 8, 18, 0.4)",
    glowGold:
      "0 0 0 1px rgba(174, 157, 93, 0.35), 0 8px 32px rgba(174, 157, 93, 0.18)",
    glowAzure:
      "0 0 0 1px rgba(0, 187, 255, 0.4), 0 8px 32px rgba(0, 187, 255, 0.22)",
  },

  motion: {
    durationInstant: "100ms",
    durationQuick: "180ms",
    durationBase: "280ms",
    durationSlow: "480ms",
    durationSlower: "720ms",
    easingOut: "cubic-bezier(0.22, 0.68, 0.36, 1)",
    easingInOut: "cubic-bezier(0.65, 0, 0.35, 1)",
    easingSpring: "cubic-bezier(0.34, 1.3, 0.64, 1)",
    easingLinear: "linear",
  },

  breakpoint: {
    sm: "40rem",
    md: "48rem",
    lg: "64rem",
    xl: "80rem",
    "2xl": "96rem",
  },

  container: {
    narrow: "48rem",
    base: "72rem",
    wide: "88rem",
  },

  zIndex: {
    dropdown: "100",
    drawer: "200",
    dialog: "300",
    popover: "400",
    toast: "500",
    tooltip: "600",
  },
} as const;

export type Semantic = typeof semantic;
