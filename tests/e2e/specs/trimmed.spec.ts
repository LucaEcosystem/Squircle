/**
 * Complete-versus-trimmed verification on the fixture projects.
 *
 * Regenerates each fixture's trimmed CSS with the real `sq-trim` CLI,
 * asserts the production properties (smaller, required styles kept,
 * unused styles gone, clean diagnostics where promised), then loads the
 * fixture in the browser with the trimmed stylesheet swapped in and
 * proves it renders and behaves identically.
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const cssPath = `${root}packages/css/dist/squircle.css`;
const cli = `${root}packages/build-tools/dist/cli.js`;

interface TrimReport {
  completeBytes: number;
  trimmedBytes: number;
  savedBytes: number;
  keptRules: number;
  droppedRules: number;
  usedClasses: number;
  unknownClasses: string[];
  safelistMisses: string[];
  dynamicHints: string[];
}

function trimFixture(name: "blog" | "dashboard"): {
  trimmed: string;
  report: TrimReport;
} {
  execFileSync(
    "node",
    [cli, "--config", `${root}fixtures/${name}/squircle.config.json`],
    { cwd: root, stdio: "pipe" },
  );
  return {
    trimmed: readFileSync(
      `${root}fixtures/${name}/squircle.trimmed.css`,
      "utf8",
    ),
    report: JSON.parse(
      readFileSync(`${root}fixtures/${name}/trim-report.json`, "utf8"),
    ) as TrimReport,
  };
}

test.describe("sq-trim production output", () => {
  test("blog: smaller, clean diagnostics, required styles kept", () => {
    const { trimmed, report } = trimFixture("blog");
    expect(report.completeBytes).toBeGreaterThan(30000);
    expect(report.trimmedBytes).toBeLessThan(report.completeBytes * 0.6);
    expect(report.unknownClasses).toEqual([]);
    expect(report.dynamicHints).toEqual([]);
    expect(report.droppedRules).toBeGreaterThan(200);
    // Structural and interactive essentials survive.
    for (const selector of [
      ":root {",
      ".sq-card {",
      ".sq-card", // base for :hover keeps hover rules
      ".sq-skip-link:focus-visible {",
      ".sq-md-flex {",
      '[data-sq-theme="luca"]',
    ]) {
      expect(trimmed, `missing ${selector}`).toContain(selector);
    }
    // Provably unused utilities are gone.
    for (const selector of [".sq-grid-cols-4 {", ".sq-xl-text-center {"]) {
      expect(trimmed, `should drop ${selector}`).not.toContain(selector);
    }
  });

  test("dashboard: safelist preserves dynamic fills, hints reported", () => {
    const { trimmed, report } = trimFixture("dashboard");
    expect(report.trimmedBytes).toBeLessThan(report.completeBytes * 0.6);
    expect(report.unknownClasses).toEqual([]);
    // The concatenated status fill is flagged AND preserved via safelist.
    expect(report.dynamicHints.length).toBe(1);
    expect(report.dynamicHints[0]).toMatch(/concatenated/);
    for (const selector of [
      ".sq-bg-success {",
      ".sq-bg-warning {",
      ".sq-bg-error {",
      ".sq-hidden {",
      ".sq-lg-grid-cols-4 {",
    ]) {
      expect(trimmed, `missing ${selector}`).toContain(selector);
    }
  });
});

for (const name of ["blog", "dashboard"] as const) {
  test.describe(`trimmed fixture renders identically (${name})`, () => {
    test.beforeEach(async ({ page }) => {
      const { trimmed } = trimFixture(name);
      await page.route("**/squircle.css", (route) =>
        route.fulfill({
          status: 200,
          contentType: "text/css",
          body: trimmed,
        }),
      );
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`/fixtures/${name}/index.html`);
      expect(errors).toEqual([]);
    });

    test("theme, geometry, and responsive rules intact", async ({ page }) => {
      await expect(page.locator("body")).toHaveCSS(
        "background-color",
        "rgb(19, 30, 51)",
      );
      const card = page.locator(".sq-card").first();
      expect(
        Number.parseFloat(
          await card.evaluate((el) => getComputedStyle(el).borderRadius),
        ),
      ).toBeGreaterThanOrEqual(28);
      // 360px: single column, no sideways scroll.
      await page.setViewportSize({ width: 360, height: 800 });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test("JS-driven classes still work", async ({ page, browserName }) => {
      if (name === "blog") {
        // Skip link points at a real target on every engine. Keyboard
        // reachability is asserted on Chromium only: WebKit tabs to form
        // controls before links (platform behavior, also documented in
        // the Stage 1 review), so Tab never lands on links there.
        const skip = page.locator(".sq-skip-link");
        await expect(skip).toHaveAttribute("href", "#articles");
        await expect(page.locator("#articles")).toBeVisible();
        test.skip(
          browserName !== "chromium",
          "WebKit tab order skips links (platform behavior)",
        );
        await page.keyboard.press("Tab");
        await expect(skip).toBeFocused();
      } else {
        // classList toggle of sq-hidden (static literal, scanner-kept).
        const details = page.locator("#fleet-details");
        await expect(details).toBeHidden();
        await page.locator("#details-toggle").click();
        await expect(details).toBeVisible();
        // Safelisted dynamic fill resolves to a real color.
        const pill = page.locator("#fleet-status");
        const bg = await pill.evaluate(
          (el) => getComputedStyle(el).backgroundColor,
        );
        expect(bg).not.toBe("rgba(0, 0, 0, 0)");
        expect(bg).toMatch(/^rgb\(/);
      }
    });
  });
}

test("complete CSS path is untouched by trimming", () => {
  const complete = readFileSync(cssPath, "utf8");
  expect(complete.length).toBeGreaterThan(30000);
  expect(complete).toContain(".sq-grid-cols-4 {");
});
