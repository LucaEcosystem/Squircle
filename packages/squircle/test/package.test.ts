/**
 * Public package tests (`squircle`): every exports entry resolves to a
 * real artifact, metadata is consistent, and consumers need nothing
 * beyond the packed files.
 *
 * - exports map targets exist (wildcard matched against dist)
 * - dist mirrors the tested workspace outputs byte-for-byte
 * - version is equal across all workspace manifests
 * - zero install-time dependencies of any kind
 * - LICENSE present and identical to the repo root
 * - the ESM runtime imports in pure Node (no DOM at module top level)
 */

import { execFileSync } from "node:child_process";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, "..");
const repoRoot = join(pkgRoot, "..", "..");
const dist = join(pkgRoot, "dist");

const pkg = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8"));

function mirror(workspaceFile: string, distFile: string): void {
  const from = join(repoRoot, workspaceFile);
  const to = join(dist, distFile);
  expect(existsSync(from), `workspace source missing: ${workspaceFile}`).toBe(
    true,
  );
  expect(existsSync(to), `dist missing: ${distFile}`).toBe(true);
  expect(
    readFileSync(to, "utf8"),
    `${distFile} differs from ${workspaceFile}`,
  ).toBe(readFileSync(from, "utf8"));
}

describe("public package contents", () => {
  it("dist mirrors the tested workspace outputs exactly", () => {
    mirror("packages/css/dist/squircle.css", "squircle.css");
    mirror("packages/css/dist/squircle.min.css", "squircle.min.css");
    mirror("packages/runtime/dist/squircle-runtime.js", "squircle-runtime.js");
    mirror(
      "packages/runtime/dist/squircle-runtime.mjs",
      "squircle-runtime.mjs",
    );
    mirror("packages/runtime/dist/index.d.ts", "index.d.ts");
    mirror("packages/tokens/dist/tokens.css", "tokens.css");
    mirror("packages/themes/dist/fonts.css", "fonts.css");
    mirror("packages/icons/dist/squircle-icons.svg", "squircle-icons.svg");
    mirror("packages/icons/dist/icons.json", "icons.json");
    const manifest = JSON.parse(
      readFileSync(join(dist, "icons.json"), "utf8"),
    ) as Array<{ name: string }>;
    for (const { name } of manifest) {
      mirror(`packages/icons/dist/icons/${name}.svg`, `icons/${name}.svg`);
    }
    expect(manifest.length).toBe(44);
  });

  it("every exports entry resolves", () => {
    const seen: string[] = [];
    const walk = (node: unknown): void => {
      if (typeof node === "string") {
        if (node === "./package.json") return;
        seen.push(node);
        if (node.includes("*")) {
          const matches = readdirSync(join(dist, "icons")).filter((f) =>
            f.endsWith(".svg"),
          );
          expect(matches.length).toBeGreaterThan(0);
          return;
        }
        expect(existsSync(join(pkgRoot, node)), `missing ${node}`).toBe(true);
      } else if (node && typeof node === "object") {
        Object.values(node).forEach(walk);
      }
    };
    walk(pkg.exports);
    expect(seen.length).toBeGreaterThan(8);
  });

  it("version is consistent and the CSS banner is interpolated", () => {
    for (const dir of readdirSync(join(repoRoot, "packages"))) {
      const manifest = join(repoRoot, "packages", dir, "package.json");
      if (!existsSync(manifest)) continue;
      const other = JSON.parse(readFileSync(manifest, "utf8"));
      expect(other.version, `${dir} version`).toBe(pkg.version);
    }
    const buildSource = readFileSync(
      join(repoRoot, "packages", "css", "build.mjs"),
      "utf8",
    );
    expect(buildSource).toContain("${version}");
    expect(buildSource).not.toMatch(/Squircle \d+\.\d+\.\d+/);
  });

  it("has zero install-time dependencies", () => {
    for (const field of [
      "dependencies",
      "devDependencies",
      "peerDependencies",
      "optionalDependencies",
    ]) {
      expect(pkg[field] ?? {}, field).toEqual({});
    }
  });

  it("ships the MIT license verbatim", () => {
    expect(readFileSync(join(dist, "LICENSE"), "utf8")).toBe(
      readFileSync(join(repoRoot, "LICENSE"), "utf8"),
    );
  });

  it("the ESM runtime imports in pure Node (no top-level DOM)", () => {
    const out = execFileSync(
      "node",
      [
        "--input-type=module",
        "-e",
        "import('./dist/squircle-runtime.mjs').then((m) => console.log(typeof m.setTheme, typeof m.notify, typeof m.init))",
      ],
      { cwd: pkgRoot, encoding: "utf8" },
    ).trim();
    expect(out).toBe("function function function");
  });
});
