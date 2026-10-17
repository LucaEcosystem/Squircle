/**
 * Flattens the three token tiers into CSS custom-property declarations.
 *
 * Naming: `--sq-{tier}-{path…}`, e.g. `--sq-color-background`,
 * `--sq-space-md`, `--sq-button-padding-x`. Tier prefixes (`color`,
 * `space`, `font`, `radius`, …) are the semantic/component group names,
 * so collisions across groups are impossible by construction.
 */

type TokenBranch = string | { readonly [key: string]: TokenBranch };

function isLeaf(value: TokenBranch): value is string {
  return typeof value === "string";
}

function* walk(
  branch: TokenBranch,
  trail: string[],
): Generator<{ path: string[]; value: string }> {
  if (isLeaf(branch)) {
    yield { path: trail, value: branch };
    return;
  }
  for (const [key, child] of Object.entries(branch)) {
    yield* walk(child, [...trail, key]);
  }
}

/** CSS variable name for a token path within a tier group. */
export function tokenVarName(group: string, path: string[]): string {
  const kebab = (segment: string): string =>
    segment
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
      .replace(/([a-zA-Z])([0-9])/g, "$1-$2")
      .toLowerCase();
  return `--sq-${kebab(group)}-${path.map(kebab).join("-")}`;
}

/** Every token in a tier object as `{ name, value }` pairs. */
export function flattenTokens(tier: {
  readonly [group: string]: TokenBranch;
}): Array<{ name: string; value: string }> {
  const out: Array<{ name: string; value: string }> = [];
  for (const [group, branch] of Object.entries(tier)) {
    for (const { path, value } of walk(branch, [])) {
      out.push({ name: tokenVarName(group, path), value });
    }
  }
  return out;
}
