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
    activeBackground: `var(--sq-color-surface-elevated)`,
    sidebarWidth: "17rem",
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
  table: {
    headerBackground: `var(--sq-color-surface-elevated)`,
    rowBorderColor: `var(--sq-color-divider)`,
    cellPaddingY: s.xs,
    cellPaddingX: s.sm,
    radius: r.md,
  },
  skeleton: {
    background: `var(--sq-color-surface-elevated)`,
    highlight: `var(--sq-color-surface-overlay)`,
    radius: r.sm,
  },
  toast: {
    background: `var(--sq-color-surface-elevated)`,
    borderColor: `var(--sq-color-border-strong)`,
    radius: r.md,
    padding: s.md,
    gap: s.sm,
    maxWidth: "24rem",
  },
  disclosure: {
    gap: s["2xs"],
    paddingY: s.sm,
    paddingX: s.md,
    radius: r.md,
    contentPadding: s.md,
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
