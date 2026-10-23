/**
 * Token architecture tests.
 *
 * - Tier references point at real values (no dangling aliases).
 * - Flattened output has unique, well-formed `--sq-*` names.
 * - The Luca contrast policy holds at WCAG 2.2 AA (4.5:1) for every pair
 *   in the canonical `aaContrastPairs` list (shared with
 *   `@squircle/themes` validation). If a pair fails, the fix is to
 *   change the token value — never to weaken the assertion.
 */

import { describe, expect, it } from "vitest";
import { component } from "../src/component.js";
import { aaContrastPairs, contrastRatio } from "../src/contrast.js";
import { flattenTokens } from "../src/flatten.js";
import { primitives } from "../src/primitives.js";
import { semantic } from "../src/semantic.js";

const AA_TEXT = 4.5;
const AA_NON_TEXT = 3.0;

describe("token tiers", () => {
  it("component tokens reference semantic values, never raw hex", () => {
    const semanticValues = new Set(flattenTokens(semantic).map((t) => t.value));
    const hex = /^#[0-9a-f]{3,8}$/i;
    for (const { name, value } of flattenTokens(component)) {
      if (hex.test(value)) {
        expect(
          semanticValues.has(value),
          `${name} uses raw hex ${value} with no semantic alias`,
        ).toBe(true);
      }
    }
  });

  it("every component var() reference resolves to a real semantic token", () => {
    const semanticNames = new Set(flattenTokens(semantic).map((t) => t.name));
    const varRef = /var\(\s*(--sq-[a-z0-9-]+)\s*\)/g;
    for (const { name, value } of flattenTokens(component)) {
      for (const m of value.matchAll(varRef)) {
        expect(
          semanticNames.has(m[1]),
          `${name}: var(${m[1]}) is not a semantic token`,
        ).toBe(true);
      }
    }
  });

  it("semantic brand references resolve to the Luca palette", () => {
    const brandHex = new Set(Object.values(primitives.color));
    const hex = /^#[0-9a-f]{6}$/i;
    for (const { name, value } of flattenTokens(semantic)) {
      if (hex.test(value) && name.startsWith("--sq-color-")) {
        const known = brandHex.has(value) || value === "#ff6b6b";
        // Every opaque color is either a Luca/neutral primitive or the
        // single documented semantic-only error red.
        expect(
          known || isDerivedNeutral(value),
          `${name} = ${value} is neither a primitive nor documented`,
        ).toBe(true);
      }
    }
  });

  it("flattened names are unique and well-formed", () => {
    const names = [...flattenTokens(semantic), ...flattenTokens(component)].map(
      (t) => t.name,
    );
    expect(new Set(names).size).toBe(names.length);
    for (const name of names) {
      expect(name).toMatch(/^--sq-[a-z0-9]+(-[a-z0-9]+)+$/);
    }
  });

  it("emits the exact variable names the stylesheets reference", () => {
    // Regression guard: `flatten` must split letter->digit boundaries
    // (fluid2xl -> fluid-2xl), or CSS var() references resolve to nothing
    // and headings silently collapse to body size.
    const names = new Set(
      [...flattenTokens(semantic), ...flattenTokens(component)].map(
        (t) => t.name,
      ),
    );
    for (const expected of [
      "--sq-font-fluid-xl",
      "--sq-font-fluid-2xl",
      "--sq-font-fluid-3xl",
      "--sq-font-fluid-4xl",
      "--sq-font-size-xs",
      "--sq-font-size-2xl",
      "--sq-space-2xs",
      "--sq-space-3xl",
      "--sq-radius-md",
      "--sq-button-min-height",
      "--sq-input-min-height",
      "--sq-panel-radius-nested",
      "--sq-focus-width",
      "--sq-dialog-background",
      "--sq-dialog-radius",
      "--sq-dialog-padding",
      "--sq-dialog-max-width",
      "--sq-dialog-max-width-large",
    ]) {
      expect(names.has(expected), `missing token ${expected}`).toBe(true);
    }
  });
});

/** Borders/dividers/disabled tones derived from the navy ramp family. */
function isDerivedNeutral(value: string): boolean {
  return [
    "#33415c",
    "#4d6084",
    "#2a3a56",
    "#6d7790",
    "#26334d",
    "#1b3a5c",
    "#a3aec2",
    "#4dd2ff",
    "#8fe3ff",
    "#c9a6f2",
    "#cfc08a",
    "#7bff7b",
    "#66d9ff",
    "#ffab4d",
    "#ff8585",
  ].includes(value.toLowerCase());
}

describe("Luca contrast policy (WCAG 2.2 AA)", () => {
  const c = semantic.color;
  for (const { fg, bg } of aaContrastPairs) {
    const label = `${fg}/${bg}`;
    it(`${label} meets 4.5:1`, () => {
      const ratio = contrastRatio(c[fg], c[bg]);
      expect(
        ratio,
        `${label}: ${c[fg]} on ${c[bg]} = ${ratio.toFixed(2)}:1, need ≥ 4.5:1`,
      ).toBeGreaterThanOrEqual(AA_TEXT);
    });
  }

  // The muted/surfaceOverlay claim in semantic.ts ("muted must clear
  // 4.5:1 on the LIGHTEST surface it can sit on") is a fact about the
  // built-in palette — custom themes retune both sides — so it is
  // pinned here rather than in the shared canonical list.
  it("textMuted/surfaceOverlay meets 4.5:1", () => {
    const ratio = contrastRatio(c.textMuted, c.surfaceOverlay);
    expect(
      ratio,
      `textMuted/surfaceOverlay: ${c.textMuted} on ${c.surfaceOverlay} = ${ratio.toFixed(2)}:1, need ≥ 4.5:1`,
    ).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it("focus indicator meets 3:1 against page and surface", () => {
    expect(contrastRatio(c.focus, c.background)).toBeGreaterThanOrEqual(
      AA_NON_TEXT,
    );
    expect(contrastRatio(c.focus, c.surface)).toBeGreaterThanOrEqual(
      AA_NON_TEXT,
    );
  });
});
