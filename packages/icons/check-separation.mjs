/**
 * Enforces the icon source separation rule (Stage 1):
 *  - Editable SVG sources live ONLY in `src/original/`.
 *  - No generated/optimized asset may be committed beside sources
 *    (build output goes to `dist/`, which is gitignored).
 *  - `src/optimized/` must not exist in the source tree.
 *
 * In Stage 1 there are no icons yet — this check pins the empty-but-valid
 * state so the separation exists BEFORE the first glyph is drawn.
 */

import { readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const src = path.join(path.dirname(fileURLToPath(import.meta.url)), "src");

const failures = [];

if (existsSync(path.join(src, "optimized"))) {
  failures.push("src/optimized/ must not exist — generated assets go to dist/");
}

function walk(dir, trail = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "README.md") continue;
    const rel = [...trail, entry.name].join("/");
    if (entry.isDirectory()) {
      walk(path.join(dir, entry.name), [...trail, entry.name]);
    } else if (entry.name.endsWith(".svg") && !rel.startsWith("original/")) {
      failures.push(`SVG outside src/original/: ${rel}`);
    }
  }
}

walk(src);

if (failures.length > 0) {
  console.error("icon separation violations:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log("icon separation: ok (sources isolated, no generated assets)");
