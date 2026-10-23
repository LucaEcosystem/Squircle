/**
 * Builds `@squircle/css` dist:
 *  - `dist/squircle.css`     — complete readable stylesheet (simple projects,
 *    direct <link> usage, offline except the fonts @import).
 *  - `dist/squircle.min.css` — minified production twin, byte-identical rules.
 *
 * Pipeline: concatenate source layers in cascade order, then Lightning CSS
 * (prefix + syntax-lowering for evergreen/Safari 16.4+). No Sass dialect,
 * no Tailwind dependency — authored CSS in, optimized CSS out.
 *
 * `node build.mjs --check` rebuilds to memory and byte-compares against
 * dist, so CI catches stale build output.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { transform } from "lightningcss";
import { cssBanner } from "./banner.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const OFFLINE_FONTS = process.env.SQUIRCLE_OFFLINE_FONTS === "1";

const tokensCss = path.join(root, "..", "tokens", "dist", "tokens.css");
const lucaCss = path.join(root, "..", "themes", "dist", "luca.css");

const layers = [
  ["BASE", path.join(root, "src", "base.css")],
  ["TYPOGRAPHY", path.join(root, "src", "typography.css")],
  ["GEOMETRY", path.join(root, "src", "geometry.css")],
  ["COMPONENTS", path.join(root, "src", "components.css")],
  ["NAVIGATION", path.join(root, "src", "navigation.css")],
  ["FEEDBACK", path.join(root, "src", "feedback.css")],
  ["DATA", path.join(root, "src", "data.css")],
  ["MEDIA", path.join(root, "src", "media.css")],
  ["FORMS", path.join(root, "src", "forms.css")],
  ["OVERLAYS", path.join(root, "src", "overlays.css")],
  ["LAYOUT", path.join(root, "src", "layout.css")],
  ["UTILITIES", path.join(root, "src", "utilities.css")],
];

function assemble() {
  const fontsImport = OFFLINE_FONTS
    ? "/* offline build: fonts @import omitted — self-host per themes/src/fonts.css */\n"
    : readFileSync(path.join(root, "src", "squircle.css"), "utf8")
        .split("\n")
        .find((line) => line.startsWith("@import url(")) + "\n";
  let css = fontsImport;
  css += readFileSync(tokensCss, "utf8") + "\n";
  css += readFileSync(lucaCss, "utf8") + "\n";
  for (const [name, file] of layers) {
    css += `\n/* ===== layer: ${name} (${path.basename(file)}) ===== */\n`;
    css += readFileSync(file, "utf8") + "\n";
  }
  return css;
}

// Lightning CSS version tag: major << 16 | minor << 8. Safari 16.4 floor.
const targets = { safari: (16 << 16) | (4 << 8) };

function compile(css, { minify }) {
  return transform({
    filename: "squircle.css",
    code: Buffer.from(css),
    targets,
    minify,
  }).code.toString();
}

const assembled = assemble();
// Version comes from this package's manifest (kept equal to every
// workspace package by the `squircle` check gate) — never hardcoded.
const version = JSON.parse(
  readFileSync(path.join(root, "package.json"), "utf8"),
).version;
// Lightning CSS strips regular comments, so the version banner is written
// AFTER the transform at offset 0 (see banner.mjs) — it survives in the
// shipped artifact and is polled by the `squircle` package gate.
const readable = cssBanner(version) + compile(assembled, { minify: false });
const minified = cssBanner(version) + compile(assembled, { minify: true });

if (process.argv.includes("--check")) {
  const dist = path.join(root, "dist");
  const ok =
    readFileSync(path.join(dist, "squircle.css"), "utf8") === readable &&
    readFileSync(path.join(dist, "squircle.min.css"), "utf8") === minified;
  console.log(ok ? "css dist is fresh" : "css dist is STALE — run build");
  process.exit(ok ? 0 : 1);
}

mkdirSync(path.join(root, "dist"), { recursive: true });
writeFileSync(path.join(root, "dist", "squircle.css"), readable);
writeFileSync(path.join(root, "dist", "squircle.min.css"), minified);
console.log(
  `squircle.css: ${readable.length} bytes; squircle.min.css: ${minified.length} bytes`,
);
