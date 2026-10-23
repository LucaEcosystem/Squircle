/**
 * Class scanner for `sq-trim`.
 *
 * Finds `sq-*` classes in HTML and supported source files. Two result
 * kinds, deliberately separated:
 *  - `static`: classes written literally — safe to keep, safe to count.
 *  - `dynamicHints`: source patterns the scanner CANNOT resolve
 *    (template interpolation, concatenation, runtime construction).
 *    These never keep styles by themselves; the diagnostics tell the
 *    author exactly which safelist entry to add. Claiming detection here
 * would be dishonest — a missed class ships broken CSS.
 */

import { SQ_CLASS_TOKEN } from "./classes.js";

export interface ScanResult {
  /** Literally-written `sq-*` classes. */
  static: Set<string>;
  /** Human-readable locations of unresolvable dynamic patterns. */
  dynamicHints: string[];
  /** `data-sq-theme="…"` names referenced (kept for theme-block reporting). */
  themes: Set<string>;
}

export function emptyResult(): ScanResult {
  return { static: new Set(), dynamicHints: [], themes: new Set() };
}

export function mergeScan(into: ScanResult, from: ScanResult): ScanResult {
  for (const cls of from.static) into.static.add(cls);
  into.dynamicHints.push(...from.dynamicHints);
  for (const theme of from.themes) into.themes.add(theme);
  return into;
}

const CLASS_TOKEN = SQ_CLASS_TOKEN;

/** `class="…"` / `class='…'` attributes (HTML, Vue, Svelte, Astro). */
export function scanHtml(source: string, filename: string): ScanResult {
  const result = emptyResult();
  for (const attr of source.matchAll(/class\s*=\s*("([^"]*)"|'([^']*)')/g)) {
    const value = attr[2] ?? attr[3] ?? "";
    if (value.includes("${")) {
      result.dynamicHints.push(
        `${filename}: interpolated class attribute "${value.slice(0, 60)}" — safelist the possible classes`,
      );
      continue;
    }
    for (const token of value.matchAll(CLASS_TOKEN)) {
      result.static.add(token[0]);
    }
  }
  for (const theme of source.matchAll(
    /data-sq-theme\s*=\s*["']([^"']+)["']/g,
  )) {
    result.themes.add(theme[1] ?? "");
  }
  // Inline <script> bodies are JavaScript — scan them as such. External
  // scripts (src=…) live in their own files and are scanned separately.
  for (const script of source.matchAll(
    /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g,
  )) {
    mergeScan(result, scanJs(script[1] ?? "", filename));
  }
  // className="…" (JSX) inside .html is rare; .jsx/.tsx handled by scanJs.
  return result;
}

const QUOTED_STRING = /("([^"\\]|\\.)*"|'([^'\\]|\\.)*')/g;
const TEMPLATE_LITERAL = /`([^`\\]|\\.)*`/g;

/**
 * String literals in JS/TS/JSX/Vue/Svelte sources. Plain literals yield
 * static classes; template literals or concatenation involving `sq-`
 * yield dynamic hints.
 */
export function scanJs(source: string, filename: string): ScanResult {
  const result = emptyResult();
  const dynamicRanges: Array<[number, number]> = [];

  for (const tpl of source.matchAll(TEMPLATE_LITERAL)) {
    const text = tpl[0] ?? "";
    const start = tpl.index ?? 0;
    dynamicRanges.push([start, start + text.length]);
    if (!text.includes("sq-")) continue;
    if (text.includes("${")) {
      // Interpolated: literal chunks still count as static (the `sq-button`
      // in `sq-button--${variant}` is really there); the dynamic remainder
      // needs a safelist, so a hint is emitted as well.
      const literals = text.replace(/\$\{[^}]*\}/g, " ");
      for (const token of literals.matchAll(CLASS_TOKEN)) {
        result.static.add(token[0]);
      }
      result.dynamicHints.push(
        `${filename}: interpolated template literal with sq- classes — safelist the possible classes`,
      );
    } else {
      for (const token of text.matchAll(CLASS_TOKEN)) {
        result.static.add(token[0]);
      }
    }
  }

  const inDynamic = (index: number): boolean =>
    dynamicRanges.some(([from, to]) => index >= from && index < to);

  for (const str of source.matchAll(QUOTED_STRING)) {
    const index = str.index ?? 0;
    if (inDynamic(index)) continue;
    const text = str[0] ?? "";
    if (!text.includes("sq-")) continue;
    // `"sq-button--" + variant` — a prefix awaiting runtime completion.
    const after = source.slice(index + text.length, index + text.length + 20);
    if (/^\s*\+/.test(after)) {
      result.dynamicHints.push(
        `${filename}: concatenated class fragment ${text} — safelist the prefix`,
      );
      continue;
    }
    for (const token of text.matchAll(CLASS_TOKEN)) {
      result.static.add(token[0]);
    }
  }
  return result;
}

/** Dispatches on file extension; unknown extensions are ignored loudly. */
export function scanSource(
  source: string,
  filename: string,
): ScanResult | null {
  if (/\.(html|vue|svelte|astro)$/.test(filename)) {
    const result = scanHtml(source, filename);
    // Vue/Svelte single-file components also carry <script> string literals.
    if (/\.(vue|svelte)$/.test(filename)) {
      mergeScan(result, scanJs(source, filename));
    }
    return result;
  }
  if (/\.(js|mjs|cjs|ts|tsx|jsx)$/.test(filename)) {
    return scanJs(source, filename);
  }
  return null;
}
