/**
 * @squircle/themes — theme registry and validation.
 *
 * A theme is a named mapping of CSS custom properties. Themes may ONLY set
 * variables defined by `@squircle/tokens` — validation rejects unknown
 * names, so a typo can never silently fork the design system.
 *
 * The Luca Ecosystem Theme is the default. Other themes (e.g. `ocean`)
 * override semantic variables without touching component implementations.
 * There is no light-mode coercion: the default root values ARE the Luca
 * dark theme, and `data-sq-theme="luca"` re-declares them explicitly.
 */

import { contrastRatio, flattenTokens, semantic } from "@squircle/tokens";

export interface ThemeDefinition {
  /** Unique theme name; used as `data-sq-theme="<name>"`. */
  name: string;
  /** Human-readable description for docs tooling. */
  description: string;
  /** CSS variable overrides, e.g. `{ "--sq-color-background": "#001a2b" }`. */
  variables: Record<string, string>;
}

export interface ThemeIssue {
  variable: string;
  message: string;
}

const knownVariables: ReadonlySet<string> = new Set(
  flattenTokens(semantic).map((t) => t.name),
);

/** Default variable values — the `:root` emission from tokens. */
export function defaultVariables(): Record<string, string> {
  return Object.fromEntries(
    flattenTokens(semantic).map((t) => [t.name, t.value]),
  );
}

/**
 * Resolves a theme over the defaults: defaults first, theme overrides win.
 * Unknown variables are dropped from the result AND reported as issues.
 */
export function resolveTheme(theme: ThemeDefinition): {
  variables: Record<string, string>;
  issues: ThemeIssue[];
} {
  const issues: ThemeIssue[] = [];
  const variables = defaultVariables();
  for (const [name, value] of Object.entries(theme.variables)) {
    if (!knownVariables.has(name)) {
      issues.push({
        variable: name,
        message: `Unknown token "${name}". Themes may only set variables defined by @squircle/tokens.`,
      });
      continue;
    }
    if (typeof value !== "string" || value.trim() === "") {
      issues.push({ variable: name, message: `Empty value for "${name}".` });
      continue;
    }
    variables[name] = value;
  }
  return { variables, issues };
}

const AA_TEXT = 4.5;

/**
 * Checks the resolved theme's text/background and fill pairs against
 * WCAG 2.2 AA. Returns human-readable failures; empty means compliant.
 * Non-text pairs (borders, shadows) are intentionally not asserted here.
 */
export function checkThemeContrast(
  resolved: Record<string, string>,
): ThemeIssue[] {
  const v = (name: string): string => {
    const value = resolved[name];
    if (value === undefined) throw new Error(`missing token ${name}`);
    return value;
  };
  const pairs: Array<[string, string]> = [
    ["--sq-color-text-primary", "--sq-color-background"],
    ["--sq-color-text-secondary", "--sq-color-background"],
    ["--sq-color-text-muted", "--sq-color-background"],
    ["--sq-color-text-primary", "--sq-color-surface"],
    ["--sq-color-text-muted", "--sq-color-surface-elevated"],
    ["--sq-color-link", "--sq-color-background"],
    ["--sq-color-accent-contrast", "--sq-color-accent"],
  ];
  const issues: ThemeIssue[] = [];
  for (const [fgName, bgName] of pairs) {
    let ratio: number;
    try {
      ratio = contrastRatio(v(fgName), v(bgName));
    } catch {
      // Non-hex values (e.g. color-mix() in a custom theme) cannot be
      // statically checked — reported, never silently passed.
      issues.push({
        variable: fgName,
        message: `${fgName} on ${bgName} uses a non-hex value and needs manual contrast verification.`,
      });
      continue;
    }
    if (ratio < AA_TEXT) {
      issues.push({
        variable: fgName,
        message: `${fgName} on ${bgName} = ${ratio.toFixed(2)}:1, need ≥ 4.5:1 (WCAG 2.2 AA).`,
      });
    }
  }
  return issues;
}

const registry = new Map<string, ThemeDefinition>();

/** Registers a theme; throws on duplicate names or invalid definitions. */
export function registerTheme(theme: ThemeDefinition): void {
  if (!/^[a-z][a-z0-9-]*$/.test(theme.name)) {
    throw new Error(
      `Invalid theme name "${theme.name}": use lowercase letters, digits, hyphens.`,
    );
  }
  if (registry.has(theme.name)) {
    throw new Error(`Theme "${theme.name}" is already registered.`);
  }
  const { issues } = resolveTheme(theme);
  if (issues.length > 0) {
    throw new Error(
      `Theme "${theme.name}" is invalid:\n${issues.map((i) => `- ${i.message}`).join("\n")}`,
    );
  }
  registry.set(theme.name, theme);
}

export function getTheme(name: string): ThemeDefinition | undefined {
  return registry.get(name);
}

export function listThemes(): string[] {
  return [...registry.keys()];
}

/** Emits `[data-sq-theme="<name>"] { … }` for use in stylesheets. */
export function themeToCss(theme: ThemeDefinition): string {
  const { variables } = resolveTheme(theme);
  const defaults = defaultVariables();
  const overrides = Object.entries(variables).filter(
    ([name, value]) => defaults[name] !== value,
  );
  const body = overrides
    .map(([name, value]) => `  ${name}: ${value};`)
    .join("\n");
  return `[data-sq-theme="${theme.name}"] {\n${body}\n}\n`;
}
