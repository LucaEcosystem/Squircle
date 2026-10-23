/**
 * sq-trim tests: conservative removal, safelisting, and diagnostics.
 *
 * Every test states the conservative contract: used/safelisted/
 * structural styles survive; only provably-unused `.sq-*` rules go.
 */

import { describe, expect, it } from "vitest";
import {
  applySafelistEntry,
  definedClasses,
  emptySafelist,
  isSafelisted,
  scanHtml,
  scanJs,
  trimCss,
} from "../src/index.js";
import {
  SQ_CLASS_CHARS,
  SQ_CLASS_IN_SELECTOR,
  SQ_CLASS_TOKEN,
} from "../src/classes.js";

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

describe("applySafelistEntry", () => {
  it("adds exact, prefix, and pattern entries", () => {
    const safelist = emptySafelist();
    const warnings: string[] = [];
    applySafelistEntry(safelist, "sq-one", "config x.json", warnings);
    applySafelistEntry(
      safelist,
      { prefix: "sq-two-" },
      "config x.json",
      warnings,
    );
    applySafelistEntry(
      safelist,
      { pattern: "^sq-three" },
      "config x.json",
      warnings,
    );
    expect(warnings).toEqual([]);
    expect(isSafelisted("sq-one", safelist)).toBe(true);
    expect(isSafelisted("sq-two-fill", safelist)).toBe(true);
    expect(isSafelisted("sq-three-a", safelist)).toBe(true);
    expect(isSafelisted("other-three-a", safelist)).toBe(false);
  });

  it("warns for a dual entry and applies BOTH sides (conservative)", () => {
    const safelist = emptySafelist();
    const warnings: string[] = [];
    applySafelistEntry(
      safelist,
      { prefix: "sq-md-", pattern: "^sq-cols-" },
      "config /x/sq.json",
      warnings,
    );
    expect(safelist.prefixes).toContain("sq-md-");
    expect(safelist.patterns).toHaveLength(1);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("/x/sq.json");
    expect(warnings[0]).toContain('"prefix": "sq-md-"');
    expect(warnings[0]).toContain('"pattern": "^sq-cols-"');
    // Both sides really keep: prefix matches, pattern matches.
    expect(isSafelisted("sq-md-used", safelist)).toBe(true);
    expect(isSafelisted("sq-cols-3", safelist)).toBe(true);
  });

  it("throws a contextual error for an invalid pattern", () => {
    const warnings: string[] = [];
    const attempt = (): void =>
      applySafelistEntry(
        emptySafelist(),
        { pattern: "^sq-[" },
        "config /x/sq.json",
        warnings,
      );
    expect(attempt).toThrow('invalid safelist pattern "^sq-["');
    expect(attempt).toThrow("(config /x/sq.json)");
  });
});

describe("parse warnings (silent truncation surfaced)", () => {
  it("clean sources produce no warnings", () => {
    const outcome = trimCss(SAMPLE, new Set(["sq-panel"]), emptySafelist());
    expect(outcome.warnings).toEqual([]);
  });

  it("warns when an at-rule never reaches { or ; — ignoring from there", () => {
    const css = `.sq-used { color: red; }\n@media (min-width: 48rem`;
    const outcome = trimCss(css, new Set(["sq-used"]), emptySafelist());
    expect(outcome.warnings).toHaveLength(1);
    expect(outcome.warnings[0]).toContain("line 2");
    expect(outcome.warnings[0]).toContain('"@media (min-width: 48rem"');
    expect(outcome.warnings[0]).toContain('"{" or ";" before end of input');
    expect(outcome.warnings[0]).toContain("ignoring from there");
    // Still completes the trim conservatively (exit 0 semantics).
    expect(outcome.css).toContain(".sq-used {");
  });

  it("warns when a selector never reaches { — ignoring from there", () => {
    const css = `.sq-used { color: red; }\n.sq-orphan, .sq-lost`;
    const outcome = trimCss(css, new Set(["sq-used"]), emptySafelist());
    expect(outcome.warnings).toHaveLength(1);
    expect(outcome.warnings[0]).toContain("line 2");
    expect(outcome.warnings[0]).toContain('".sq-orphan, .sq-lost"');
    expect(outcome.warnings[0]).toContain('no "{" before end of input');
    expect(outcome.warnings[0]).toContain("ignoring from there");
    expect(outcome.css).toContain(".sq-used {");
  });

  it("warns when the source ends inside an unterminated block", () => {
    // The dropped first rule must not hide the truncation warning.
    const css = ".sq-unused { color: red; }\n.sq-used { color: blue;";
    const outcome = trimCss(css, new Set(["sq-used"]), emptySafelist());
    expect(outcome.warnings).toHaveLength(1);
    expect(outcome.warnings[0]).toContain("line 2");
    expect(outcome.warnings[0]).toContain("unterminated block");
    // The truncated rule keeps its complete body (final char included).
    expect(outcome.css).toContain("color: blue;");
  });

  it("reports a nested truncation at its absolute line", () => {
    const css =
      ".sq-used { color: red; }\n" +
      "@media (min-width: 48rem) {\n" +
      "  .sq-md { display: flex; }\n" +
      "  @media (unknown-tail";
    const outcome = trimCss(css, new Set(["sq-used"]), emptySafelist());
    // The outer block never closes (line 2) and the nested at-rule tail
    // is lost (line 4) — both surfaced, at their absolute lines.
    expect(outcome.warnings).toHaveLength(2);
    expect(outcome.warnings).toContainEqual(expect.stringContaining("line 2"));
    expect(outcome.warnings).toContainEqual(expect.stringContaining("line 4"));
    expect(outcome.warnings[0]).toContain("unterminated block");
    expect(outcome.warnings[1]).toContain("@media (unknown-tail");
    expect(outcome.warnings[1]).toContain("ignoring from there");
  });
});

describe("scanner/trimmer class regex alignment", () => {
  it("both regexes are built from one shared character range", () => {
    expect(SQ_CLASS_CHARS).toBe("A-Za-z0-9-");
    expect(SQ_CLASS_TOKEN.source).toBe(`(?<![a-z]-)sq-[${SQ_CLASS_CHARS}]+`);
    expect(SQ_CLASS_IN_SELECTOR.source).toBe(`\\.sq-[${SQ_CLASS_CHARS}]+`);
  });

  it("matches uppercase class names identically in both", () => {
    // The scanner must find what the trimmer keeps (and vice versa).
    expect(
      scanJs('el.classList.add("sq-Button");', "app.js").static.has(
        "sq-Button",
      ),
    ).toBe(true);
    const css = `.sq-Button { color: red; }\n.sq-Upper { color: blue; }`;
    const outcome = trimCss(css, new Set(["sq-Button"]), emptySafelist());
    expect(outcome.css).toContain(".sq-Button {");
    expect(outcome.css).not.toContain(".sq-Upper {");
    expect(definedClasses(css).has("sq-Upper")).toBe(true);
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
