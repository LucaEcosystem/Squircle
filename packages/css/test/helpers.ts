/**
 * Shared helpers for CSS layer tests.
 */

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

export function varRefs(css: string): string[] {
  return [...stripComments(css).matchAll(/--sq-[a-z0-9-]+/g)].map((m) => m[0]);
}

/**
 * Public customization hooks (see utilities.test.ts): author-chosen
 * custom properties with token fallbacks. Centralized so every layer
 * test enforces the same minimal list.
 */
export const customProps = new Set([
  "--sq-stack-gap", // .sq-stack override; falls back to --sq-space-md.
]);

/** Every `.sq-*` class defined in a CSS string. */
export function definedIn(css: string): Set<string> {
  return new Set(
    [...stripComments(css).matchAll(/\.sq-[a-z0-9-]+/g)].map((m) =>
      m[0].slice(1),
    ),
  );
}

/**
 * Every `sq-*` class referenced by HTML files under `dirs` (class
 * attributes + JS string literals) and by ```html fences in Markdown
 * docs under `mdDirs`. Excludes `data-sq-theme`, `<style>` bodies, and
 * `style="…"` attributes (var references, not classes).
 */
export function usedClasses(
  dirs: string[],
  mdDirs: string[] = [],
): Set<string> {
  const found = new Set<string>();
  const scanHtmlText = (html: string): void => {
    let text = html.replace(/<style[\s\S]*?<\/style>/g, " ");
    text = text.replace(/\sstyle\s*=\s*("[^"]*"|'[^']*')/g, " ");
    // SVG sprite symbol fragment refs (#sq-i-*) are icon identifiers, not
    // CSS classes — strip them so the class audit only sees actual class
    // usage. The regex below still catches genuine `sq-*` class names
    // elsewhere in the document.
    text = text.replace(/#sq-i-[a-z0-9-]+/g, " ");
    // `var(--sq-*)` references inside <pre> code samples are token uses,
    // not classes — the `\(--` lookbehind excludes them.
    for (const m of text.matchAll(/(?<!\(--)(?<![a-z]-)sq-[a-z0-9-]+/g)) {
      found.add(m[0]);
    }
  };
  const walk = (dir: string, visit: (file: string) => void): void => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full, visit);
      else visit(full);
    }
  };
  for (const dir of dirs) {
    walk(dir, (file) => {
      if (file.endsWith(".html")) scanHtmlText(readFileSync(file, "utf8"));
    });
  }
  for (const dir of mdDirs) {
    walk(dir, (file) => {
      if (!file.endsWith(".md")) return;
      const md = readFileSync(file, "utf8");
      for (const fence of md.matchAll(/```html([\s\S]*?)```/g)) {
        scanHtmlText(fence[1] ?? "");
      }
    });
  }
  return found;
}
