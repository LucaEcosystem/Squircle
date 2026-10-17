/**
 * Assembles the public `squircle` package from tested workspace outputs.
 *
 * Copies (never rebuilds, never edits):
 *  - @squircle/css     -> squircle.css, squircle.min.css
 *  - @squircle/runtime -> squircle-runtime.js/.mjs (+maps), *.d.ts
 *  - @squircle/icons   -> squircle-icons.svg, icons/, icons.json
 *  - @squircle/tokens  -> tokens.css
 *  - @squircle/themes  -> fonts.css
 *  - repo root         -> LICENSE
 *
 * Every input must exist: run the workspace build first (`pnpm build`
 * from the Framework root — the root script builds `squircle` last).
 * Fails loudly on missing inputs instead of shipping a partial package.
 */

import { copyFileSync, cpSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(root, "..", "..");
const dist = path.join(root, "dist");

function sibling(...parts) {
  return path.join(root, "..", ...parts);
}

const copies = [
  // [source, destination]
  [sibling("css", "dist", "squircle.css"), "squircle.css"],
  [sibling("css", "dist", "squircle.min.css"), "squircle.min.css"],
  [sibling("runtime", "dist", "squircle-runtime.js"), "squircle-runtime.js"],
  [
    sibling("runtime", "dist", "squircle-runtime.js.map"),
    "squircle-runtime.js.map",
  ],
  [sibling("runtime", "dist", "squircle-runtime.mjs"), "squircle-runtime.mjs"],
  [
    sibling("runtime", "dist", "squircle-runtime.mjs.map"),
    "squircle-runtime.mjs.map",
  ],
  [sibling("tokens", "dist", "tokens.css"), "tokens.css"],
  [sibling("themes", "dist", "fonts.css"), "fonts.css"],
  [sibling("icons", "dist", "squircle-icons.svg"), "squircle-icons.svg"],
  [sibling("icons", "dist", "icons.json"), "icons.json"],
  [path.join(repo, "LICENSE"), "LICENSE"],
];

const missing = copies
  .map(([from]) => from)
  .filter((from) => !existsSync(from));
if (missing.length > 0) {
  console.error(
    "squircle: missing build inputs (run `pnpm build` from Framework/ first):\n- " +
      missing.join("\n- "),
  );
  process.exit(1);
}

mkdirSync(dist, { recursive: true });
for (const [from, to] of copies) {
  copyFileSync(from, path.join(dist, to));
}

// Runtime declarations (index + per-module) — the .mjs types reference them.
for (const file of [
  "index",
  "dialog",
  "dom",
  "menu",
  "motion",
  "popover",
  "tabs",
  "theme",
  "toast",
  "tooltip",
  "validation",
]) {
  for (const ext of [".d.ts", ".d.ts.map"]) {
    const from = sibling("runtime", "dist", `${file}${ext}`);
    if (!existsSync(from)) {
      console.error(
        `squircle: missing declaration ${file}${ext} — rebuild @squircle/runtime`,
      );
      process.exit(1);
    }
    copyFileSync(from, path.join(dist, `${file}${ext}`));
  }
}

// Per-icon SVGs (selective imports).
mkdirSync(path.join(dist, "icons"), { recursive: true });
cpSync(sibling("icons", "dist", "icons"), path.join(dist, "icons"), {
  recursive: true,
});

console.log("squircle: public package assembled");
