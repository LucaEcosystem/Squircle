/**
 * Builds `@squircle/icons` dist from `src/original/*.svg`:
 *  - `dist/squircle-icons.svg` — symbol sprite (`#sq-i-<name>`).
 *  - `dist/icons/<name>.svg`   — standalone files (inline or <img>).
 *  - `dist/icons.json`         — manifest (docs + tests).
 *
 * Sources stay editable SVGs; everything here is generated. Validation
 * (viewBox, no hardcoded colors, stroke conventions) fails the build
 * instead of shipping a non-conforming glyph. No dependencies.
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(root, "src", "original");
const distDir = path.join(root, "dist");
const perIconDir = path.join(distDir, "icons");

const failures = [];

function validate(name, source) {
  if (!source.includes('viewBox="0 0 24 24"')) {
    failures.push(`${name}: missing viewBox="0 0 24 24"`);
  }
  if (/#[0-9a-fA-F]{3,8}\b/.test(source)) {
    failures.push(`${name}: hardcoded color — use currentColor only`);
  }
  if (/fill="(?!none|currentColor)[^"]*"/.test(source)) {
    failures.push(`${name}: fill must be none or currentColor`);
  }
  if (!/stroke="currentColor"|fill="currentColor"/.test(source)) {
    failures.push(`${name}: nothing paints with currentColor`);
  }
}

const files = readdirSync(srcDir)
  .filter((f) => f.endsWith(".svg"))
  .sort();
if (files.length === 0) {
  console.error("icons: no sources in src/original/");
  process.exit(1);
}

const icons = [];
for (const file of files) {
  const name = file.replace(/\.svg$/, "");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
    failures.push(`${file}: name must be kebab-case`);
    continue;
  }
  const source = readFileSync(path.join(srcDir, file), "utf8");
  validate(name, source);
  const openTag = source.match(/<svg[^>]*>/);
  if (!openTag) {
    failures.push(`${name}: no <svg> root element`);
    continue;
  }
  // Normalize: strip xml decl/comments, collapse whitespace between tags.
  // The source root tag (with its fill/stroke conventions) is preserved
  // verbatim — per-icon files stay byte-equivalent to sources.
  const inner = source
    .replace(/<\?xml[^?]*\?>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "")
    .replace(/>\s+</g, "><")
    .trim();
  // Symbols lose the source root tag, so paint attributes travel on a
  // wrapping <g> — instantiated <use> content resolves currentColor in
  // the use context (themed by CSS `color`, as documented in ICONS.md).
  const paint = [
    "fill",
    "stroke",
    "stroke-width",
    "stroke-linecap",
    "stroke-linejoin",
  ]
    .map((attr) => {
      const match = openTag[0].match(new RegExp(`${attr}="([^"]*)"`));
      return match ? `${attr}="${match[1]}"` : null;
    })
    .filter((part) => part !== null)
    .join(" ");
  icons.push({ name, inner, openTag: openTag[0], paint });
}

if (failures.length > 0) {
  console.error("icons: validation failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

mkdirSync(perIconDir, { recursive: true });

const symbols = icons
  .map(
    (icon) =>
      `  <symbol id="sq-i-${icon.name}" viewBox="0 0 24 24"><g ${icon.paint}>${icon.inner}</g></symbol>`,
  )
  .join("\n");
const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n${symbols}\n</svg>\n`;
writeFileSync(path.join(distDir, "squircle-icons.svg"), sprite);

for (const icon of icons) {
  writeFileSync(
    path.join(perIconDir, `${icon.name}.svg`),
    `${icon.openTag}${icon.inner}</svg>\n`,
  );
}

const manifest = icons.map((icon) => ({
  name: icon.name,
  symbol: `#sq-i-${icon.name}`,
  file: `icons/${icon.name}.svg`,
}));
writeFileSync(
  path.join(distDir, "icons.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);

console.log(
  `icons: ${icons.length} glyphs -> sprite (${sprite.length} bytes) + ${icons.length} files + manifest`,
);
