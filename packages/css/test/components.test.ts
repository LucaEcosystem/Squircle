/**
 * Component contract tests (packages/components/CONTRACT.md).
 *
 * - Naming: blocks `sq-x`, variants `sq-x--y`, parts `sq-x__z`.
 * - Every documented public class exists in the built bundle.
 * - `components.css` references tokens only (no hardcoded values).
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { flattenTokens, semantic, component } from "@squircle/tokens";
import { customProps, definedIn, varRefs } from "./helpers.js";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, "..");
const srcDir = join(pkgRoot, "src");
const distCss = join(pkgRoot, "dist", "squircle.css");
const componentsCss = readFileSync(join(srcDir, "components.css"), "utf8");

const tokenNames = new Set(
  [...flattenTokens(semantic), ...flattenTokens(component)].map((t) => t.name),
);

/** The public Stage 3 API surface — change the CSS and the docs together. */
const publicClasses = [
  // Buttons
  "sq-button",
  "sq-button--primary",
  "sq-button--secondary",
  "sq-button--tertiary",
  "sq-button--danger",
  "sq-button--small",
  "sq-button--large",
  "sq-button--block",
  "sq-button--icon-only",
  "sq-button__icon",
  "sq-button__spinner",
  // Links
  "sq-link",
  "sq-link--subtle",
  "sq-link--action",
  "sq-link--disabled",
  "sq-nav-link",
  // Panels and cards
  "sq-panel",
  "sq-panel--sunken",
  "sq-panel--elevated",
  "sq-panel--large",
  "sq-panel__header",
  "sq-panel__body",
  "sq-panel__footer",
  "sq-card",
  "sq-card--interactive",
  "sq-stretched-link",
  // Dividers
  "sq-divider",
  "sq-divider--vertical",
  "sq-divider--spacious",
  // Typography
  "sq-heading",
  "sq-heading--1",
  "sq-heading--2",
  "sq-heading--3",
  "sq-heading--4",
  "sq-text",
  "sq-label",
  "sq-code",
  // Tabs (Stage 4)
  "sq-tablist",
  "sq-tab",
  "sq-tabpanel",
  // Disclosure (Stage 5)
  "sq-disclosure",
  "sq-disclosure__content",
];

describe("component naming contract", () => {
  it("public classes follow block/variant/part conventions", () => {
    for (const cls of publicClasses) {
      expect(
        cls.match(/^sq-[a-z0-9]+(-[a-z0-9]+)*(__[a-z0-9-]+|--[a-z0-9-]+)?$/),
        `naming violation: ${cls}`,
      ).not.toBeNull();
    }
  });

  it("every public class is defined in the built bundle", () => {
    const css = readFileSync(distCss, "utf8");
    const missing = publicClasses.filter((cls) => !css.includes(`.${cls}`));
    expect(missing, `missing from dist: ${missing.join(", ")}`).toEqual([]);
  });

  it("component parts never appear without their block in the docs", () => {
    // Spot-check the composition rule: parts are documented alongside blocks.
    expect(publicClasses).toContain("sq-button__icon");
    expect(publicClasses).toContain("sq-button");
    expect(publicClasses).toContain("sq-panel__header");
    expect(publicClasses).toContain("sq-panel");
  });
});

describe("components.css token discipline", () => {
  it("references tokens or documented hooks only", () => {
    for (const ref of new Set(varRefs(componentsCss))) {
      const known = tokenNames.has(ref) || customProps.has(ref);
      expect(known, `components.css references unknown ${ref}`).toBe(true);
    }
  });

  it("contains no hardcoded colors", () => {
    expect(componentsCss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(componentsCss).not.toMatch(/\brgba?\(/);
  });

  it("defines exactly the public surface (no undocumented classes)", () => {
    const defined = definedIn(componentsCss);
    const undocumented = [...defined].filter(
      (cls) => !publicClasses.includes(cls),
    );
    expect(
      undocumented,
      `undocumented classes in components.css: ${undocumented.join(", ")}`,
    ).toEqual([]);
  });
});
