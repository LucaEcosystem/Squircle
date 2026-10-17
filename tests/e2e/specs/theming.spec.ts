/**
 * Stage 2 theming specs — classic bundle AND ES module.
 *
 * Both builds expose the same switching contract: set → attribute +
 * persistence + subscriber notification; reset → Luca default. Luca
 * stays the default throughout; no light-mode toggle exists anywhere.
 */

import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import {
  squircleGetTheme,
  squircleResetTheme,
  squircleSetTheme,
} from "./helpers.js";

const shotsDir = fileURLToPath(
  new URL("../../../.screenshots/", import.meta.url),
);

const OCEAN_BG = "rgb(6, 34, 46)"; // --sq-color-background (#06222e)
const LUCA_BG = "rgb(19, 30, 51)"; // --sq-color-background (#131e33)

for (const [name, page_path] of [
  ["classic", "/examples/theming.html"],
  ["module", "/examples/theming-module.html"],
] as const) {
  test.describe(`theme switching (${name})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(page_path);
    });

    test("Luca is the default", async ({ page }) => {
      expect(await squircleGetTheme(page)).toBe("luca");
      await expect(page.locator("body")).toHaveCSS("background-color", LUCA_BG);
    });

    test("switching re-skins surfaces and utilities", async ({ page }) => {
      await page.getByRole("button", { name: "Ocean (custom)" }).click();
      expect(await squircleGetTheme(page)).toBe("ocean");
      await expect(page.locator("body")).toHaveCSS(
        "background-color",
        OCEAN_BG,
      );
      // A utility (not a component) follows the theme automatically.
      await expect(page.locator(".sq-bg-selected").first()).toHaveCSS(
        "background-color",
        "rgb(14, 61, 85)",
      );
      // Subscribers are notified (the status line is driven by
      // onThemeChange, not by the click handler).
      await expect(page.locator("#theme-status")).toHaveText(
        "Active theme: ocean",
      );
    });

    test("choice persists across reload, reset returns to Luca", async ({
      page,
    }) => {
      await squircleSetTheme(page, "ocean");
      await page.reload();
      expect(await squircleGetTheme(page)).toBe("ocean");
      await expect(page.locator("body")).toHaveCSS(
        "background-color",
        OCEAN_BG,
      );
      await squircleResetTheme(page);
      expect(await squircleGetTheme(page)).toBe("luca");
      await expect(page.locator("body")).toHaveCSS("background-color", LUCA_BG);
    });

    test("unknown themes degrade to Luca instead of breaking", async ({
      page,
    }) => {
      await squircleSetTheme(page, "atlantis");
      await expect(page.locator("body")).toHaveCSS("background-color", LUCA_BG);
      await squircleResetTheme(page);
    });

    // Custom-theme consistency capture for the density review. Classic
    // only: both builds share the same CSS, so one capture suffices.
    test("ocean theme review capture", async ({ page }) => {
      test.skip(name !== "classic", "one capture covers both builds");
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.getByRole("button", { name: "Ocean (custom)" }).click();
      await expect(page.locator("body")).toHaveCSS(
        "background-color",
        OCEAN_BG,
      );
      await page.screenshot({
        path: `${shotsDir}theming-ocean.png`,
        fullPage: true,
      });
      await squircleResetTheme(page);
    });
  });
}
