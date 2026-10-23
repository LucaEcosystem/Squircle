/**
 * Conservative unused-CSS removal for Squircle stylesheets.
 *
 * Shapes understood (exactly the shapes `@squircle/css` emits):
 *  - Qualified rules: kept iff any `.sq-*` class in the selector is used
 *    or safelisted. Selectors WITHOUT `.sq-*` classes (elements, `:root`,
 *    `*`, pseudo-elements, `[data-sq-theme]` blocks) are ALWAYS kept —
 *    they are structural, token, or theme styles, never trimmable.
 *  - `@media` / `@supports` / `@container`: recursed; emptied wrappers
 *    are dropped, the rest kept.
 *  - Everything else with a body (`@keyframes`, `@font-face`, …) or
 *    without one (`@import`, `@charset`) is kept wholesale. Over-keeping
 *    a few hundred bytes of keyframes is correct; dropping a needed
 *    animation is not.
 *
 * Unknown at-rules are kept, never dropped. When in doubt, this tool
 * keeps. Aggressiveness is a bug, not a feature. Malformed tails (source
 * ending inside a selector, at-rule, or block) are surfaced as parse
 * warnings instead of dropped silently — see `TrimOutcome.warnings`.
 */

import { SQ_CLASS_IN_SELECTOR } from "./classes.js";

export interface Safelist {
  exact: Set<string>;
  prefixes: string[];
  patterns: RegExp[];
}

export function emptySafelist(): Safelist {
  return { exact: new Set(), prefixes: [], patterns: [] };
}

export function isSafelisted(cls: string, safelist: Safelist): boolean {
  return (
    safelist.exact.has(cls) ||
    safelist.prefixes.some((prefix) => cls.startsWith(prefix)) ||
    safelist.patterns.some((pattern) => pattern.test(cls))
  );
}

/**
 * Adds one config/flag safelist entry, compiling `pattern` strings to
 * RegExp eagerly. Entries may be a class string, `{"prefix": "…"}`,
 * `{"pattern": "…"}` — or BOTH keys at once. A dual entry is ambiguous,
 * so this tool keeps conservatively: the prefix and the pattern are BOTH
 * applied (a match from either keeps the class) and a warning with
 * `context: value` is appended to `warnings` for the author to tighten.
 * Invalid patterns throw with the same context — call sites exit cleanly.
 */
export function applySafelistEntry(
  safelist: Safelist,
  entry: string | { prefix?: string; pattern?: string },
  context: string,
  warnings: string[],
): void {
  if (typeof entry === "string") {
    safelist.exact.add(entry);
    return;
  }
  if (entry.prefix && entry.pattern) {
    warnings.push(
      `${context}: safelist entry {"prefix": "${entry.prefix}", ` +
        `"pattern": "${entry.pattern}"} sets both prefix and pattern — ` +
        "applying both (a match from either keeps the class)",
    );
  }
  if (entry.prefix) safelist.prefixes.push(entry.prefix);
  if (entry.pattern) {
    try {
      safelist.patterns.push(new RegExp(entry.pattern));
    } catch (error) {
      throw new Error(
        `invalid safelist pattern "${entry.pattern}" (${context}): ` +
          `${(error as Error).message}`,
        { cause: error },
      );
    }
  }
}

type Node =
  | { kind: "rule"; selector: string; body: string }
  | { kind: "nested"; prelude: string; children: Node[] }
  | { kind: "raw"; text: string };

/** Newlines in `css.slice(from, to)` — 0-based index → 1-based line. */
function countNewlines(css: string, from: number, to: number): number {
  let lines = 0;
  for (let i = from; i < to; i++) if (css[i] === "\n") lines++;
  return lines;
}

/** Collapse whitespace and cap length for inline diagnostics. */
function snippet(text: string): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  return collapsed.length > 60 ? `${collapsed.slice(0, 60)}…` : collapsed;
}

