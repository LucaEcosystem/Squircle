/**
 * CSS layer tests — run against source AND the built bundle.
 *
 * - Every `var(--sq-*)` referenced by any CSS source resolves to a real
 *   token (a typo fails here, not silently in the browser).
 * - `utilities.css` contains no hardcoded colors.
 * - The documented responsive matrix is complete for every breakpoint.
 * - Breakpoint media queries match the token values.
 * - Every `sq-*` class used by examples/fixtures exists in the built
 *   `dist/squircle.css` (examples must work with the release bundle).
 */

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { flattenTokens, semantic, component } from "@squircle/tokens";
import { customProps, usedClasses, varRefs } from "./helpers.js";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, "..");
const repoRoot = join(pkgRoot, "..", "..");
const srcDir = join(pkgRoot, "src");
const distCss = join(pkgRoot, "dist", "squircle.css");
const utilitiesCss = readFileSync(join(srcDir, "utilities.css"), "utf8");

const tokenNames = new Set(
  [...flattenTokens(semantic), ...flattenTokens(component)].map((t) => t.name),
);

describe("token references", () => {
  it("every var() in every CSS source resolves to a token", () => {
    for (const file of readdirSync(srcDir).filter((f) => f.endsWith(".css"))) {
      const css = readFileSync(join(srcDir, file), "utf8");
      for (const ref of new Set(varRefs(css))) {
        const known = tokenNames.has(ref) || customProps.has(ref);
        expect(known, `${file} references unknown ${ref}`).toBe(true);
      }
    }
  });

  it("utilities.css contains no hardcoded colors", () => {
    expect(utilitiesCss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(utilitiesCss).not.toMatch(/\brgba?\(/);
  });
});

describe("responsive matrix", () => {
  const breakpoints = ["sm", "md", "lg", "xl"] as const;
  const variants = [
    "hidden",
    "block",
    "flex",
    "grid",
    "flex-row",
    "flex-col",
    "grid-cols-1",
    "grid-cols-2",
    "grid-cols-3",
    "grid-cols-4",
    "text-left",
    "text-center",
  ];
  for (const bp of breakpoints) {
    for (const variant of variants) {
      it(`sq-${bp}-${variant} exists`, () => {
        expect(
          utilitiesCss.includes(`.sq-${bp}-${variant} `) ||
            utilitiesCss.includes(`.sq-${bp}-${variant} {`),
          `missing responsive utility sq-${bp}-${variant} (documented in UTILITIES.md)`,
        ).toBe(true);
      });
    }
  }

  it("breakpoint queries match the token values", () => {
    for (const [bp, width] of [
      ["sm", "40rem"],
      ["md", "48rem"],
      ["lg", "64rem"],
      ["xl", "80rem"],
    ] as const) {
      expect(
        utilitiesCss.includes(`@media (min-width: ${width})`),
        `missing @media (min-width: ${width}) for ${bp}`,
      ).toBe(true);
    }
  });

  it("container-query primitives exist", () => {
    expect(utilitiesCss).toContain(".sq-cq {");
    expect(utilitiesCss).toContain("container-type: inline-size;");
    expect(utilitiesCss).toContain("@container (min-width: 30rem)");
  });
});

describe("release-bundle coverage", () => {
  it("every sq-* class in examples/fixtures/docs is defined in dist", () => {
    const css = readFileSync(distCss, "utf8");
    const used = usedClasses(
      [join(repoRoot, "examples"), join(repoRoot, "fixtures")],
      [join(repoRoot, "packages", "components")],
    );
    const missing: string[] = [];
    for (const cls of used) {
      if (!css.includes(`.${cls}`)) missing.push(cls);
    }
    expect(missing, `undefined classes used: ${missing.join(", ")}`).toEqual(
      [],
    );
  });

  it("utility scale survives intact (scope guard)", () => {
    const css = readFileSync(distCss, "utf8");
    const utils = new Set(
      [...css.matchAll(/\.(sq-(?:sm-|md-|lg-|xl-)?[a-z0-9-]+)/g)].map(
        (m) => m[1],
      ),
    );
    expect(utils.size).toBeGreaterThan(250);
  });
});
