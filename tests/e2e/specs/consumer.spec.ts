/**
 * Clean consumer-project verification.
 *
 * Installs the PACKED `squircle` tarball with plain `npm` (not pnpm,
 * not the workspace) into a shop fixture, then proves the public entry
 * points work from a project that knows nothing about the monorepo:
 * tarball contents, Node ESM resolution via the exports map, browser
 * behavior over HTTP, direct file:// behavior, consumer token/component
 * overrides, and trimming the PACKAGED css.
 *
 * Chromium only. The pack/install/trim pipeline is browser-independent,
 * and artifacts written into the shared fixture (node_modules,
 * squircle.trimmed.css, trim-report.json) would contend across engines;
 * engine-specific behavior is covered exhaustively by the main specs.
 * Serial within a file: later tests consume earlier steps' outputs.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";

test.skip(
  ({ browserName }) => browserName !== "chromium",
  "Packaged-artifact verification is asserted on Chromium only",
);

test.describe.configure({ mode: "serial" });

const root = fileURLToPath(new URL("../../../", import.meta.url));
const shop = join(root, "fixtures", "consumers", "shop-chromium");
const publicPackageJson = join(root, "packages", "squircle", "package.json");

/**
 * Resolves `node`/`npm`/`corepack` to their absolute path so the spec
 * works regardless of whether the host shell has `/usr/local/bin` on
 * PATH (Playwright workers inherit a minimal env in CI and in the
 * Agnes desktop host).
 */
function sh(cmd: string, args: string[], cwd: string): string {
  // Playwright's child-process env may omit the node/npm/corepack bins we
  // need for the pack/install/resolve steps. Explicitly merge the
  // known-good prefixes so the spec is not dependent on the shell that
  // launched the suite.
  const env = {
    ...process.env,
    PATH: ["/usr/local/bin", "/opt/homebrew/bin", process.env.PATH ?? ""].join(
      ":",
    ),
  };
  return execFileSync(cmd, args, { cwd, encoding: "utf8", stdio: "pipe", env });
}

test.describe("consumer install from packed tarball", () => {
  test("packs, installs with npm, and resolves the exports map", async () => {
    const version = JSON.parse(readFileSync(publicPackageJson, "utf8")).version;
    const installed = join(shop, "node_modules", "@luca-ecosystem", "squircle");
    const tmp = mkdtempSync(join(tmpdir(), "sq-consumer-"));
    // Pack the public package exactly as the registry would receive it.
    const packOut = sh(
      "corepack",
      ["pnpm", "--filter", "squircle", "pack", "--pack-destination", tmp],
      root,
    );
    const tarballName = `luca-ecosystem-squircle-${version}.tgz`;
    expect(packOut).toContain(tarballName);
    const tarball = join(tmp, tarballName);
    expect(existsSync(tarball)).toBe(true);

    // Packed contents: dist + README + package.json. No sources, no
    // configs, no workspace internals.
    const contents = sh("tar", ["-tzf", tarball], root);
    const files = contents.trim().split("\n");
    expect(files).toContain("package/dist/squircle.min.css");
    expect(files).toContain("package/dist/squircle-runtime.mjs");
    expect(files).toContain("package/dist/squircle-icons.svg");
    expect(files).toContain("package/dist/icons.json");
    expect(files).toContain("package/README.md");
    expect(files.some((f) => f.includes("/src/"))).toBe(false);
    expect(files.some((f) => f.endsWith("build.mjs"))).toBe(false);

    // Clean-room install with npm (proves manager independence).
    // --no-save/--package-lock=false keep the committed fixture pristine:
    // the tarball under test is installed explicitly, never declared.
    rmSync(join(shop, "node_modules"), { recursive: true, force: true });
    const cacheDir = join(tmpdir(), "sq-npm-cache-chromium");
    sh(
      "npm",
      [
        "install",
        "--cache",
        cacheDir,
        "--no-audit",
        "--no-fund",
        "--no-save",
        "--package-lock=false",
        tarball,
      ],
      shop,
    );
    const manifest = JSON.parse(
      readFileSync(join(installed, "package.json"), "utf8"),
    );
    expect(manifest.name).toBe("@luca-ecosystem/squircle");
    expect(manifest.version).toBe(version);
    expect(manifest.license).toBe("MIT");
    for (const artifact of [
      "dist/squircle.min.css",
      "dist/squircle-runtime.js",
      "dist/squircle-runtime.mjs",
      "dist/index.d.ts",
      "dist/squircle-icons.svg",
      "dist/icons.json",
      "dist/tokens.css",
      "dist/fonts.css",
    ]) {
      expect(existsSync(join(installed, artifact)), artifact).toBe(true);
    }
  });

  test("Node resolves bare '@luca-ecosystem/squircle' through the exports map", async () => {
    const out = sh(
      "node",
      [
        "--input-type=module",
        "-e",
        "import('@luca-ecosystem/squircle').then((m) => console.log([typeof m.setTheme, typeof m.notify, typeof m.openDialog, typeof m.init].join(' ')))",
      ],
      shop,
    ).trim();
    expect(out).toBe("function function function function");
  });
});

