/**
 * Builds `@squircle/runtime` dist:
 *  - `squircle-runtime.js`  — classic IIFE script (`window.Squircle`).
 *    Works from `file://` and plain `<script>` tags: no modules, no fetch.
 *  - `squircle-runtime.mjs` — ES module for bundler/importmap consumers.
 *  - `index.d.ts`            — TypeScript declarations (tooling only).
 *
 * Consumers never need TypeScript or a build step for the classic script.
 */

import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const entry = path.join(root, "src", "index.ts");
const iifeOut = path.join(root, "dist", "squircle-runtime.js");
const esmOut = path.join(root, "dist", "squircle-runtime.mjs");

await build({
  entryPoints: [entry],
  bundle: true,
  format: "iife",
  globalName: "Squircle",
  target: "es2022",
  minify: true,
  sourcemap: true,
  outfile: iifeOut,
});

await build({
  entryPoints: [entry],
  bundle: true,
  format: "esm",
  target: "es2022",
  minify: true,
  sourcemap: true,
  outfile: esmOut,
});

// Type declarations only (no JS emit — esbuild owns the JS).
execFileSync("tsc", ["-p", "tsconfig.json", "--emitDeclarationOnly"], {
  stdio: "inherit",
});

console.log("runtime dist written");
