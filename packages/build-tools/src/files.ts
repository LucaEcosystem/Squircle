/**
 * Minimal file collection for `sq-trim` (documented glob subset).
 *
 * Supported patterns: `*` (within a segment), `**` (across segments),
 * `?` (single character), `{a,b}` (brace alternatives). Anything else
 * matches literally. This is not a full minimatch implementation on
 * purpose — the subset is specified here and in the README, so behavior
 * never surprises.
 */

import { readdirSync, statSync, readFileSync } from "node:fs";
import type { Dirent } from "node:fs";
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

function walk(dir: string, out: string[], skippedDirectories: string[]): void {
  let entries: Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    // An unreadable directory (e.g. EACCES) must not crash the walk — and
    // must not vanish silently either: every source inside it would vanish
    // from the scan. Name the path and the cause, keep walking the rest.
    skippedDirectories.push(
      `skipped directory "${dir}": ${(error as Error).message}`,
    );
    return;
  }
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === "dist") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out, skippedDirectories);
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
export function collectFiles(
  root: string,
  patterns: string[],
  skippedDirectories: string[] = [],
): string[] {
  const all: string[] = [];
  walk(root, all, skippedDirectories);
  const matchers = patterns.flatMap(expandBraces).map(patternToRegExp);
  return all.filter((file) => {
    const rel = relative(root, file).split(sep).join("/");
    return matchers.some((matcher) => matcher.test(rel) || matcher.test(file));
  });
}

/**
 * Reads a UTF-8 file, throwing a message that names the path (`context`
 * says what it is — "source file", "config file", …) and the failure
 * cause (errno + system message). Nothing here exits: call sites decide
 * whether an unreadable file is fatal or a warning.
 */
export function readTextFile(path: string, context: string): string {
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    throw new Error(
      `cannot read ${context} "${path}": ${(error as Error).message}`,
      { cause: error },
    );
  }
}

/** True when `statSync` says this path is an accessible file. */
export function isFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}
