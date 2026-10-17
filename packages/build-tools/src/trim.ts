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
 * keeps. Aggressiveness is a bug, not a feature.
 */

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

type Node =
  | { kind: "rule"; selector: string; body: string }
  | { kind: "nested"; prelude: string; children: Node[] }
  | { kind: "raw"; text: string };

const CLASS_IN_SELECTOR = /\.sq-[a-z0-9-]+/g;

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

/** Consumes a `{…}` block honoring strings; `pos.i` starts AFTER `{`. */
function consumeBlock(css: string, pos: { i: number }): string {
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
  return css.slice(bodyStart, pos.i - 1);
}

/** Split comment-free CSS into top-level nodes (brace matching). */
export function parseCss(css: string): Node[] {
  const nodes: Node[] = [];
  const pos = { i: 0 };
  const len = css.length;

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
      if (terminator !== "{") break; // unterminated — ignore the tail.
      pos.i++; // consume {
      const body = consumeBlock(css, pos);
      const name = prelude.split(/[\s(]/)[0] ?? "";
      if (name === "@media" || name === "@supports" || name === "@container") {
        nodes.push({ kind: "nested", prelude, children: parseCss(body) });
      } else {
        nodes.push({ kind: "raw", text: `${prelude} {${body}}` });
      }
      continue;
    }
    // Qualified rule.
    const selStart = pos.i;
    const terminator = scanToTerminator(css, pos, new Set(["{"]));
    if (terminator !== "{") break; // unterminated — ignore trailing garbage.
    const selector = css.slice(selStart, pos.i).trim();
    pos.i++; // consume {
    const body = consumeBlock(css, pos);
    nodes.push({ kind: "rule", selector, body: body.trim() });
  }
  return nodes;
}

export interface TrimOutcome {
  css: string;
  keptRules: number;
  droppedRules: number;
  droppedSelectors: string[];
}

function ruleKept(selector: string, keep: (cls: string) => boolean): boolean {
  const classes = selector.match(CLASS_IN_SELECTOR) ?? [];
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
  };
}

/** Every `.sq-*` class defined anywhere in the stylesheet. */
export function definedClasses(css: string): Set<string> {
  const found = new Set<string>();
  for (const m of css.matchAll(/\.sq-[a-z0-9-]+/g)) found.add(m[0].slice(1));
  return found;
}

/**
 * Trims `css` to `used` + `safelist`. Returns the trimmed CSS plus a full
 * outcome for reporting. Comments are not preserved in trimmed output
 * (production artifact; the complete build keeps them).
 */
export function trimCss(
  css: string,
  used: Set<string>,
  safelist: Safelist,
): TrimOutcome {
  const keep = (cls: string): boolean =>
    used.has(cls) || isSafelisted(cls, safelist);
  const uncommented = css.replace(/\/\*[\s\S]*?\*\//g, "");
  return emit(parseCss(uncommented), keep);
}
