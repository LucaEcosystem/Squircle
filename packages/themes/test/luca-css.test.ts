/**
 * Guards `src/luca.css` against silent drift from the token source.
 * Every custom property declared in luca.css must equal the emitted token
 * default for the same name. Change values in `packages/tokens/src` —
 * this test tells you when the stylesheet falls behind.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { defaultVariables } from "../src/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, "..", "src", "luca.css"), "utf8");

function declaredEntries(): Array<[string, string]> {
  const entries: Array<[string, string]> = [];
  for (const match of css.matchAll(/(--sq-[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    const name = match[1];
    const value = match[2];
    if (name === undefined || value === undefined) {
      throw new Error("luca.css parse failure: unnamed declaration");
    }
    entries.push([name, value.trim()]);
  }
  return entries;
}

describe("luca.css sync", () => {
  it("declares the complete color mapping", () => {
    const names = declaredEntries().map(([name]) => name);
    expect(names.length).toBeGreaterThan(30);
    expect(new Set(names).size).toBe(names.length);
  });

  it("every declared value equals the token default", () => {
    const defaults = defaultVariables();
    for (const [name, value] of declaredEntries()) {
      expect(
        defaults[name],
        `${name} is not a known token (typo or removed token?)`,
      ).toBeDefined();
      expect(
        value,
        `${name}: luca.css has "${value}", tokens say "${defaults[name]}"`,
      ).toBe(defaults[name]);
    }
  });
});