/**
 * Advances `i` (an index object) to the first terminator character that is
 * real CSS syntax — i.e. NOT inside a `"…"` / `'…'` string and NOT inside
 * `(…)` (functions, `url(…)`, media features). Without this, a `;` inside
 * the Google Fonts URL (`wght@…,500;…`) splits the `@import` in half and
 * corrupts the entire stylesheet. Returns the terminator found.
 */
function scanToTerminator(
  css: string,
  pos: { i: number },
  terminators: Set<string>,
): string {
  let quote = "";
  let depth = 0;
  const len = css.length;
  while (pos.i < len) {
    const ch: string = css[pos.i] ?? "";
    if (quote !== "") {
      if (ch === "\\") {
        pos.i += 2;
        continue;
      }
      if (ch === quote) quote = "";
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === "(") {
      depth++;
    } else if (ch === ")") {
      depth = Math.max(0, depth - 1);
    } else if (depth === 0 && terminators.has(ch)) {
      return ch;
    }
    pos.i++;
  }
  return "";
}

/**
 * Consumes a `{…}` block honoring strings; `pos.i` starts AFTER `{`.
 * A block still open at end of input is `balanced: false` and pushes its
 * own warning — surfaced from every consuming branch, never swallowed.
 */
function consumeBlock(
  css: string,
  pos: { i: number },
  warnings: string[],
  baseLine: number,
): {
  body: string;
  balanced: boolean;
} {
  let quote = "";
  let depth = 1;
  const bodyStart = pos.i;
  const len = css.length;
  while (pos.i < len && depth > 0) {
    const ch: string = css[pos.i] ?? "";
    if (quote !== "") {
      if (ch === "\\") {
        pos.i += 2;
        continue;
      }
      if (ch === quote) quote = "";
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
    }
    pos.i++;
  }
  if (depth !== 0) {
    // EOF inside the block: the body runs to the end of input. (Previously
    // the final character was sliced off here and the truncation was
    // silent — the warning below is the surfaced condition.)
    const openLine = baseLine + countNewlines(css, 0, bodyStart - 1);
    warnings.push(
      `source ends inside an unterminated block that opened at line ` +
        `${openLine} — the remainder is kept as this block's body`,
    );
    return { body: css.slice(bodyStart, pos.i), balanced: false };
  }
  return { body: css.slice(bodyStart, pos.i - 1), balanced: true };
}

/**
 * Split comment-free CSS into top-level nodes (brace matching).
 *
 * Malformed tails never throw — a trimmer keeps rather than destroys — but
 * they are never silent either: every ignored tail appends a warning to
 * `warnings` naming the line (1-based, counted from `baseLine`) and what
 * was lost from there. `baseLine` defaults to 1; a nested block body
 * starts mid-file, so its parse reports absolute lines.
 */
