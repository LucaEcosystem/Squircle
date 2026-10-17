/**
 * The Luca Ecosystem Theme — Squircle's default brand identity.
 *
 * This is a complete dark brand theme, not a "dark mode" variant: the
 * `:root` token defaults ARE Luca values, so a page with no theme
 * attribute already renders the Luca theme. `lucaTheme.variables`
 * re-declares every default explicitly so tooling (validation, docs,
 * switching) treats Luca like any other theme.
 */

import { defaultVariables } from "./theme.js";
import type { ThemeDefinition } from "./theme.js";

export const lucaTheme: ThemeDefinition = {
  name: "luca",
  description:
    "Luca Ecosystem brand theme (default): deep-navy surfaces, gold " +
    "secondary voice, vert/azure/tangerine functional accents. Dark-first; " +
    "no light-mode toggle.",
  variables: defaultVariables(),
};

export const builtinThemes: ThemeDefinition[] = [lucaTheme];
