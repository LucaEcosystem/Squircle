import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/dist/**", "**/node_modules/**", "**/coverage/**"] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    // Plain Node scripts (build tooling, test server): Node globals apply.
    files: ["**/*.mjs", "tests/e2e/server.mjs"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    // Consumer fixture JS: browser-only (window.Squircle, document,
    // HTMLElement) with no bundler. Add browser + Squircle globals
    // scoped to these files so no-undef stays honest everywhere else.
    files: ["fixtures/consumers/**/app.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
        Squircle: "readonly",
      },
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
);
