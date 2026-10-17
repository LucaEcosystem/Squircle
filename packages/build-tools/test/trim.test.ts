/**
 * sq-trim tests: conservative removal, safelisting, and diagnostics.
 *
 * Every test states the conservative contract: used/safelisted/
 * structural styles survive; only provably-unused `.sq-*` rules go.
 */

import { describe, expect, it } from "vitest";
import {
  definedClasses,
  emptySafelist,
  scanHtml,
  scanJs,
  trimCss,
} from "../src/index.js";

const SAMPLE = `
:root { --sq-color-background: #131e33; --sq-space-md: 1.5rem; }
body { background: var(--sq-color-background); }
.sq-panel { background: navy; padding: var(--sq-space-md); }
.sq-panel:hover { border-color: gold; }
.sq-panel .sq-panel { padding: 1rem; }
.sq-unused { color: red; }
.sq-also-unused:hover { color: blue; }
[data-sq-theme="ocean"] { --sq-color-background: #06222e; }
@keyframes sq-fade-in { from { opacity: 0; } }
@media (min-width: 48rem) {
  .sq-md-used { display: flex; }
  .sq-md-unused { display: grid; }
}
@media (min-width: 99rem) {
  .sq-xl-unused { display: block; }
}
@import url("https://fonts.example/fonts.css");
`;

describe("trimCss", () => {
  it("keeps used classes, their state variants, and drops the unused", () => {
    const outcome = trimCss(
      SAMPLE,
      new Set(["sq-panel", "sq-md-used"]),
      emptySafelist(),
    );
    expect(outcome.css).toContain(".sq-panel {");
    expect(outcome.css).toContain(".sq-panel:hover {");
    expect(outcome.css).toContain(".sq-panel .sq-panel {");
    expect(outcome.css).toContain(".sq-md-used {");
    expect(outcome.css).not.toContain(".sq-unused");
    expect(outcome.css).not.toContain(".sq-also-unused");
    expect(outcome.css).not.toContain(".sq-md-unused");
    expect(outcome.css).not.toContain(".sq-xl-unused");
    // The emptied 99rem wrapper disappears entirely.
    expect(outcome.css).not.toContain("99rem");
    expect(outcome.droppedRules).toBeGreaterThan(0);
  });

  it("always keeps structural, token, theme, keyframe, and import styles", () => {
    const outcome = trimCss(SAMPLE, new Set(), emptySafelist());
    expect(outcome.css).toContain(":root {");
    expect(outcome.css).toContain("--sq-color-background: #131e33;");
    expect(outcome.css).toContain("body {");
    expect(outcome.css).toContain('[data-sq-theme="ocean"]');
    expect(outcome.css).toContain("@keyframes sq-fade-in");
    expect(outcome.css).toContain(
      '@import url("https://fonts.example/fonts.css");',
    );
  });

  it("honors exact, prefix, and pattern safelists", () => {
    const safelist = emptySafelist();
    safelist.exact.add("sq-unused");
    safelist.prefixes.push("sq-md-");
    safelist.patterns.push(/^sq-also-/);
    const outcome = trimCss(SAMPLE, new Set(), safelist);
    expect(outcome.css).toContain(".sq-unused {");
    expect(outcome.css).toContain(".sq-md-used {");
    expect(outcome.css).toContain(".sq-md-unused {");
    expect(outcome.css).toContain(".sq-also-unused:hover {");
  });
});

describe("scanHtml", () => {
  it("collects literal classes and theme names", () => {
    const result = scanHtml(
      '<div class="sq-panel sq-p-md"><a class="sq-button">x</a></div><html data-sq-theme="ocean">',
      "page.html",
    );
    expect([...result.static].sort()).toEqual([
      "sq-button",
      "sq-p-md",
      "sq-panel",
    ]);
    expect([...result.themes]).toEqual(["ocean"]);
    expect(result.dynamicHints).toEqual([]);
  });

  it("flags interpolated class attributes instead of guessing", () => {
    const result = scanHtml('<div class="sq-panel ${extra}">', "page.html");
    expect(result.static.size).toBe(0);
    expect(result.dynamicHints.length).toBe(1);
    expect(result.dynamicHints[0]).toMatch(/safelist/);
  });

  it("scans inline scripts as JavaScript", () => {
    const result = scanHtml(
      '<div class="sq-panel"></div><script>el.classList.add("sq-hidden");\nconst c = "sq-bg-" + state;</script><script src="app.js"></script>',
      "page.html",
    );
    expect(result.static.has("sq-panel")).toBe(true);
    expect(result.static.has("sq-hidden")).toBe(true);
    expect(result.dynamicHints.length).toBe(1);
    expect(result.dynamicHints[0]).toMatch(/concatenated/);
  });
});

describe("scanJs", () => {
  it("collects classes from literals and classList calls", () => {
    const result = scanJs(
      `el.classList.add("sq-hidden");\nconst c = 'sq-panel sq-p-md';`,
      "app.js",
    );
    expect([...result.static].sort()).toEqual([
      "sq-hidden",
      "sq-p-md",
      "sq-panel",
    ]);
    expect(result.dynamicHints).toEqual([]);
  });

  it("flags template interpolation and concatenation", () => {
    const result = scanJs(
      'el.className = `sq-button sq-button--${variant}`;\nconst c = "sq-grid-cols-" + n;',
      "app.js",
    );
    expect(result.dynamicHints.length).toBe(2);
    // The uninterpolated literal still counts as static.
    expect(result.static.has("sq-button")).toBe(true);
  });

  it("reads plain template literals without interpolation as static", () => {
    const result = scanJs("const c = `sq-fade-in`;", "app.js");
    expect([...result.static]).toEqual(["sq-fade-in"]);
    expect(result.dynamicHints).toEqual([]);
  });
});

describe("definedClasses", () => {
  it("lists every class the stylesheet defines", () => {
    const defined = definedClasses(SAMPLE);
    expect(defined.has("sq-panel")).toBe(true);
    expect(defined.has("sq-md-unused")).toBe(true);
    expect(defined.has("panel")).toBe(false);
  });
});

describe("string-aware parsing (regression)", () => {
  // The Google Fonts URL contains a `;`. A naive split on the first `;`
  // cuts the @import in half and corrupts every rule after it — this
  // exact failure shipped radius:0 in a fixture before the fix.
  const FONTS =
    '@import url("https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,500;9..40,700&display=swap");';
  const WITH_FONTS = `${FONTS}\n:root { --sq-a: 1; }\n.sq-used { color: red; }\n.sq-unused { color: blue; }`;

  it("keeps @import URLs with semicolons byte-identical", () => {
    const outcome = trimCss(WITH_FONTS, new Set(["sq-used"]), emptySafelist());
    expect(outcome.css).toContain(FONTS);
    expect(outcome.css).toContain(":root {");
    expect(outcome.css).toContain("--sq-a: 1;");
    expect(outcome.css).toContain(".sq-used {");
    expect(outcome.css).not.toContain(".sq-unused");
  });

  it("tolerates braces inside declaration strings", () => {
    const css = `.sq-used::before { content: "}"; }\n.sq-unused { color: blue; }`;
    const outcome = trimCss(css, new Set(["sq-used"]), emptySafelist());
    expect(outcome.css).toContain('content: "}";');
    expect(outcome.css).not.toContain(".sq-unused");
  });
});