export function parseCss(
  css: string,
  warnings: string[] = [],
  baseLine = 1,
): Node[] {
  const nodes: Node[] = [];
  const pos = { i: 0 };
  const len = css.length;
  const lineAt = (index: number): number =>
    baseLine + countNewlines(css, 0, index);

  const skipWs = (): void => {
    while (pos.i < len) {
      const ch: string = css[pos.i] ?? "";
      if (!/\s/.test(ch)) break;
      pos.i++;
    }
  };

  while (pos.i < len) {
    skipWs();
    if (pos.i >= len) break;
    if (css[pos.i] === "@") {
      const start = pos.i;
      const terminator = scanToTerminator(css, pos, new Set(["{", ";"]));
      const prelude = css.slice(start, pos.i).trim();
      if (terminator === ";") {
        pos.i++; // consume ;
        nodes.push({ kind: "raw", text: `${prelude};` });
        continue;
      }
      if (terminator !== "{") {
        warnings.push(
          `at-rule "${snippet(prelude)}" at line ${lineAt(start)} has no ` +
            '"{" or ";" before end of input — ignoring from there',
        );
        break; // unterminated — surfacing the lost tail, not swallowing it.
      }
      pos.i++; // consume {
      const bodyStart = pos.i;
      const { body } = consumeBlock(css, pos, warnings, baseLine);
      const name = prelude.split(/[\s(]/)[0] ?? "";
      if (name === "@media" || name === "@supports" || name === "@container") {
        nodes.push({
          kind: "nested",
          prelude,
          children: parseCss(body, warnings, lineAt(bodyStart)),
        });
      } else {
        nodes.push({ kind: "raw", text: `${prelude} {${body}}` });
      }
      continue;
    }
    // Qualified rule.
    const selStart = pos.i;
    const terminator = scanToTerminator(css, pos, new Set(["{"]));
    if (terminator !== "{") {
      warnings.push(
        `selector "${snippet(css.slice(selStart, pos.i))}" at line ` +
          `${lineAt(selStart)} has no "{" before end of input — ignoring from there`,
      );
      break; // unterminated — surfacing the lost tail, not swallowing it.
    }
    const selector = css.slice(selStart, pos.i).trim();
    pos.i++; // consume {
    const { body } = consumeBlock(css, pos, warnings, baseLine);
    nodes.push({ kind: "rule", selector, body: body.trim() });
  }
  return nodes;
}

export interface TrimOutcome {
  css: string;
  keptRules: number;
  droppedRules: number;
  droppedSelectors: string[];
  /**
   * Parse warnings: each malformed tail (unterminated at-rule, selector,
   * or block) with its line and what was ignored. Empty for clean input.
   */
  warnings: string[];
}

function ruleKept(selector: string, keep: (cls: string) => boolean): boolean {
  const classes = selector.match(SQ_CLASS_IN_SELECTOR) ?? [];
  if (classes.length === 0) return true; // structural — always keep.
  return classes.some((dotted) => keep(dotted.slice(1)));
}

function emit(nodes: Node[], keep: (cls: string) => boolean): TrimOutcome {
  const parts: string[] = [];
  let keptRules = 0;
  let droppedRules = 0;
  const droppedSelectors: string[] = [];
  for (const node of nodes) {
    if (node.kind === "raw") {
      parts.push(node.text);
      keptRules++;
    } else if (node.kind === "nested") {
      const inner = emit(node.children, keep);
      keptRules += inner.keptRules;
      droppedRules += inner.droppedRules;
      droppedSelectors.push(...inner.droppedSelectors);
      if (inner.css !== "") parts.push(`${node.prelude} {\n${inner.css}\n}`);
    } else if (ruleKept(node.selector, keep)) {
      parts.push(`${node.selector} {\n${node.body}\n}`);
      keptRules++;
    } else {
      droppedRules++;
      if (droppedSelectors.length < 50) droppedSelectors.push(node.selector);
    }
  }
  return {
    css: parts.join("\n\n"),
    keptRules,
    droppedRules,
    droppedSelectors,
    warnings: [],
  };
}

/** Every `.sq-*` class defined anywhere in the stylesheet. */
export function definedClasses(css: string): Set<string> {
  const found = new Set<string>();
  for (const m of css.matchAll(SQ_CLASS_IN_SELECTOR)) found.add(m[0].slice(1));
  return found;
}

/**
 * Trims `css` to `used` + `safelist`. Returns the trimmed CSS plus a full
 * outcome for reporting. Comments are not preserved in trimmed output
 * (production artifact; the complete build keeps them). Malformed tails
 * never abort the trim — they are collected in `outcome.warnings` so the
 * caller can surface exactly what the source lost.
 */
export function trimCss(
  css: string,
  used: Set<string>,
  safelist: Safelist,
): TrimOutcome {
  const keep = (cls: string): boolean =>
    used.has(cls) || isSafelisted(cls, safelist);
  const uncommented = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const warnings: string[] = [];
  const outcome = emit(parseCss(uncommented, warnings, 1), keep);
  return { ...outcome, warnings };
}
