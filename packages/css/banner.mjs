/**
 * The dist stylesheet banner — the single version marker inside every
 * built stylesheet (`squircle.css` and `squircle.min.css`).
 *
 * Lightning CSS strips pre-compile comments, so `build.mjs` writes this
 * banner AFTER the transform (file offset 0 of both artifacts), and
 * `packages/squircle/check.mjs` polls it to keep shipped CSS on-version.
 */

/** The exact banner written at offset 0 of every built stylesheet. */
export function cssBanner(version) {
  return `/*! Squircle ${version} — MIT License — GENERATED, do not edit */\n`;
}

/**
 * The version parsed from a stylesheet's banner, or null when the file's
 * first line is not a version banner. Parsed strictly: no banner or a
 * non-semver token means the caller fails the artifact, not this parser.
 */
export function cssBannerVersion(css) {
  const match = css.match(/^\/\*! Squircle (\d+\.\d+\.\d+) — MIT License/m);
  return match === null ? null : (match[1] ?? null);
}
