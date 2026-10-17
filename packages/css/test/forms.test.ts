/**
 * Stage 4 form contract tests.
 *
 * - Every documented form class exists in the built bundle.
 * - `forms.css` references tokens/hooks only and defines exactly the
 *   documented surface (no undocumented classes).
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
const formsCss = readFileSync(join(srcDir, "forms.css"), "utf8");

const tokenNames = new Set(
  [...flattenTokens(semantic), ...flattenTokens(component)].map((t) => t.name),
);

const publicClasses = [
  "sq-input",
  "sq-input--small",
  "sq-input--large",
  "sq-input--invalid",
  "sq-field",
  "sq-field__help",
  "sq-field__error",
  "sq-required-mark",
  "sq-fieldset",
  "sq-fieldset__help",
  "sq-check",
  "sq-check__text",
  "sq-check__description",
  "sq-radio",
  "sq-radio__text",
  "sq-radio__description",
  "sq-switch",
  "sq-switch__track",
  "sq-range",
  "sq-range__value",
];

describe("form naming contract", () => {
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

describe("forms.css token discipline", () => {
  it("references tokens or documented hooks only", () => {
    for (const ref of new Set(varRefs(formsCss))) {
      const known = tokenNames.has(ref) || customProps.has(ref);
      expect(known, `forms.css references unknown ${ref}`).toBe(true);
    }
  });

  it("contains no hardcoded colors", () => {
    expect(formsCss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(formsCss).not.toMatch(/\brgba?\(/);
  });

  it("defines exactly the public surface (no undocumented classes)", () => {
    const defined = definedIn(formsCss);
    const undocumented = [...defined].filter(
      (cls) => !publicClasses.includes(cls),
    );
    expect(
      undocumented,
      `undocumented classes in forms.css: ${undocumented.join(", ")}`,
    ).toEqual([]);
  });
});
