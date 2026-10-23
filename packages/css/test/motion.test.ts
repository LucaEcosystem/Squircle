/**
 * Motion contract tests — `packages/components/CONTRACT.md` "Motion".
 *
 * Squircle's motion model:
 * - Every duration/easing comes from the motion tokens (or an
 *   established component-duration token). No literal ms timing exists
 *   outside the base reduced-motion gate.
 * - `prefers-reduced-motion` is gated once, at the base layer, for all
 *   animations and transitions; per-component PRM blocks only add
 *   layer-specific hardening (instant scroll, disabled rest states).
 * - Every keyframe lives in the `sq-` namespace.
 */

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, "..", "src");

const files = readdirSync(srcDir)
  .filter((name) => name.endsWith(".css"))
  .sort();

function readCss(name: string): string {
  return readFileSync(join(srcDir, name), "utf8");
}

describe("motion contract", () => {
  it("gates reduced motion once, at the base layer", () => {
    const base = readCss("base.css");
    expect(base).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(base).toContain("animation-duration: 0.01ms !important");
    expect(base).toContain("animation-iteration-count: 1 !important");
    expect(base).toContain("transition-duration: 0.01ms !important");
    expect(base).toMatch(/html\s*\{[^}]*scroll-behavior: auto/);
    for (const file of files) {
      if (file === "base.css") continue;
      const css = readCss(file);
      const killSwitch = css.includes("transition-duration: 0.01ms");
      expect(killSwitch, `${file} must not re-gate PRM globally`).toBe(false);
    }
  });

  it("uses no literal timing units outside the base gate", () => {
    const timingLiteral = /(?<!var\()\b\d*\.?\d+(?:ms|s)\b/g;
    for (const file of files) {
      const css = readCss(file);
      const literals = [...css.matchAll(timingLiteral)].map((m) => m[0]);
      if (file === "base.css") {
        for (const timing of literals) {
          expect(
            timing,
            "the base gate's only literal timing is 0.01ms",
          ).toEqual("0.01ms");
        }
      } else {
        expect(
          literals,
          `${file}: ms/s timings must come from motion tokens: ${literals.join(", ")}`,
        ).toEqual([]);
      }
    }
  });

  it("namespaces every keyframe and animation shorthand", () => {
    for (const file of files) {
      const css = readCss(file);
      for (const match of css.matchAll(/@keyframes\s+([\w-]+)/g)) {
        expect(match[1], `${file}: keyframe prefix`).toMatch(/^sq-/);
      }
      for (const match of css.matchAll(/animation\s*:\s*([\w-]+)/g)) {
        if (match[1] === "none") continue; // explicit PRM rest state
        expect(match[1], `${file}: animation shorthand name`).toMatch(/^sq-/);
      }
    }
  });

  it("keeps every duration and easing on the motion tokens", () => {
    const decl =
      /(?:transition|animation)(?:-duration|-timing-function)?\s*:\s*([^;]+);/g;
    for (const file of files) {
      const css = readCss(file);
      for (const match of css.matchAll(decl)) {
        const value = match[1]?.trim() ?? "";
        if (file === "base.css") {
          // The reduced-motion gate owns its literals; the umbrella
          // test above pins it to exactly the 0.01ms duration family.
          expect(value).toMatch(/^0\.01ms|^[01]\b|none|auto/);
          continue;
        }
        const ok =
          /^none$/.test(value) ||
          /^auto$/.test(value) ||
          /^instant$/.test(value) ||
          value.includes("var(--sq-");
        expect(
          ok,
          `${file}: "${match[0].replace(/\s+/g, " ").slice(0, 80)}" must use motion/component tokens (or be none/auto/instant)`,
        ).toBe(true);
      }
    }
  });

  it("exposes the motion token vocabulary", () => {
    // The vocabulary lives in the tokens package; the css dist only
    // references it. Anchor the contract here so a token rename shows
    // up as a css failure, not a silent gap.
    const dist = readFileSync(
      join(srcDir, "..", "dist", "squircle.css"),
      "utf8",
    );
    for (const token of [
      "--sq-motion-duration-instant",
      "--sq-motion-duration-quick",
      "--sq-motion-duration-base",
      "--sq-motion-duration-slow",
      "--sq-motion-duration-slower",
      "--sq-motion-easing-out",
      "--sq-motion-easing-in",
      "--sq-motion-easing-in-out",
      "--sq-motion-easing-spring",
    ]) {
      expect(dist.includes(token), `dist misses ${token}`).toBe(true);
    }
  });
});
