/**
 * files.ts tests: guarded collection and guarded reads.
 *
 * The conservative contract extends to IO — an unreadable directory must
 * name itself loudly in `skippedDirectories` while the walk continues,
 * and every read failure carries the path and cause it lost nothing over.
 */

import { describe, expect, it } from "vitest";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { collectFiles, readTextFile } from "../src/index.js";

// chmod(000) still readable as root — these guards cannot be exercised.
const skipIfRoot = process.getuid?.() === 0 ? it.skip : it;

describe("collectFiles", () => {
  it("walks the tree and reports nothing skipped for readable dirs", () => {
    const root = mkdtempSync(join(tmpdir(), "sq-files-ok-"));
    try {
      mkdirSync(join(root, "shallow"), { recursive: true });
      writeFileSync(join(root, "a.html"), '<p class="sq-panel">x</p>');
      writeFileSync(join(root, "shallow", "b.js"), 'el.add("sq-panel");');
      const skipped: string[] = [];
      const files = collectFiles(root, ["**/*.{html,js}"], skipped);
      expect(files).toHaveLength(2);
      expect(skipped).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  skipIfRoot(
    "skips an unreadable directory loudly and parses the rest (F17b)",
    () => {
      const root = mkdtempSync(join(tmpdir(), "sq-files-blocked-"));
      try {
        const blocked = join(root, "blocked");
        mkdirSync(blocked, { recursive: true });
        writeFileSync(join(blocked, "lost.html"), 'class="sq-lost"');
        writeFileSync(join(root, "found.html"), '<p class="sq-panel">x</p>');
        chmodSync(blocked, 0o000);
        const skipped: string[] = [];
        const files = collectFiles(root, ["**/*.html"], skipped);
        // The rest of the tree is still scanned; the blocked dir is gone.
        expect(files).toHaveLength(1);
        expect(files[0]).toContain("found.html");
        expect(skipped).toHaveLength(1);
        expect(skipped[0]).toContain("blocked");
        expect(skipped[0]).toMatch(/EACCES|EPERM/);
      } finally {
        chmodSync(join(root, "blocked"), 0o755);
        rmSync(root, { recursive: true, force: true });
      }
    },
  );
});

describe("readTextFile", () => {
  it("names the path and the errno cause on failure (F17c)", () => {
    const missing = join(tmpdir(), "sq-trim-definitely-missing.css");
    expect(() => readTextFile(missing, "source file")).toThrow(
      `cannot read source file "${missing}"`,
    );
    expect(() => readTextFile(missing, "source file")).toThrow(/ENOENT/);
  });

  skipIfRoot("reports EACCES for an unreadable file", () => {
    const root = mkdtempSync(join(tmpdir(), "sq-files-eacces-"));
    try {
      const secret = join(root, "violate.css");
      writeFileSync(secret, ".sq-hidden { color: red; }");
      chmodSync(secret, 0o000);
      expect(() => readTextFile(secret, "source file")).toThrow(
        new RegExp(`cannot read source file "${secret}": EACCES`),
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
