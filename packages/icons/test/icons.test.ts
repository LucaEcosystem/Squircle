/**
 * Icon library tests: source conventions, build output, and the
 * source/output separation contract.
 *
 * - Every source is kebab-named, 24-grid, currentColor-only.
 * - `dist/` (when built) contains the sprite, all per-icon files, and
 *   a manifest matching sources exactly.
 * - No generated asset lives in `src/` (mirrors check-separation.mjs).
 */

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, "..");
const srcDir = join(pkgRoot, "src", "original");
const distDir = join(pkgRoot, "dist");

function sources(): string[] {
  return readdirSync(srcDir)
    .filter((f) => f.endsWith(".svg"))
    .sort();
}

describe("icon sources", () => {
  it("ships a coherent initial set (44 documented glyphs)", () => {
    expect(sources().length).toBe(44);
  });

  it("every source is kebab-named, 24-grid, currentColor-only", () => {
    for (const file of sources()) {
      const name = file.replace(/\.svg$/, "");
      expect(name, file).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      const svg = readFileSync(join(srcDir, file), "utf8");
      expect(svg, `${file}: viewBox`).toContain('viewBox="0 0 24 24"');
      expect(svg, `${file}: hardcoded color`).not.toMatch(
        /#[0-9a-fA-F]{3,8}\b/,
      );
      expect(
        svg.includes('stroke="currentColor"') ||
          svg.includes('fill="currentColor"'),
        `${file}: nothing paints with currentColor`,
      ).toBe(true);
    }
  });

  it("no generated asset lives in src/", () => {
    const walk = (dir: string): string[] => {
      const out: string[] = [];
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) out.push(...walk(full));
        else if (
          entry.name.endsWith(".svg") &&
          !full.startsWith(srcDir + "/")
        ) {
          out.push(full);
        } else if (
          (entry.name.endsWith(".json") ||
            entry.name === "squircle-icons.svg") &&
          full.includes(join("src") + "/")
        ) {
          out.push(full);
        }
      }
      return out;
    };
    const srcRoot = join(pkgRoot, "src");
    const stray = walk(srcRoot).filter((f) => !f.startsWith(srcDir + "/"));
    expect(stray).toEqual([]);
  });
});

describe("icon build output", () => {
  it("sprite, per-icon files, and manifest match sources", () => {
    const names = sources().map((f) => f.replace(/\.svg$/, ""));
    const sprite = readFileSync(join(distDir, "squircle-icons.svg"), "utf8");
    for (const name of names) {
      expect(sprite, `sprite missing ${name}`).toContain(`id="sq-i-${name}"`);
      expect(
        existsSync(join(distDir, "icons", `${name}.svg`)),
        `missing dist file ${name}.svg`,
      ).toBe(true);
    }
    const manifest = JSON.parse(
      readFileSync(join(distDir, "icons.json"), "utf8"),
    ) as Array<{ name: string }>;
    expect(manifest.map((m) => m.name).sort()).toEqual([...names].sort());
  });
});
