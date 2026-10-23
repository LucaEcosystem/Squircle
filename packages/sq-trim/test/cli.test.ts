/**
 * `sq-trim` distribution tests: the bin debuts the engine CLI directly —
 * the shim must resolve it, preserve the exit contract, and stay
 * version-locked to the engine package.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, "..");
const repoRoot = join(pkgRoot, "..", "..");

describe("sq-trim distribution", () => {
  it("the bin resolves the engine's dist CLI --help through the dependency", () => {
    const bin = join(pkgRoot, "dist", "cli.js");
    expect(existsSync(bin), "dist/cli.js must exist after build").toBe(true);
    const out = execFileSync("node", [bin, "--help"], {
      cwd: pkgRoot,
      encoding: "utf8",
    });
    expect(out).toContain("sq-trim --css");
  });

  it("exits 1 with the engine's usage error (contract passthrough)", () => {
    const bin = join(pkgRoot, "dist", "cli.js");
    try {
      execFileSync("node", [bin], { cwd: pkgRoot, encoding: "utf8" });
      throw new Error("bare call without args must exit 1");
    } catch (error) {
      const failure = error as { status?: unknown; stderr?: unknown };
      expect(failure.status, "bare call must exit 1").toBe(1);
      expect(String(failure.stderr ?? "")).toContain("sq-trim: required:");
    }
  });

  it("is version-locked to the engine package it executes", () => {
    const self = JSON.parse(
      readFileSync(join(pkgRoot, "package.json"), "utf8"),
    ) as { version: string; dependencies: Record<string, string> };
    const engine = JSON.parse(
      readFileSync(
        join(repoRoot, "packages", "build-tools", "package.json"),
        "utf8",
      ),
    ) as { version: string };
    expect(self.version).toBe(engine.version);
    expect(self.dependencies["@squircle/build-tools"]).toBe("workspace:*");
  });
});
