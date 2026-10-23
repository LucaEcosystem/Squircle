/**
 * Public package tests (`squircle`): every exports entry resolves to a
 * real artifact, metadata is consistent, and consumers need nothing
 * beyond the packed files.
 *
 * - exports map targets exist (wildcard matched against dist)
 * - dist mirrors the tested workspace outputs byte-for-byte
 * - version is equal across all workspace manifests
 * - the dist CSS banner carries the manifest version; check.mjs enforces
 *   it and fails loudly when the banner drifts
 * - zero install-time dependencies of any kind
 * - LICENSE present and identical to the repo root
 * - the ESM runtime imports in pure Node (no DOM at module top level)
 */

import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
  mkdtempSync,
  mkdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { cssBanner, cssBannerVersion } from "../../css/banner.mjs";

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

  it("version is consistent and the css build interpolates the banner", () => {
    for (const dir of readdirSync(join(repoRoot, "packages"))) {
      const manifest = join(repoRoot, "packages", dir, "package.json");
      if (!existsSync(manifest)) continue;
      const other = JSON.parse(readFileSync(manifest, "utf8"));
      expect(other.version, `${dir} version`).toBe(pkg.version);
    }
    // The banner check lives in check.mjs (banner -> manifest version,
    // real file, nonzero exit on drift). Source-level asserts pin the
    // css build to interpolate, never hardcode, that version: the
    // template with ${version} sits in banner.mjs; build.mjs wires
    // cssBanner(<manifest version>).
    const buildSource = readFileSync(
      join(repoRoot, "packages", "css", "build.mjs"),
      "utf8",
    );
    const bannerSource = readFileSync(
      join(repoRoot, "packages", "css", "banner.mjs"),
      "utf8",
    );
    expect(buildSource).toContain("cssBanner(version)");
    expect(bannerSource).toContain("${version}");
    expect(buildSource).not.toMatch(/Squircle \d+\.\d+\.\d+/);
    expect(bannerSource).not.toMatch(/[0-9]\.[0-9]+\.[0-9]+/);
  });

  it("both dist stylesheets carry the manifest version in their banner", () => {
    for (const name of ["squircle.css", "squircle.min.css"]) {
      const parsed = cssBannerVersion(readFileSync(join(dist, name), "utf8"));
      expect(parsed, `${name} banner version`).toBe(pkg.version);
    }
  });

  it("check.mjs passes on the built package", () => {
    const out = execFileSync("node", [join(pkgRoot, "check.mjs")], {
      cwd: pkgRoot,
      encoding: "utf8",
    });
    expect(out).toContain("package gate ok");
  });

  it("check.mjs fails loudly when the banner loses the manifest version", () => {
    // Run the real check.mjs against a fake repository whose dist banner
    // says 0.0.1 — expect exit 1 and a precise message.
    const fake = mkdtempSync(join(tmpdir(), "sq-check-fake-"));
    try {
      const fakeRepo = fake;
      const cssDir = join(fakeRepo, "packages", "css");
      const pkgDir = join(fakeRepo, "packages", "squircle");
      mkdirSync(join(cssDir), { recursive: true });
      mkdirSync(join(pkgDir, "dist", "icons"), { recursive: true });
      copyFileSync(join(pkgRoot, "check.mjs"), join(pkgDir, "check.mjs"));
      copyFileSync(
        join(repoRoot, "packages", "css", "banner.mjs"),
        join(cssDir, "banner.mjs"),
      );
      writeFileSync(join(fakeRepo, "LICENSE"), "fake license\n");
      writeFileSync(
        join(cssDir, "package.json"),
        JSON.stringify({ version: pkg.version }),
      );
      const manifest = {
        version: pkg.version,
        exports: { "./css": "./dist/squircle.css" },
      };
      writeFileSync(join(pkgDir, "package.json"), JSON.stringify(manifest));
      writeFileSync(join(pkgDir, "dist", "LICENSE"), "fake license\n");
      const driftedCss =
        cssBanner("0.0.1") + ":root { --sq-color-background: #131e33; }\n";
      writeFileSync(join(pkgDir, "dist", "squircle.css"), driftedCss);
      writeFileSync(join(pkgDir, "dist", "squircle.min.css"), driftedCss);
      writeFileSync(join(pkgDir, "dist", "icons", "a.svg"), "<svg></svg>");
      let stderr = "";
      let failed = false;
      try {
        execFileSync("node", [join(pkgDir, "check.mjs")], {
          cwd: pkgDir,
          encoding: "utf8",
        });
      } catch (error) {
        failed = true;
        stderr = String(
          (error as { stderr?: unknown }).stderr ?? (error as Error).message,
        );
        expect(stderr).toContain(`banner version 0.0.1 != ${pkg.version}`);
      }
      expect(failed, "drifted banner must fail the gate").toBe(true);
    } finally {
      rmSync(fake, { recursive: true, force: true });
    }
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
