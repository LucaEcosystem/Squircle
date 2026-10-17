/**
 * Minimal file collection for `sq-trim` (documented glob subset).
 *
 * Supported patterns: `*` (within a segment), `**` (across segments),
 * `?` (single character), `{a,b}` (brace alternatives). Anything else
 * matches literally. This is not a full minimatch implementation on
 * purpose — the subset is specified here and in the README, so behavior
 * never surprises.
 */

import { readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

function patternToRegExp(pattern: string): RegExp {
  const normalized = pattern.split(sep).join("/");
  let out = "^";
  let i = 0;
  while (i < normalized.length) {
    const ch: string = normalized[i] ?? "";
    if (ch === "*" && normalized[i + 1] === "*") {
      out += ".*";
      i += normalized[i + 2] === "/" ? 3 : 2;
    } else if (ch === "*") {
      out += "[^/]*";
      i++;
    } else if (ch === "?") {
      out += "[^/]";
      i++;
    } else {
      out += ch.replace(/[.+^${}()|[\]\\]/g, "\\$&");
      i++;
    }
  }
  return new RegExp(out + "$");
}

function walk(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile()) out.push(full);
  }
}

/** Expands one `{a,b}` group per pattern (nesting is not supported). */
function expandBraces(pattern: string): string[] {
  const match = pattern.match(/\{([^{}]*)\}/);
  if (!match) return [pattern];
  const options = (match[1] ?? "").split(",");
  return options.flatMap((option) =>
    expandBraces(
      pattern.slice(0, match.index) +
        option +
        pattern.slice((match.index ?? 0) + match[0].length),
    ),
  );
}

/** All files under `root` matching ANY of `patterns` (relative or absolute). */
export function collectFiles(root: string, patterns: string[]): string[] {
  const all: string[] = [];
  walk(root, all);
  const matchers = patterns.flatMap(expandBraces).map(patternToRegExp);
  return all.filter((file) => {
    const rel = relative(root, file).split(sep).join("/");
    return matchers.some((matcher) => matcher.test(rel) || matcher.test(file));
  });
}

/** True when `statSync` says this path is an accessible file. */
export function isFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}
