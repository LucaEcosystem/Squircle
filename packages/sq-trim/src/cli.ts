#!/usr/bin/env node
/**
 * `sq-trim` (npm: `@luca-ecosystem/sq-trim`) — the conservative
 * unused-CSS removal CLI for Squircle stylesheets, on its own npm
 * handle for projects that only want trimming.
 *
 * This bin does not reimplement anything: it executes
 * `@squircle/build-tools`' CLI directly, so both handles always share
 * one engine, one flag surface, one exit-code contract, and one set of
 * warnings. See the engine's README for the full contract:
 * https://github.com/LucaEcosystem/Squircle/tree/main/Framework/packages/build-tools
 *
 * Usage (identical to `@squircle/build-tools`' `sq-trim`):
 *   sq-trim --css <complete.css> --sources "<glob>" [--sources …]
 *           --out <trimmed.css> [--report <report.json>]
 *           [--safelist <cls> …] [--safelist-prefix <pfx> …]
 *           [--safelist-pattern <regex> …] [--config <file.json>]
 *
 * Exit codes: 0 success (even with diagnostics — diagnostics inform,
 * they do not fail); 1 usage/IO error; 2 the output would keep ZERO
 * sq-* rules, which means --sources almost certainly missed the
 * project.
 */

import "@squircle/build-tools/dist/cli.js";
