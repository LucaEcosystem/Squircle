/**
 * ESM parity: the module build drives the same behaviors as classic.
 * The full interaction matrix runs against classic (interactive.spec.ts);
 * this spec proves the ESM bundle initializes and behaves identically
 * for a dialog and a tab set.
 */

import { expect, test } from "@playwright/test";

const PAGE = "/examples/interactive-module.html";

test.beforeEach(async ({ page }) => {
  await page.goto(PAGE);
  await page.bringToFront();
});

test("module dialog opens, escapes, and restores", async ({ page }) => {
  await page.locator("#open-module-dialog").click();
  const dialog = page.locator("#module-dialog");
  await expect(dialog).toHaveAttribute("open", "");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toHaveAttribute("open", "");
  await expect(page.locator("#open-module-dialog")).toBeFocused();
});

test("module tabs select with arrows", async ({ page }) => {
  const tabs = page.locator('#module-tabs [role="tab"]');
  await tabs.first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#module-panel-b")).toBeVisible();
  await expect(page.locator("#module-panel-a")).toBeHidden();
});
