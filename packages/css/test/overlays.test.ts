/**
 * Stage 4 overlay + tab contract tests.
 *
 * - Every documented overlay/tab class exists in the built bundle.
 * - `overlays.css` references tokens/hooks only and defines exactly the
 *   documented surface.
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
const overlaysCss = readFileSync(join(srcDir, "overlays.css"), "utf8");

const tokenNames = new Set(
  [...flattenTokens(semantic), ...flattenTokens(component)].map((t) => t.name),
);

const publicClasses = [
  "sq-dialog",
  "sq-dialog--large",
  "sq-dialog--modeless",
  "sq-dialog__close",
  "sq-menu",
  "sq-menu__item",
  "sq-menu__item--active",
  "sq-menu__item--danger",
  "sq-menu__hint",
  "sq-menu__separator",
  "sq-popover",
  "sq-popover__title",
  "sq-tooltip",
];

describe("overlay naming contract", () => {
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
});

describe("overlays.css token discipline", () => {
  it("references tokens or documented hooks only", () => {
    for (const ref of new Set(varRefs(overlaysCss))) {
      const known = tokenNames.has(ref) || customProps.has(ref);
      expect(known, `overlays.css references unknown ${ref}`).toBe(true);
    }
  });

  it("every --sq-dialog-* token referenced by overlays.css resolves", () => {
    const dialogRefs = new Set(
      varRefs(overlaysCss).filter((ref) => ref.startsWith("--sq-dialog-")),
    );
    expect(
      dialogRefs.size,
      "overlays.css should reference the full dialog geometry/surface token set",
    ).toBeGreaterThan(0);
    for (const ref of dialogRefs) {
      expect(
        tokenNames.has(ref),
        `overlays.css references ${ref} but it is not defined in the token tiers`,
      ).toBe(true);
    }
  });

  it("built bundle defines every --sq-dialog-* token referenced in source", () => {
    const dist = readFileSync(distCss, "utf8");
    for (const ref of new Set(varRefs(overlaysCss))) {
      if (!ref.startsWith("--sq-dialog-")) continue;
      expect(
        dist.includes(`${ref}:`),
        `built bundle is missing a definition for ${ref}`,
      ).toBe(true);
    }
  });

  it("contains no hardcoded colors", () => {
    expect(overlaysCss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(overlaysCss).not.toMatch(/\brgba?\(/);
  });

  it("defines exactly the public surface (no undocumented classes)", () => {
    const defined = definedIn(overlaysCss);
    const undocumented = [...defined].filter(
      (cls) => !publicClasses.includes(cls),
    );
    expect(
      undocumented,
      `undocumented classes in overlays.css: ${undocumented.join(", ")}`,
    ).toEqual([]);
  });
});
