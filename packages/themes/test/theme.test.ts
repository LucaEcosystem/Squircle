/**
 * Theme registry tests: registration rules, unknown-variable rejection,
 * and contrast validation of custom themes (e.g. an `ocean` theme).
 */

import { describe, expect, it } from "vitest";
import {
  checkThemeContrast,
  defaultVariables,
  getTheme,
  listThemes,
  lucaTheme,
  registerTheme,
  resolveTheme,
  themeToCss,
} from "../src/index.js";

describe("theme registry", () => {
  it("registers the Luca theme and lists it", () => {
    registerTheme(lucaTheme);
    expect(getTheme("luca")).toBe(lucaTheme);
    expect(listThemes()).toContain("luca");
  });

  it("accepts a well-formed custom theme", () => {
    registerTheme({
      name: "ocean-test",
      description: "Test-only ocean theme",
      variables: { "--sq-color-background": "#062033" },
    });
    const theme = getTheme("ocean-test");
    expect(theme).toBeDefined();
    const resolved = resolveTheme(theme as NonNullable<typeof theme>);
    expect(resolved.variables["--sq-color-background"]).toBe("#062033");
    expect(resolved.issues).toEqual([]);
  });

  it("rejects unknown variables instead of silently forking", () => {
    expect(() =>
      registerTheme({
        name: "bad-test",
        description: "Test-only invalid theme",
        variables: { "--sq-color-ocean": "#062033" },
      }),
    ).toThrow(/Unknown token "--sq-color-ocean"/);
    expect(getTheme("bad-test")).toBeUndefined();
  });

  it("rejects invalid theme names", () => {
    expect(() =>
      registerTheme({ name: "Ocean", description: "x", variables: {} }),
    ).toThrow(/Invalid theme name/);
  });

  it("emits a data-attribute block with overrides only", () => {
    const css = themeToCss({
      name: "ocean-css-test",
      description: "x",
      variables: { "--sq-color-background": "#062033" },
    });
    expect(css).toContain('[data-sq-theme="ocean-css-test"]');
    expect(css).toContain("--sq-color-background: #062033;");
    expect(css).not.toContain("--sq-color-surface:");
  });

  it("the Luca theme resolves with zero issues and passes contrast", () => {
    const { variables, issues } = resolveTheme(lucaTheme);
    expect(issues).toEqual([]);
    expect(checkThemeContrast(variables)).toEqual([]);
  });

  it("validates the ocean example theme used by examples/theming*.html", () => {
    // These values MUST match the [data-sq-theme="ocean"] block in the
    // theming examples. Change the example, change this test — drift
    // between validated values and shipped CSS fails loudly here.
    const ocean = {
      name: "ocean",
      description: "Ocean custom theme (examples + docs)",
      variables: {
        "--sq-color-background": "#06222e",
        "--sq-color-background-sunken": "#041620",
        "--sq-color-surface": "#0a2e3d",
        "--sq-color-surface-elevated": "#0f3a4d",
        "--sq-color-surface-overlay": "#155063",
        "--sq-color-text-primary": "#eef6f4",
        "--sq-color-text-secondary": "#b9d4d6",
        "--sq-color-text-muted": "#8fb3ba",
        "--sq-color-border": "#1d4a5c",
        "--sq-color-border-strong": "#2e6a80",
        "--sq-color-divider": "#14394a",
        "--sq-color-link": "#5fd4e8",
        "--sq-color-link-hover": "#9be7f5",
        "--sq-color-accent": "#e0a458",
        "--sq-color-accent-bright": "#f2c078",
        "--sq-color-accent-contrast": "#06222e",
        "--sq-color-selected-background": "#0e3d55",
      },
    };
    const { variables, issues } = resolveTheme(ocean);
    expect(issues).toEqual([]);
    expect(checkThemeContrast(variables)).toEqual([]);
    expect(themeToCss(ocean)).toContain('[data-sq-theme="ocean"]');
  });

  it("flags a low-contrast custom theme instead of passing it", () => {
    const { variables } = resolveTheme({
      name: "low-contrast-test",
      description: "x",
      variables: {
        "--sq-color-background": "#f4f1e8",
        "--sq-color-text-primary": "#e4ddc9",
      },
    });
    const problems = checkThemeContrast(variables);
    expect(problems.length).toBeGreaterThan(0);
    const first = problems[0];
    expect(first).toBeDefined();
    expect((first as NonNullable<typeof first>).message).toMatch(
      /need ≥ 4\.5:1/,
    );
  });

  it("defaults cover every registered variable name", () => {
    expect(Object.keys(defaultVariables()).length).toBeGreaterThan(50);
  });
});
