/**
 * Stage 1 foundation specs — served over local HTTP (primary transport).
 *
 * Verifies the browser-ready build end to end: theme values resolve,
 * geometry applies, controls meet target sizes, the page never scrolls
 * sideways, keyboard focus is always visible, and the runtime switches
 * themes. Screenshots at three widths feed the visual-density review.
 */

import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { squirclePrefersReducedMotion, squircleSetTheme } from "./helpers.js";

const PAGE = "/examples/foundation.html";
const shotsDir = fileURLToPath(
  new URL("../../../.screenshots/", import.meta.url),
);

test.beforeEach(async ({ page }) => {
  await page.goto(PAGE);
});

test("Luca theme resolves: navy page, paper text", async ({ page }) => {
  const body = page.locator("body");
  await expect(body).toHaveCSS(
    "background-color",
    "rgb(19, 30, 51)", // --sq-color-background (#131e33)
  );
  await expect(body).toHaveCSS(
    "color",
    "rgb(244, 241, 232)", // --sq-color-text-primary (#f4f1e8)
  );
  await expect(page.locator("html")).toHaveAttribute("data-sq-theme", "luca");
});

test("typography uses the Luca typefaces with fallbacks", async ({ page }) => {
  await expect(page.locator("h1").first()).toHaveCSS("font-family", /Manrope/);
  await expect(page.locator("body")).toHaveCSS("font-family", /DM Sans/);
  await expect(page.locator("h1").first()).toHaveCSS("font-weight", "800");
});

test("squircle geometry applies with size-appropriate radii", async ({
  page,
}) => {
  // Panel (lg) > nested panel (md): the nested-surface rule, resolved.
  const panel = page.locator("#surfaces");
  const nested = page.locator("#surfaces .sq-panel");
  const outer = await panel.evaluate((el) => getComputedStyle(el).borderRadius);
  const inner = await nested.evaluate(
    (el) => getComputedStyle(el).borderRadius,
  );
  expect(Number.parseFloat(outer)).toBeGreaterThan(Number.parseFloat(inner));
  expect(Number.parseFloat(outer)).toBeGreaterThanOrEqual(28); // 1.75rem+
  await expect(page.locator(".sq-button").first()).toHaveCSS(
    "min-height",
    "48px",
  );
});

test("no horizontal overflow at mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("keyboard focus is always visible", async ({ page }) => {
  // Headless WebKit only routes keyboard focus to the active page.
  await page.bringToFront();
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return "none";
    const style = getComputedStyle(el);
    return `${style.outlineWidth} ${style.outlineStyle} ${style.outlineColor}`;
  });
  expect(outline).not.toContain("0px");
});

test("runtime switches and persists themes", async ({ page }) => {
  await squircleSetTheme(page, "ocean");
  await expect(page.locator("html")).toHaveAttribute("data-sq-theme", "ocean");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-sq-theme", "ocean");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(19, 30, 51)", // unknown theme: falls back to :root Luca values
  );
  await squircleSetTheme(page, "luca");
});

test("reduced-motion helper reflects the OS setting", async ({ page }) => {
  // Test runners report no-preference.
  await expect(await squirclePrefersReducedMotion(page)).toBe(false);
});

test("density-review screenshots", async ({ page }) => {
  for (const [name, width] of [
    ["mobile", 360],
    ["tablet", 768],
    ["desktop", 1440],
  ] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(PAGE);
    await page.screenshot({
      path: `${shotsDir}foundation-${name}.png`,
      fullPage: true,
    });
  }
});

test("interactive-state screenshots (focus ring, hover)", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  // Keyboard focus: one Tab reaches a primary control on every engine
  // (Chromium tabs links first, WebKit form controls first — both are
  // genuine platform behavior). Capture the visible focus ring.
  // bringToFront first: headless WebKit routes keys to the active page.
  await page.bringToFront();
  await page.keyboard.press("Tab");
  const focused = page.locator(".sq-button--primary:focus");
  await expect(focused).toHaveCount(1);
  await focused.first().scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `${shotsDir}foundation-state-focus.png`,
  });
  // Pointer hover on the secondary button.
  await page.hover("a.sq-button--secondary");
  await page.screenshot({
    path: `${shotsDir}foundation-state-hover.png`,
  });
});
