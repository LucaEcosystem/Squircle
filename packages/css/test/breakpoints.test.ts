/**
 * Breakpoint conformance (audit finding 14).
 *
 * Component-level `@media` thresholds cannot consume CSS custom
 * properties, so each rem value in a width query must equal a
 * `--sq-breakpoint-*` token numerically — drift would only show up as
 * a broken layout in the browser, not as failed resolution.
 */

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { semantic } from "@squircle/tokens";

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, "..", "src");

const inherited = new Set(
  Object.values(semantic.breakpoint).map((v) => Number.parseFloat(v)),
);

/** Every `(min|max)-width: <n>rem` in `@media` conditions (not @container). */
function mediaWidths(css: string): number[] {
  const values: number[] = [];
  for (const media of css.matchAll(/@media[^{]*/g)) {
    for (const width of media[0].matchAll(
      /\b(?:min|max)-width:\s*([\d.]+)rem\b/g,
    )) {
      values.push(Number.parseFloat(width[1] ?? "0"));
    }
  }
  return values;
}

describe("breakpoint conformance", () => {
  it("every component media-query width matches a --sq-breakpoint-* token", () => {
    for (const file of readdirSync(srcDir).filter((f) => f.endsWith(".css"))) {
      const css = readFileSync(join(srcDir, file), "utf8").replace(
        /\/\*[\s\S]*?\*\//g,
        "",
      );
      for (const width of new Set(mediaWidths(css))) {
        expect(
          inherited.has(width),
          `${file} queries ${width}rem — not in the --sq-breakpoint-* scale (${Object.values(semantic.breakpoint).join(", ")})`,
        ).toBe(true);
      }
    }
  });

  it("the token scale holds the documented values", () => {
    // Same scale UTILITIES.md documents for the responsive matrix.
    for (const [bp, width] of [
      ["sm", "40rem"],
      ["md", "48rem"],
      ["lg", "64rem"],
      ["xl", "80rem"],
    ] as const) {
      expect(semantic.breakpoint[bp], `--sq-breakpoint-${bp}`).toBe(width);
    }
  });
});
