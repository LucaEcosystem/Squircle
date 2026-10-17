/**
 * @squircle/themes — public entry point (TypeScript for tooling;
 * consumers of the built CSS never need TypeScript).
 */

export {
  checkThemeContrast,
  defaultVariables,
  getTheme,
  listThemes,
  registerTheme,
  resolveTheme,
  themeToCss,
} from "./theme.js";
export type { ThemeDefinition, ThemeIssue } from "./theme.js";
export { builtinThemes, lucaTheme } from "./luca.js";
