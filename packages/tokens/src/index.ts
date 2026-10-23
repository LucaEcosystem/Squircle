/**
 * @squircle/tokens — public entry point.
 *
 * The token source of truth. TypeScript powers development and tooling;
 * consumers of the built CSS never need TypeScript (see `dist/tokens.css`).
 */

export { primitives } from "./primitives.js";
export type { Primitives } from "./primitives.js";
export { semantic } from "./semantic.js";
export type { Semantic } from "./semantic.js";
export { component } from "./component.js";
export type { ComponentTokens } from "./component.js";
export { flattenTokens, tokenVarName } from "./flatten.js";
export { aaContrastPairs, contrastRatio, luminance } from "./contrast.js";
export type { ContrastPair } from "./contrast.js";
