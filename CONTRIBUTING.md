# Contributing to Squircle

Thanks for your interest in contributing. This guide covers local
development, testing, and the conventions that keep the framework coherent.

## Requirements

- **Node.js 20+**
- **pnpm 12** (pinned via `packageManager` in the root `package.json`; use
  Corepack so the exact version is used):

  ```bash
  corepack enable
  corepack prepare pnpm@12.11.2 --activate
  ```

## Getting started

```bash
# 1. Install workspace dependencies
pnpm install

# 2. Build every package in dependency order
pnpm build

# 3. Type-check + per-package gates
pnpm check
```

## Commands

| Command                                   | What it does                                                                                   |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `pnpm build`                              | Builds all packages (tokens → themes → css → runtime → build-tools → squircle)                 |
| `pnpm check`                              | Runs `tsc --noEmit` and each package's gate (icon separation, package assembly, CSS freshness) |
| `pnpm test`                               | Runs the unit/integration test suite (Vitest)                                                  |
| `pnpm test:e2e`                           | Runs the Playwright browser suite (needs `pnpm exec playwright install` first)                 |
| `pnpm lint`                               | ESLint across the repo                                                                         |
| `pnpm format:check` / `pnpm format:write` | Prettier audit / apply                                                                         |
| `pnpm clean`                              | Removes generated `dist/` output                                                               |

## Repository layout

- `packages/tokens` — design-token source of truth (TypeScript → CSS custom
  properties). Edit here; CSS is generated.
- `packages/themes` — theme registry and the Luca Ecosystem Theme.
- `packages/css` — the 12 authored CSS layers and `build.mjs` that assembles
  the final bundle with Lightning CSS.
- `packages/runtime` — framework-independent browser runtime.
- `packages/icons` — original SVG icon sources; build produces sprite + files.
- `packages/build-tools` — `sq-trim` unused-CSS optimizer.
- `packages/squircle` — the public, assembled package (`dist/`).
- `packages/components` — component HTML contracts and docs.
- `examples/` — working pages and production templates.
- `fixtures/` — clean-room consumer projects used by the e2e suite.

## Conventions

- **Token discipline.** CSS layers must reference `--sq-*` tokens, never raw
  hex, so themes stay consistent. The test suite enforces this — if a token
  is missing, add it to the token tiers (never weaken the test).
- **No hardcoded colors in utility CSS.** Enforced by `packages/css` tests.
- **Components are native-element-first.** Native semantics (`<dialog>`,
  labels, constraint validation) do the work; the runtime adds focus,
  dismissal, and positioning on top.
- **Generous whitespace is a requirement, not a preference.** Evaluate
  components and layouts at multiple viewport widths and interaction states.

## Testing your change

At minimum, before opening a pull request:

```bash
pnpm build
pnpm check
pnpm test
pnpm lint
pnpm format:check
```

For CSS or component behavior changes, also run the relevant Playwright
specs:

```bash
pnpm exec playwright install
pnpm test:e2e -- --project=chromium
```

## Adding a component or icon

- Keep HTML contracts in `packages/components/`, styles in the matching
  `packages/css/src/*.css` layer, and behavior in `packages/runtime/`.
- New icons go in `packages/icons/src/original/` as kebab-named, 24-grid,
  `currentColor`-only SVGs, then `pnpm -C packages/icons build`.

## License

By contributing, you agree that your contributions are licensed under the
project's [MIT license](LICENSE).
