/**
 * Stage 2 utility specs — served over local HTTP.
 *
 * Representative combinations from every documented category, responsive
 * behavior at four widths, and container-query reflow. Screenshots feed
 * the Stage 2 density review (see docs/reviews/stage-2/).
 */

import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const PAGE = "/examples/utilities.html";
const shotsDir = fileURLToPath(
  new URL("../../../.screenshots/", import.meta.url),
);

test.beforeEach(async ({ page }) => {
  await page.goto(PAGE);
});

test("representative utility combinations render", async ({ page }) => {
  // Type + color utilities resolve through tokens.
  await expect(page.locator("#responsive-grid > div").first()).toHaveCSS(
    "background-color",
    "rgb(27, 58, 92)", // --sq-color-selected-background
  );
  // Radius + shadow utilities apply.
  const tile = page.locator("#lift-card");
  expect(
    Number.parseFloat(
      await tile.evaluate((el) => getComputedStyle(el).borderRadius),
    ),
  ).toBeGreaterThanOrEqual(28);
  await expect(tile).not.toHaveCSS("box-shadow", "none");
  // Truncation holds one line with an ellipsis.
  await expect(page.locator(".sq-truncate").first()).toHaveCSS(
    "text-overflow",
    "ellipsis",
  );
  // Motion utilities attach animations (instant under reduced-motion is
  // covered by the CSS gate; runners report no-preference here).
  await expect(page.locator(".sq-fade-in").first()).not.toHaveCSS(
    "animation-name",
    "none",
  );
});

test("responsive display swaps at the md breakpoint", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await expect(page.locator("#only-narrow")).toBeVisible();
  await expect(page.locator("#only-wide")).toBeHidden();
  await page.setViewportSize({ width: 768, height: 800 });
  await expect(page.locator("#only-narrow")).toBeHidden();
  await expect(page.locator("#only-wide")).toBeVisible();
});

test("direction and columns reflow across four widths", async ({ page }) => {
  const rowDirection = (): Promise<string> =>
    page
      .locator("#responsive-row")
      .evaluate((el) => getComputedStyle(el).flexDirection);
  const gridColumns = (): Promise<number> =>
    page
      .locator("#responsive-grid")
      .evaluate(
        (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
      );

  await page.setViewportSize({ width: 360, height: 800 });
  await expect(await rowDirection()).toBe("column");
  await expect(await gridColumns()).toBe(2);

  await page.setViewportSize({ width: 768, height: 800 });
  await expect(await rowDirection()).toBe("row");
  await expect(await gridColumns()).toBe(2);

  await page.setViewportSize({ width: 1024, height: 800 });
  await expect(await rowDirection()).toBe("row");
  await expect(await gridColumns()).toBe(4);

  await page.setViewportSize({ width: 1440, height: 800 });
  await expect(await rowDirection()).toBe("row");
  await expect(await gridColumns()).toBe(4);
});

test("container query follows the container, not the viewport", async ({
  page,
}) => {
  await page.goto("/examples/theming.html");
  const split = page.locator(".sq-cq-split");
  await page.setViewportSize({ width: 360, height: 800 });
  await expect(split).toHaveCSS("flex-direction", "column");
  await page.setViewportSize({ width: 1024, height: 800 });
  await expect(split).toHaveCSS("flex-direction", "row");
});

test("no horizontal overflow at any review width", async ({ page }) => {
  for (const width of [360, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(
      0,
    );
  }
});

test("density-review screenshots at four widths", async ({ page }) => {
  for (const [name, width] of [
    ["mobile", 360],
    ["tablet", 768],
    ["laptop", 1024],
    ["desktop", 1440],
  ] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(PAGE);
    // Let entrance animations settle so captures show resting states.
    await page.waitForTimeout(900);
    await page.screenshot({
      path: `${shotsDir}utilities-${name}.png`,
      fullPage: true,
    });
  }
});
