/**
 * Stage 5 navigation/data contract tests.
 *
 * - Every documented navigation/data class exists in the built bundle.
 * - `navigation.css` / `data.css` reference tokens/hooks only and define
 *   exactly the documented surface.
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

const tokenNames = new Set(
  [...flattenTokens(semantic), ...flattenTokens(component)].map((t) => t.name),
);

const navClasses = [
  "sq-navbar",
  "sq-navbar__inner",
  "sq-navbar__brand",
  "sq-nav",
  "sq-nav--vertical",
  "sq-nav__link",
  "sq-nav-menu",
  "sq-breadcrumbs",
  "sq-pagination",
  "sq-pagination__ellipsis",
  "sq-sidebar",
  "sq-sidebar__title",
  "sq-sidebar--sticky",
  "sq-with-sidebar",
];

const dataClasses = [
  "sq-table-scroll",
  "sq-table",
  "sq-table--striped",
  "sq-table__number",
  "sq-datalist",
  "sq-avatar",
  "sq-avatar--small",
  "sq-avatar--large",
  "sq-metric",
  "sq-metric__value",
  "sq-metric__label",
  "sq-metric__delta",
  "sq-metric__delta--up",
  "sq-metric__delta--down",
];

describe("stage 5 naming contract", () => {
  it("public classes follow block/variant/part conventions", () => {
    for (const cls of [...navClasses, ...dataClasses]) {
      expect(
        cls.match(/^sq-[a-z0-9]+(-[a-z0-9]+)*(__[a-z0-9-]+|--[a-z0-9-]+)?$/),
        `naming violation: ${cls}`,
      ).not.toBeNull();
    }
  });

  it("every public class is defined in the built bundle", () => {
    const css = readFileSync(distCss, "utf8");
    const missing = [...navClasses, ...dataClasses].filter(
      (cls) => !css.includes(`.${cls}`),
    );
    expect(missing, `missing from dist: ${missing.join(", ")}`).toEqual([]);
  });
});

describe("navigation.css + data.css token discipline", () => {
  it("reference tokens or documented hooks only", () => {
    for (const file of ["navigation.css", "data.css"]) {
      const css = readFileSync(join(srcDir, file), "utf8");
      for (const ref of new Set(varRefs(css))) {
        const known = tokenNames.has(ref) || customProps.has(ref);
        expect(known, `${file} references unknown ${ref}`).toBe(true);
      }
    }
  });

  it("contain no hardcoded colors", () => {
    for (const file of ["navigation.css", "data.css"]) {
      const css = readFileSync(join(srcDir, file), "utf8");
      expect(css, file).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(css, file).not.toMatch(/\brgba?\(/);
    }
  });

  it("define exactly the public surface (no undocumented classes)", () => {
    const pairs: Array<[string, string[]]> = [
      ["navigation.css", navClasses],
      ["data.css", dataClasses],
    ];
    for (const [file, pub] of pairs) {
      const defined = definedIn(readFileSync(join(srcDir, file), "utf8"));
      const undocumented = [...defined].filter((cls) => !pub.includes(cls));
      expect(
        undocumented,
        `undocumented classes in ${file}: ${undocumented.join(", ")}`,
      ).toEqual([]);
    }
  });
});
