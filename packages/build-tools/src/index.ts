/**
 * @squircle/build-tools — public entry point.
 *
 * `sq-trim`: conservative unused-CSS removal. Keeps what is used,
 * safelisted, structural, token, or theme-related; reports everything
 * it cannot prove. See README.md for the contract.
 */

export {
  emptyResult,
  mergeScan,
  scanHtml,
  scanJs,
  scanSource,
} from "./scan.js";
export type { ScanResult } from "./scan.js";
export {
  applySafelistEntry,
  definedClasses,
  emptySafelist,
  isSafelisted,
  parseCss,
  trimCss,
} from "./trim.js";
export type { Safelist, TrimOutcome } from "./trim.js";
export { collectFiles, isFile, readTextFile } from "./files.js";
