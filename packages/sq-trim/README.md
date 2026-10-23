# @luca-ecosystem/sq-trim

`sq-trim` — conservative unused-CSS removal for Squircle stylesheets, on
its own npm handle for projects that only want trimming:

```sh
npx @luca-ecosystem/sq-trim \
  --css node_modules/@luca-ecosystem/squircle/dist/squircle.min.css \
  --sources "src/**/*.html" --sources "src/**/*.js" \
  --out dist/squircle.trimmed.css --report dist/sq-trim.json
```

## Why another package

The engine lives in [`@squircle/build-tools`](../build-tools/README.md)
and is what the Squircle repo itself uses during assembly. This package
exists solely for distribution: `npx @luca-ecosystem/sq-trim …` should
work without knowing an internal toolchain exists. It executes the
engine's CLI directly — one engine, one flag surface, one exit-code
contract, no mirrored code to drift.

## Contract (identical to the engine)

- **Flags**: `--css`, `--sources` (repeatable), `--out`, `--report`,
  `--safelist`, `--safelist-prefix`, `--safelist-pattern`, `--config`.
- **Conservative by design**: keeps every class that a source file uses,
  everything safelisted, and all structural, token, and theme-related
  rules. Anything it cannot prove safe is kept and, when it drops a
  parse-understood rule it considers unused, records that decision in
  the report instead of staying silent.
- **Exit codes**: `0` success (diagnostics on stderr inform, they do not
  fail); `1` usage/IO error; `2` the output would keep zero `sq-*` rules
  (sources almost certainly missed the project — nothing is written).
- **Report JSON**: records every decision — used classes, defined
  classes, unknown classes (typo hints), safelist misses, dynamic-usage
  hints, dropped selectors, byte savings.

## Installing both handles

`@squircle/build-tools` also installs a `sq-trim` bin. Installing both
packages is harmless — they run the same code; whichever npm links last
wins and behavior is identical.
