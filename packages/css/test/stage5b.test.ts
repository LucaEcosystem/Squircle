/**
 * Stage 5 feedback/media contract tests. Same shape as stage5a:
 * naming, bundle presence, token discipline, exact public surface.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { flattenTokens, semantic, component } from "@squircle/tokens";
import { customProps, definedIn, varRefs } from "./helpers.js";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, "..");
const srcDir = join(pkgRoot, "src");
const distCss = join(pkgRoot, "dist", "squircle.css");

const tokenNames = new Set(
  [...flattenTokens(semantic), ...flattenTokens(component)].map((t) => t.name),
);

const feedbackClasses = [
  "sq-alert",
  "sq-alert__icon",
  "sq-alert__body",
  "sq-alert__title",
  "sq-alert__text",
  "sq-alert--success",
  "sq-alert--info",
  "sq-alert--warning",
  "sq-alert--error",
  "sq-toasts",
  "sq-toast",
  "sq-toast--success",
  "sq-toast--warning",
  "sq-toast--error",
  "sq-toast__text",
  "sq-progress",
  "sq-progress--large",
  "sq-progress-label",
  "sq-spinner",
  "sq-spinner--small",
  "sq-spinner__label",
  "sq-skeleton",
  "sq-badge",
  "sq-badge--accent",
  "sq-badge--success",
  "sq-badge--info",
  "sq-badge--warning",
  "sq-badge--error",
  "sq-status",
  "sq-status__dot",
  "sq-status--success",
  "sq-status--warning",
  "sq-status--error",
  "sq-status--info",
  "sq-empty",
  "sq-empty__icon",
  "sq-empty__title",
  "sq-empty__text",
];

const mediaClasses = [
  "sq-figure",
  "sq-media",
  "sq-media--square",
  "sq-media--wide",
  "sq-audio",
  "sq-media-placeholder",
];

describe("stage 5 naming contract (feedback/media)", () => {
  it("public classes follow block/variant/part conventions", () => {
    for (const cls of [...feedbackClasses, ...mediaClasses]) {
      expect(
        cls.match(/^sq-[a-z0-9]+(-[a-z0-9]+)*(__[a-z0-9-]+|--[a-z0-9-]+)?$/),
        `naming violation: ${cls}`,
      ).not.toBeNull();
    }
  });

  it("every public class is defined in the built bundle", () => {
    const css = readFileSync(distCss, "utf8");
    const missing = [...feedbackClasses, ...mediaClasses].filter(
      (cls) => !css.includes(`.${cls}`),
    );
    expect(missing, `missing from dist: ${missing.join(", ")}`).toEqual([]);
  });
});

describe("feedback.css + media.css token discipline", () => {
  it("reference tokens or documented hooks only", () => {
    for (const file of ["feedback.css", "media.css"]) {
      const css = readFileSync(join(srcDir, file), "utf8");
      for (const ref of new Set(varRefs(css))) {
        const known = tokenNames.has(ref) || customProps.has(ref);
        expect(known, `${file} references unknown ${ref}`).toBe(true);
      }
    }
  });

  it("contain no hardcoded colors", () => {
    for (const file of ["feedback.css", "media.css"]) {
      const css = readFileSync(join(srcDir, file), "utf8");
      expect(css, file).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(css, file).not.toMatch(/\brgba?\(/);
    }
  });

  it("define exactly the public surface (no undocumented classes)", () => {
    const pairs: Array<[string, string[]]> = [
      ["feedback.css", feedbackClasses],
      ["media.css", mediaClasses],
    ];
    for (const [file, pub] of pairs) {
      const defined = definedIn(readFileSync(join(srcDir, file), "utf8"));
      const undocumented = [...defined].filter((cls) => !pub.includes(cls));
      expect(
        undocumented,
        `undocumented classes in ${file}: ${undocumented.join(", ")}`,
      ).toEqual([]);
    }
  });
});
