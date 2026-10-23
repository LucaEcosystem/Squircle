/**
 * Fast package gate for `squircle` (runs in `pnpm check`):
 *  - every `exports` target resolves to a real file in dist/
 *  - LICENSE matches the repo root byte-for-byte
 *  - version matches all workspace packages AND the dist CSS banner
 *    (the `/*! Squircle <version> —` header of dist/squircle.css and
 *    dist/squircle.min.css, written by the css build)
 *  - zero install-time dependencies (no deps, devDeps, peerDeps,
 *    optionalDeps, bundledDeps)
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cssBannerVersion } from "../css/banner.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(root, "..", "..");
const failures = [];

const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));

function targets(node) {
  if (typeof node === "string") return [node];
  if (node && typeof node === "object")
    return Object.values(node).flatMap(targets);
  return [];
}

for (const target of targets(pkg.exports)) {
  if (target === "./package.json") continue;
  if (target.includes("*")) {
    // Wildcard export: the parent directory must exist with matches.
    const dir = path.join(root, path.dirname(target));
    if (!existsSync(dir)) {
      failures.push(`exports directory missing: ${path.dirname(target)}`);
    }
    continue;
  }
  const file = path.join(root, target);
  if (!existsSync(file)) {
    failures.push(`exports target missing: ${target}`);
  }
}
// Wildcard export must actually match files.
const iconFiles = readdirSync(path.join(root, "dist", "icons")).filter((f) =>
  f.endsWith(".svg"),
);
if (iconFiles.length === 0) {
  failures.push("./icons/* export matches no files");
}

const license = readFileSync(path.join(root, "dist", "LICENSE"), "utf8");
const rootLicense = readFileSync(path.join(repo, "LICENSE"), "utf8");
if (license !== rootLicense)
  failures.push("dist/LICENSE differs from repo LICENSE");

for (const dir of readdirSync(path.join(repo, "packages"))) {
  const manifest = path.join(repo, "packages", dir, "package.json");
  if (!existsSync(manifest)) continue;
  const other = JSON.parse(readFileSync(manifest, "utf8"));
  if (other.version !== pkg.version) {
    failures.push(`${dir} version ${other.version} != ${pkg.version}`);
  }
}

const css = readFileSync(path.join(root, "dist", "squircle.css"), "utf8");
if (!css.includes("--sq-color-background")) {
  failures.push("dist/squircle.css does not look like a Squircle bundle");
}

// The version banner claim is REAL: every built stylesheet leads with
// `/*! Squircle <version> —` (written post-transform by the css build),
// and its version must equal the package manifest. (tokens.css carries
// no version in its emit manifest, so there is nothing to compare there.)
for (const stylesheet of ["squircle.css", "squircle.min.css"]) {
  const sheet = readFileSync(path.join(root, "dist", stylesheet), "utf8");
  const bannerVersion = cssBannerVersion(sheet);
  if (bannerVersion === null) {
    failures.push(`${stylesheet} has no "/*! Squircle <version> —" banner`);
  } else if (bannerVersion !== pkg.version) {
    failures.push(
      `${stylesheet} banner version ${bannerVersion} != ${pkg.version}`,
    );
  }
}

for (const field of [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
  "bundleDependencies",
  "bundledDependencies",
]) {
  const value = pkg[field];
  if (value && Object.keys(value).length > 0) {
    failures.push(`${field} must be empty (got ${JSON.stringify(value)})`);
  }
}

if (failures.length > 0) {
  console.error("squircle check failed:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log(`squircle: package gate ok (v${pkg.version}, zero dependencies)`);
