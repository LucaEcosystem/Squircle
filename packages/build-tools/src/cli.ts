#!/usr/bin/env node
/**
 * `sq-trim` — conservative unused-CSS removal for Squircle stylesheets.
 *
 * Usage:
 *   sq-trim --css <complete.css> --sources "<glob>" [--sources …]
 *           --out <trimmed.css> [--report <report.json>]
 *           [--safelist <cls> …] [--safelist-prefix <pfx> …]
 *           [--safelist-pattern <regex> …] [--config <file.json>]
 *
 * Exit codes: 0 success (even with diagnostics — diagnostics inform, they
 * do not fail); 1 usage/IO error; 2 the output would keep ZERO sq-*
 * rules, which means the sources almost certainly missed the project.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { collectFiles, isFile } from "./index.js";
import { scanSource, emptyResult, mergeScan } from "./index.js";
import { definedClasses, emptySafelist, trimCss } from "./index.js";

interface Args {
  css?: string;
  sources: string[];
  out?: string;
  report?: string;
  safelist: string[];
  safelistPrefix: string[];
  safelistPattern: string[];
  config?: string;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    sources: [],
    safelist: [],
    safelistPrefix: [],
    safelistPattern: [],
  };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const next = argv[i + 1];
    const need = (): string => {
      if (next === undefined) throw new Error(`${flag} needs a value`);
      i++;
      return next;
    };
    if (flag === "--css") args.css = need();
    else if (flag === "--sources") args.sources.push(need());
    else if (flag === "--out") args.out = need();
    else if (flag === "--report") args.report = need();
    else if (flag === "--safelist") args.safelist.push(need());
    else if (flag === "--safelist-prefix") args.safelistPrefix.push(need());
    else if (flag === "--safelist-pattern") args.safelistPattern.push(need());
    else if (flag === "--config") args.config = need();
    else if (flag === "--help" || flag === "-h") {
      console.log(
        "sq-trim --css <css> --sources <glob>… --out <css> [--report <json>] [--safelist <cls>…] [--safelist-prefix <pfx>…] [--safelist-pattern <re>…] [--config <json>]",
      );
      process.exit(0);
    } else throw new Error(`unknown flag ${flag}`);
  }
  return args;
}

interface FileConfig {
  css?: string;
  sources?: string[];
  out?: string;
  report?: string;
  safelist?: Array<string | { prefix?: string; pattern?: string }>;
}

function applyConfig(args: Args, path: string): void {
  const raw = readFileSync(path, "utf8");
  const config = JSON.parse(raw) as FileConfig;
  if (args.css === undefined && config.css !== undefined) args.css = config.css;
  if (args.out === undefined && config.out !== undefined) args.out = config.out;
  if (args.report === undefined && config.report !== undefined) {
    args.report = config.report;
  }
  if (args.sources.length === 0 && config.sources) {
    args.sources.push(...config.sources);
  }
  for (const entry of config.safelist ?? []) {
    if (typeof entry === "string") args.safelist.push(entry);
    else if (entry.prefix) args.safelistPrefix.push(entry.prefix);
    else if (entry.pattern) args.safelistPattern.push(entry.pattern);
  }
}

function main(): void {
  let args: Args;
  try {
    args = parseArgs(process.argv.slice(2));
    if (args.config) applyConfig(args, args.config);
    if (!args.css || args.sources.length === 0 || !args.out) {
      throw new Error("required: --css <file> --sources <glob>… --out <file>");
    }
  } catch (error) {
    console.error(`sq-trim: ${(error as Error).message}`);
    process.exit(1);
  }

  const root = process.cwd();
  const cssPath = resolve(root, args.css);
  if (!isFile(cssPath)) {
    console.error(`sq-trim: CSS not found: ${cssPath}`);
    process.exit(1);
  }
  const files = collectFiles(root, args.sources);
  if (files.length === 0) {
    console.error(
      `sq-trim: no source files matched: ${args.sources.join(", ")}`,
    );
    process.exit(1);
  }

  const scanned = emptyResult();
  const skipped: string[] = [];
  for (const file of files) {
    const result = scanSource(readFileSync(file, "utf8"), file);
    if (result === null) {
      skipped.push(file);
      continue;
    }
    mergeScan(scanned, result);
  }

  const safelist = emptySafelist();
  for (const cls of args.safelist) safelist.exact.add(cls);
  safelist.prefixes.push(...args.safelistPrefix);
  for (const source of args.safelistPattern) {
    try {
      safelist.patterns.push(new RegExp(source));
    } catch {
      console.error(`sq-trim: invalid --safelist-pattern: ${source}`);
      process.exit(1);
    }
  }

  const complete = readFileSync(cssPath, "utf8");
  const defined = definedClasses(complete);
  const outcome = trimCss(complete, scanned.static, safelist);

  const unknownClasses = [...scanned.static]
    .filter((cls) => !defined.has(cls))
    .sort();
  const safelistMisses = [
    ...safelist.exact,
    ...safelist.prefixes.map((prefix) => `${prefix}*`),
  ].filter((entry) => {
    const probe = entry.endsWith("*") ? entry.slice(0, -1) : entry;
    return ![...defined].some((cls) => cls === probe || cls.startsWith(probe));
  });

  if (outcome.keptRules === 0 || !outcome.css.includes(".sq-")) {
    console.error(
      "sq-trim: refusing to write output with zero sq-* rules — check --sources coverage",
    );
    process.exit(2);
  }

  const outPath = resolve(root, args.out);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, outcome.css);

  const report = {
    css: cssPath,
    sources: files,
    skipped,
    out: outPath,
    completeBytes: complete.length,
    trimmedBytes: outcome.css.length,
    savedBytes: complete.length - outcome.css.length,
    keptRules: outcome.keptRules,
    droppedRules: outcome.droppedRules,
    usedClasses: scanned.static.size,
    definedClasses: defined.size,
    themesReferenced: [...scanned.themes].sort(),
    unknownClasses,
    safelistMisses,
    dynamicHints: scanned.dynamicHints,
    droppedSelectorsSample: outcome.droppedSelectors,
  };
  if (args.report) {
    const reportPath = resolve(root, args.report);
    mkdirSync(dirname(reportPath), { recursive: true });
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
  }

  console.log(
    `sq-trim: ${files.length} source files, ${scanned.static.size} used classes -> ` +
      `${outPath} (${outcome.css.length} bytes, saved ${complete.length - outcome.css.length})`,
  );
  for (const cls of unknownClasses) {
    console.log(
      `sq-trim: hint: class "${cls}" is used but not defined — typo?`,
    );
  }
  for (const miss of safelistMisses) {
    console.log(
      `sq-trim: hint: safelist entry "${miss}" matches nothing — typo?`,
    );
  }
  for (const hint of scanned.dynamicHints) {
    console.log(`sq-trim: hint: ${hint}`);
  }
}

main();
