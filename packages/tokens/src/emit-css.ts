/**
 * Emits `dist/tokens.css`: all three tiers as `:root` custom properties.
 * Run as the second half of the tokens build (`tsc && node emit-css.js`).
 *
 * The emitted file is committed to `dist/` (build output, gitignored) and
 * consumed by `@squircle/css` and by anyone importing tokens directly.
 * Consumers never run TypeScript — they load plain CSS.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { semantic } from "./semantic.js";
import { component } from "./component.js";
import { flattenTokens } from "./flatten.js";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = here;

const sections: Array<{ title: string; tier: Record<string, unknown> }> = [
  { title: "semantic", tier: semantic as Record<string, unknown> },
  { title: "component", tier: component as Record<string, unknown> },
];

let css =
  "/* Squircle design tokens — GENERATED. Do not edit; edit packages/tokens/src/*.ts */\n";
css += ":root {\n";
for (const { title, tier } of sections) {
  css += `  /* -- ${title} tier -- */\n`;
  for (const { name, value } of flattenTokens(
    tier as Parameters<typeof flattenTokens>[0],
  )) {
    css += `  ${name}: ${value};\n`;
  }
}
css += "}\n";

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "tokens.css"), css);
console.log(`tokens.css written (${css.length} bytes)`);
