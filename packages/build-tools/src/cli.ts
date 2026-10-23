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
 *
 * Warnings (skipped directories, safelist ambiguity, malformed CSS tails)
 * go to stderr with `sq-trim: warning:` and the file path; exit stays 0.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { collectFiles, isFile, readTextFile } from "./index.js";
import { scanSource, emptyResult, mergeScan } from "./index.js";
import {
  applySafelistEntry,
  definedClasses,
  emptySafelist,
  trimCss,
} from "./index.js";
import type { Safelist } from "./index.js";

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

function applyConfig(
  args: Args,
  path: string,
  safelist: Safelist,
  safelistWarnings: string[],
): void {
  // readTextFile throws naming path + errno cause; the parse phase's
  // single catch in main() turns it into the clean CLI exit.
  const raw = readTextFile(path, "config file");
  let config: FileConfig;
  try {
    config = JSON.parse(raw) as FileConfig;
  } catch (error) {
    throw new Error(
      `cannot parse config file "${path}": ${(error as Error).message}`,
      { cause: error },
    );
  }
  if (args.css === undefined && config.css !== undefined) args.css = config.css;
  if (args.out === undefined && config.out !== undefined) args.out = config.out;
  if (args.report === undefined && config.report !== undefined) {
    args.report = config.report;
  }
  if (args.sources.length === 0 && config.sources) {
    args.sources.push(...config.sources);
  }
  for (const entry of config.safelist ?? []) {
    applySafelistEntry(safelist, entry, path, safelistWarnings);
  }
}

/** Reads `path` as UTF-8, or prints a contextual error and exits 1. */
function readOrExit(path: string, context: string): string {
  try {
    return readTextFile(path, context);
  } catch (error) {
    console.error(`sq-trim: ${(error as Error).message}`);
    process.exit(1);
  }
}

function main(): void {
  const safelist = emptySafelist();
  const safelistWarnings: string[] = [];
  let args: Args;
  try {
    args = parseArgs(process.argv.slice(2));
    if (args.config) applyConfig(args, args.config, safelist, safelistWarnings);
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
  const skippedDirectories: string[] = [];
  const files = collectFiles(root, args.sources, skippedDirectories);
  if (files.length === 0) {
    console.error(
      `sq-trim: no source files matched: ${args.sources.join(", ")}`,
    );
    process.exit(1);
  }

  const scanned = emptyResult();
  const skipped: string[] = [];
  for (const file of files) {
    const source = readOrExit(file, "source file");
    const result = scanSource(source, file);
    if (result === null) {
      skipped.push(file);
      continue;
    }
    mergeScan(scanned, result);
  }

  try {
    for (const cls of args.safelist) {
      applySafelistEntry(safelist, cls, "--safelist", safelistWarnings);
    }
    for (const prefix of args.safelistPrefix) {
      applySafelistEntry(
        safelist,
        { prefix },
        "--safelist-prefix",
        safelistWarnings,
      );
    }
    for (const source of args.safelistPattern) {
      applySafelistEntry(
        safelist,
        { pattern: source },
        "--safelist-pattern",
        safelistWarnings,
      );
    }
  } catch (error) {
    console.error(`sq-trim: ${(error as Error).message}`);
    process.exit(1);
  }

  const complete = readOrExit(cssPath, "CSS file");
  const defined = definedClasses(complete);
  const outcome = trimCss(complete, scanned.static, safelist);

  // Warnings inform, they never fail (exit stays 0, output stays
  // conservative): every one says exactly what was skipped or ignored.
  for (const line of [
    ...safelistWarnings,
    ...skippedDirectories,
    ...outcome.warnings.map((warning) => `${cssPath}: ${warning}`),
  ]) {
    console.error(`sq-trim: warning: ${line}`);
  }

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
    skippedDirectories,
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
    parseWarnings: outcome.warnings,
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
