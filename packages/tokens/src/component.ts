/**
 * Squircle design tokens — component tier.
 *
 * Component-level defaults composed from the semantic tier. Components
 * reference semantic tokens (`var(--sq-color-accent)`), never raw hex,
 * so a theme can retune one component without touching the system and so
 * consumer token overrides flow through every rule that references them.
 * Per spec §7: components must reference semantic tokens rather than
 * hardcode brand colors.
 *
 * Spacing policy: comfortable padding and clear separation are defaults,
 * not variants. There is no "compact" density in 1.0 unless a component
 * justifies it in its own stage.
 */

import { semantic } from "./semantic.js";

const s = semantic.space;
const r = semantic.radius;

export const component = {
  panel: {
    background: `var(--sq-color-surface)`,
    backgroundElevated: `var(--sq-color-surface-elevated)`,
    borderColor: `var(--sq-color-border)`,
    radius: r.lg,
    radiusNested: r.md,
    padding: s.lg,
    paddingLarge: s.xl,
    gap: s.md,
  },
  button: {
    radius: r.md,
    paddingY: s.xs,
    paddingX: s.md,
    paddingYLarge: s.sm,
    paddingXLarge: s.lg,
    paddingYSmall: "0.375rem",
    paddingXSmall: s.sm,
    gap: s["2xs"],
    minHeight: "3rem",
    minHeightLarge: "3.5rem",
    minHeightSmall: "2.5rem",
    primaryBackground: `var(--sq-color-accent)`,
    primaryText: `var(--sq-color-accent-contrast)`,
    secondaryBackground: `var(--sq-color-surface-elevated)`,
    secondaryText: `var(--sq-color-text-primary)`,
    secondaryBorder: `var(--sq-color-border-strong)`,
    tertiaryText: `var(--sq-color-text-primary)`,
    tertiaryHoverBackground: `var(--sq-color-surface-elevated)`,
    dangerBackground: `var(--sq-color-error)`,
    dangerText: `var(--sq-color-error-contrast)`,
    hoverBrightness: "1.08",
    dangerHoverBrightness: "1.1",
  },
  input: {
    background: `var(--sq-color-background-sunken)`,
    borderColor: `var(--sq-color-border-strong)`,
    borderColorInvalid: `var(--sq-color-error)`,
    radius: r.sm,
    paddingY: s.xs,
    paddingX: s.sm,
    paddingYSmall: "0.375rem",
    paddingXSmall: s.sm,
    paddingYLarge: s.sm,
    paddingXLarge: s.md,
    minHeight: "3rem",
    minHeightSmall: "2.5rem",
    minHeightLarge: "3.5rem",
    minHeightMultiline: "8rem",
    textColor: `var(--sq-color-text-primary)`,
    placeholderColor: `var(--sq-color-text-muted)`,
  },
  check: {
    size: "1.5rem",
    accentColor: `var(--sq-color-accent)`,
    gap: s.sm,
    rowPaddingY: s["2xs"],
  },
  switch: {
    width: "3.5rem",
    height: "2rem",
    knob: "1.375rem",
    trackBackground: `var(--sq-color-surface-overlay)`,
    trackCheckedBackground: `var(--sq-color-accent)`,
    knobBackground: `var(--sq-color-text-primary)`,
    knobCheckedBackground: `var(--sq-color-accent-contrast)`,
  },
  menu: {
    background: `var(--sq-color-surface-elevated)`,
    borderColor: `var(--sq-color-border-strong)`,
    radius: r.md,
    padding: s.xs,
    itemPaddingY: s["2xs"],
    itemPaddingX: s.sm,
    itemRadius: r.sm,
    itemMinHeight: "2.75rem",
    itemHoverBackground: `var(--sq-color-surface-overlay)`,
    minWidth: "14rem",
  },
  tooltip: {
    background: `var(--sq-color-surface-overlay)`,
    textColor: `var(--sq-color-text-primary)`,
    borderColor: `var(--sq-color-border-strong)`,
    radius: r.xs,
    paddingY: s["2xs"],
    paddingX: s.sm,
    maxWidth: "20rem",
  },
  tab: {
    indicatorColor: `var(--sq-color-accent)`,
    indicatorThickness: "3px",
    gap: s["2xs"],
    paddingY: s.sm,
    paddingX: s.md,
  },
  nav: {
    background: `var(--sq-color-surface)`,
    borderColor: `var(--sq-color-border)`,
    paddingY: s.sm,
    paddingX: s.md,
    gap: s["2xs"],
    itemPaddingY: s["2xs"],
    itemPaddingX: s.sm,
    itemRadius: r.sm,
    itemMinHeight: "2.75rem",
    summaryMinHeight: "3rem",
    activeBackground: `var(--sq-color-surface-elevated)`,
    sidebarWidth: "17rem",
  },
  pagination: {
    target: "3rem",
  },
  alert: {
    radius: r.md,
    paddingY: s.sm,
    paddingX: s.md,
    gap: s.sm,
    borderWidth: "1px",
  },
  badge: {
    radius: r.full,
    paddingY: "0.25rem",
    paddingX: s.xs,
  },
  avatar: {
    sizeSmall: "2rem",
    sizeMedium: "3rem",
    sizeLarge: "4rem",
    background: `var(--sq-color-surface-overlay)`,
    textColor: `var(--sq-color-text-primary)`,
  },
  // Media families: one surface treatment shared by <audio>, figures,
  // ratio boxes, and placeholders. Placeholder borders stay one grade
  // stronger for the dashed "not arrived yet" affordance.
  audio: {
    minHeight: "3rem",
  },
  media: {
    radius: r.md,
    borderColor: `var(--sq-color-border)`,
    placeholderBorder: `var(--sq-color-border-strong)`,
    background: `var(--sq-color-background-sunken)`,
  },
  table: {
    headerBackground: `var(--sq-color-surface-elevated)`,
    rowBorderColor: `var(--sq-color-divider)`,
    cellPaddingY: s.xs,
    cellPaddingX: s.sm,
    radius: r.md,
    minWidth: "36rem",
  },
  skeleton: {
    background: `var(--sq-color-surface-elevated)`,
    highlight: `var(--sq-color-surface-overlay)`,
    radius: r.sm,
    shimmerDuration: "1600ms",
  },
  // Loading affordances (audit F15): heights track the forms-tier touch
  // rhythm; spinner speed is a semantic motion reference, not a local
  // constant, so themes can slow or skip the rotation.
  progress: {
    minHeight: "0.75rem",
    minHeightLarge: "1rem",
    accentColor: `var(--sq-color-accent)`,
  },
  spinner: {
    size: "2.5rem",
    sizeSmall: "1.5rem",
    borderWidth: "4px",
    borderWidthSmall: "3px",
    borderColor: `var(--sq-color-border)`,
    accentColor: `var(--sq-color-accent)`,
    speed: `var(--sq-motion-duration-slower)`,
  },
  toast: {
    background: `var(--sq-color-surface-elevated)`,
    borderColor: `var(--sq-color-border-strong)`,
    radius: r.md,
    padding: s.md,
    gap: s.sm,
    maxWidth: "24rem",
  },
  // 1.1 components tier family. The select keeps the input surface
  // contract (forms.css) and only owns what is genuinely select-shaped:
  // the painted indicator, which must stay em-scaled and token-colored
  // (zoom and contrast are the documented constraint).
  select: {
    indicator: `var(--sq-color-text-muted)`,
    indicatorHover: `var(--sq-color-text-primary)`,
  },
  combobox: {
    // List panel height: enough rows to be useful, few enough to keep
    // the virtual focus ring visible while scrolling.
    maxHeight: "16rem",
  },
  file: {
    // Drop zone surface: sunken like an input, dashed like a media
    // placeholder ("not arrived yet" affordance), and a hover target.
    padding: s.lg,
    borderColor: `var(--sq-color-border-strong)`,
    background: `var(--sq-color-background-sunken)`,
    hoverBackground: `var(--sq-color-surface-overlay)`,
  },
  stepper: {
    markerSize: "2.25rem",
    markerRadius: r.full,
    markerBorder: `var(--sq-color-border-strong)`,
    railColor: `var(--sq-color-border-strong)`,
    railWidth: "2px",
    gap: s.xs,
  },
  chip: {
    background: `var(--sq-color-surface-elevated)`,
    borderColor: `var(--sq-color-border)`,
    textColor: `var(--sq-color-text-primary)`,
    radius: r.full,
    paddingY: "0.25rem",
    paddingX: s.xs,
    gap: s["2xs"],
    hoverBackground: `var(--sq-color-surface-overlay)`,
  },
  banner: {
    radius: r.md,
    paddingY: s.sm,
    paddingX: s.md,
    gap: s.sm,
  },
  rating: {
    size: "1.75rem",
    gap: "0.125rem",
    accentColor: `var(--sq-color-accent)`,
    idleColor: `var(--sq-color-surface-overlay)`,
  },
  timeline: {
    railColor: `var(--sq-color-border-strong)`,
    railWidth: "2px",
    marker: "0.75rem",
    markerColor: `var(--sq-color-accent)`,
    markerBorder: `var(--sq-color-border-strong)`,
    gap: s.xs,
  },
  carousel: {
    radius: r.md,
    gap: s.sm,
  },
  disclosure: {
    gap: s["2xs"],
    paddingY: s.sm,
    paddingX: s.md,
    radius: r.md,
    contentPadding: s.md,
    summaryMinHeight: "3rem",
  },
  focus: {
    width: "3px",
    offset: "3px",
    color: `var(--sq-color-focus)`,
  },
  // A dialog is the topmost modal surface: it sits above the elevated
  // surface, never touches the viewport edge (100dvh/gutter clamps live
  // in overlays.css), and is intentionally roomier than a panel so
  // substantial content still breathes. Large variant gives wide content
  // (settings, confirmation grids) more width without a second surface.
  dialog: {
    background: `var(--sq-color-surface-elevated)`,
    radius: r.lg,
    padding: s.lg,
    maxWidth: "36rem",
    maxWidthLarge: "48rem",
  },
} as const;

export type ComponentTokens = typeof component;