test.describe("consumer page over HTTP (installed package)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/${shop.slice(root.length)}/index.html`);
    await page.bringToFront();
  });

  test("theme, overrides, and every family render", async ({
    page,
  }: {
    page: Page;
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.reload();
    await expect(page.locator("body")).toHaveCSS(
      "background-color",
      "rgb(19, 30, 51)",
    );
    // Consumer token override wins (accent retuned, no !important).
    await expect(page.locator("#toast-demo")).toHaveCSS(
      "background-color",
      "rgb(124, 92, 255)",
    );
    // Consumer component rule wins by source order.
    await expect(page.locator(".sq-card").first()).toHaveCSS(
      "border-top-width",
      "2px",
    );
    // Icon served from the installed sprite renders.
    const spriteIcon = page.locator(".sq-card use");
    const box = await spriteIcon.boundingBox();
    expect(box?.width).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });

  test("runtime behaviors work from the installed bundle", async ({
    page,
  }: {
    page: Page;
  }) => {
    await page.locator("#toast-demo").click();
    await expect(page.locator(".sq-toast__text")).toContainText("restocked");
    await page.locator("#open-hours").click();
    await expect(page.locator("#hours-dialog")).toHaveAttribute("open", "");
    await page.keyboard.press("Escape");
    await expect(page.locator("#open-hours")).toBeFocused();
    await page.locator("#shop-menu-trigger").click();
    await expect(page.locator("#shop-menu")).toBeVisible();
    await page.keyboard.press("Escape");
    const tabs = page.locator('[aria-label="Departments"] [role="tab"]');
    await tabs.nth(1).click();
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    // Dynamic class resolves through the safelisted tones.
    await page.locator("#tone-cycle").click();
    await expect(page.locator("#dynamic-badge")).toHaveClass(
      /sq-badge--success/,
    );
    await expect(page.locator("#dynamic-badge")).toHaveCSS(
      "background-color",
      "rgb(0, 255, 0)",
    );
  });

  test("form validation focuses the packaged path", async ({
    page,
  }: {
    page: Page;
  }) => {
    await page.locator("#pickup-submit").click();
    await expect(page.locator("#c-name")).toBeFocused();
    await expect(page.locator("#c-name-error")).toBeVisible();
  });

  test("ESM page imports bare '@luca-ecosystem/squircle' via import map", async ({
    page,
  }: {
    page: Page;
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`/${shop.slice(root.length)}/module.html`);
    await expect(page.locator("#module-status")).toContainText(
      "Active theme: luca",
    );
    await page.locator("#module-toast").click();
    await expect(page.locator(".sq-toast__text")).toContainText(
      "from the ESM import",
    );
    expect(errors).toEqual([]);
  });
});

test.describe("consumer direct file:// (classic path)", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "file:// support is asserted on Chromium only",
  );

  test("packaged CSS + IIFE work with zero server", async ({
    page,
  }: {
    page: Page;
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`file://${shop}/index.html`);
    await expect(page.locator("body")).toHaveCSS(
      "background-color",
      "rgb(19, 30, 51)",
    );
    // Classic API is present and functional from file://.
    await expect(await page.evaluate(() => window.Squircle.getTheme())).toBe(
      "luca",
    );
    await page.locator("#toast-demo").click();
    await expect(page.locator(".sq-toast__text")).toContainText("restocked");
    expect(errors).toEqual([]);
  });
});

test.describe("consumer trimming (packaged CSS)", () => {
  test("used, safelisted, and structural styles survive", async () => {
    const cli = join(root, "packages", "build-tools", "dist", "cli.js");
    execFileSync(
      "node",
      [cli, "--config", join(shop, "squircle.config.json")],
      { cwd: root, stdio: "pipe" },
    );
    const trimmed = readFileSync(join(shop, "squircle.trimmed.css"), "utf8");
    const report = JSON.parse(
      readFileSync(join(shop, "trim-report.json"), "utf8"),
    );
    const complete = readFileSync(
      join(root, "packages", "squircle", "dist", "squircle.css"),
      "utf8",
    );
    expect(report.completeBytes).toBe(complete.length);
    expect(report.trimmedBytes).toBeLessThan(complete.length * 0.6);
    // Used classes kept…
    for (const selector of [
      ".sq-toast {",
      ".sq-icon {",
      ".sq-table {",
      ".sq-nav-menu > summary {",
      ".sq-disclosure > summary {",
    ]) {
      expect(trimmed, `missing ${selector}`).toContain(selector);
    }
    // …safelisted dynamic tones kept (flagged AND preserved)…
    for (const selector of [
      ".sq-badge--success {",
      ".sq-badge--warning {",
      ".sq-badge--error {",
    ]) {
      expect(trimmed, `missing ${selector}`).toContain(selector);
    }
    expect(
      report.dynamicHints.some((hint: string) => hint.includes("sq-badge--")),
      "dynamic pattern should be reported",
    ).toBe(true);
    // …theme tokens, structural rules, and animations survive…
    expect(trimmed).toContain(":root {");
    expect(trimmed).toContain("--sq-color-background: #131e33;");
    expect(trimmed).toContain("@keyframes sq-rise-in");
    expect(trimmed).toContain("@keyframes sq-spin");
    // …and genuinely unused utilities are gone.
    expect(trimmed).not.toContain(".sq-xl-text-center {");
  });
});
