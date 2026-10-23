/**
 * Stage 4 interactive specs — dialog, menu, popover, tooltip, tabs.
 *
 * Every behavior is exercised, not asserted from markup: open/close,
 * Escape, focus placement and restoration, dismissal contracts,
 * keyboard maps, and associations. Classic bundle here; the ESM twin
 * page covers module parity separately.
 */

import { fileURLToPath } from "node:url";
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import {
  squircleCloseDialog,
  squircleOpenDialog,
  squircleResetTheme,
  squircleSetTheme,
} from "./helpers.js";

const PAGE = "/examples/interactive.html";
const shotsDir = fileURLToPath(
  new URL("../../../.screenshots/", import.meta.url),
);

test.beforeEach(async ({ page }) => {
  await page.goto(PAGE);
  await page.bringToFront();
});

test("modal dialog opens, focuses, escapes, and restores", async ({ page }) => {
  await page.locator("#open-delete").click();
  const dialog = page.locator("#delete-dialog");
  await expect(dialog).toHaveAttribute("open", "");
  // Focus lands inside the dialog (first focusable control).
  const focused = await page.evaluate(
    () => document.activeElement?.tagName ?? "none",
  );
  expect(["BUTTON", "INPUT", "SELECT", "TEXTAREA", "A"]).toContain(focused);
  // Escape closes natively and focus returns to the invoker.
  await page.keyboard.press("Escape");
  await expect(dialog).not.toHaveAttribute("open", "");
  await expect(page.locator("#open-delete")).toBeFocused();
});

test("backdrop policy: opt-in dismisses, guarded dialogs ignore", async ({
  page,
}) => {
  // Notice dialog opts in: backdrop click closes.
  await page.locator("#open-notice").click();
  const notice = page.locator("#notice-dialog");
  await expect(notice).toHaveAttribute("open", "");
  await notice.evaluate((el) => {
    el.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
  });
  await expect(notice).not.toHaveAttribute("open", "");
  // Delete dialog guards work: the same click does nothing.
  await squircleOpenDialog(page, "#delete-dialog");
  const guarded = page.locator("#delete-dialog");
  await expect(guarded).toHaveAttribute("open", "");
  await guarded.evaluate((el) => {
    el.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
  });
  await expect(guarded).toHaveAttribute("open", "");
  await squircleCloseDialog(page, "#delete-dialog");
});

test("declarative close buttons and API agree", async ({ page }) => {
  // Focus the invoker first, as a keyboard user would: restoration then
  // has a real target (opening with <body> focused restores to <body>).
  await page.locator("#open-delete").focus();
  await squircleOpenDialog(page, "#delete-dialog");
  await page.locator("#delete-dialog [data-sq-dialog-close]").first().click();
  await expect(page.locator("#delete-dialog")).not.toHaveAttribute("open", "");
  await expect(page.locator("#open-delete")).toBeFocused();
});

test("non-modal dialog leaves the page interactive", async ({ page }) => {
  await page.locator("#open-modeless").click();
  const dialog = page.locator("#activity-dialog");
  await expect(dialog).toHaveAttribute("open", "");
  // Page controls remain reachable while the dialog is open.
  await page.locator("#export-trigger").click();
  await expect(page.locator("#export-menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#export-menu")).toBeHidden();
  // Platform behavior: Escape closes MODAL dialogs natively, but a
  // modeless dialog stays open — it needs its explicit close control.
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveAttribute("open", "");
  await dialog.locator("[data-sq-dialog-close]").click();
  await expect(dialog).not.toHaveAttribute("open", "");
});

test("menu keyboard map and dismissal contract", async ({ page }) => {
  const trigger = page.locator("#export-trigger");
  const menu = page.locator("#export-menu");
  await expect(menu).toBeHidden();
  await trigger.click();
  await expect(menu).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  const items = menu.locator(".sq-menu__item:not([aria-disabled='true'])");
  // Focus starts on the first enabled item.
  await expect(items.first()).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(items.nth(1)).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(items.first()).toBeFocused();
  await page.keyboard.press("End");
  await expect(items.last()).toBeFocused();
  await page.keyboard.press("Home");
  await expect(items.first()).toBeFocused();
  // Escape closes and restores focus to the trigger.
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
  // Tab closes without stealing focus back.
  await trigger.click();
  await expect(menu).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(menu).toBeHidden();
  // Click-outside dismisses.
  await trigger.click();
  await expect(menu).toBeVisible();
  await page.locator("#menu-title").click();
  await expect(menu).toBeHidden();
  // Disabled item is skipped by arrows and exposed as disabled.
  const disabled = menu.locator('.sq-menu__item[aria-disabled="true"]');
  await expect(disabled).toHaveText(/Delete export/);
  await trigger.click();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  // Two enabled items: wrap-around skips the disabled third.
  await expect(items.first()).toBeFocused();
  await page.keyboard.press("Escape");
});

test("popover anchors, flips, and light-dismisses", async ({ page }) => {
  const trigger = page.locator("#quota-info");
  const popover = page.locator("#quota-pop");
  await trigger.click();
  await expect(popover).toBeVisible();
  // Anchored beside the trigger (not centered): near its bottom edge.
  const triggerBox = await trigger.boundingBox();
  const popBox = await popover.boundingBox();
  expect(triggerBox).not.toBeNull();
  expect(popBox).not.toBeNull();
  if (triggerBox === null || popBox === null) {
    throw new Error("popover geometry unavailable");
  }
  const gap = Math.abs(popBox.y - (triggerBox.y + triggerBox.height));
  expect(gap).toBeLessThan(64);
  // Inside the viewport horizontally.
  expect(popBox.x).toBeGreaterThanOrEqual(0);
  expect(popBox.x + popBox.width).toBeLessThanOrEqual(1440);
  // Escape light-dismisses natively.
  await page.keyboard.press("Escape");
  await expect(popover).toBeHidden();
});

test("tooltip shows on focus and hides on Escape", async ({ page }) => {
  const trigger = page.locator("[data-sq-tooltip]");
  // The runtime hides tooltips on any scroll (documented contract), so
  // every scroll must settle before focusing: center the trigger, wait
  // for it to be in view, then focus — focus itself must not scroll.
  await page.evaluate(() => {
    document
      .querySelector("[data-sq-tooltip]")
      ?.scrollIntoView({ block: "center", behavior: "instant" });
  });
  await expect(trigger).toBeInViewport({ timeout: 1000 });
  await trigger.focus();
  const tip = page.locator("#sq-tooltip");
  await expect(tip).toBeVisible();
  await expect(tip).toHaveText("Exports include archived projects.");
  await expect(tip).toHaveAttribute("role", "tooltip");
  await expect(trigger).toHaveAttribute("aria-describedby", /sq-tooltip/);
  await page.keyboard.press("Escape");
  await expect(tip).toBeHidden();
});

test("tabs: arrows select, panels associate, overflow scrolls", async ({
  page,
}) => {
  const tablist = page.locator('#project-tabs [role="tablist"]');
  const tabs = tablist.locator('[role="tab"]');
  await tabs.first().focus();
  await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowRight");
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
  await expect(tabs.nth(1)).toBeFocused();
  await expect(page.locator("#panel-activity")).toBeVisible();
  await expect(page.locator("#panel-overview")).toBeHidden();
  await page.keyboard.press("ArrowRight");
  await expect(tabs.nth(2)).toHaveAttribute("aria-selected", "true");
  // Wrap-around.
  await page.keyboard.press("ArrowRight");
  await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("End");
  await expect(tabs.nth(2)).toHaveAttribute("aria-selected", "true");
  // Roving tabindex: exactly one tab stop in the set.
  const stops = await tablist.evaluate(
    (el) =>
      [...el.querySelectorAll('[role="tab"]')].filter(
        (tab) => (tab as HTMLElement).tabIndex === 0,
      ).length,
  );
  expect(stops).toBe(1);
  // Long-label set scrolls instead of squeezing (narrow viewport).
  await page.setViewportSize({ width: 360, height: 800 });
  const scroller = page.locator("#long-tabs .sq-tablist");
  const scrollable = await scroller.evaluate(
    (el) => el.scrollWidth > el.clientWidth,
  );
  expect(scrollable).toBe(true);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("axe finds no violations on the interactive page", async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    results.violations.map((v) => `${v.id}: ${v.help}`),
    "axe violations on the interactive showcase",
  ).toEqual([]);
});

test("interactive behaviors hold in Ocean", async ({ page }) => {
  await squircleSetTheme(page, "ocean");
  await page.locator("#open-delete").click();
  await expect(page.locator("#delete-dialog")).toHaveAttribute("open", "");
  await page.keyboard.press("Escape");
  await page.locator("#export-trigger").click();
  await expect(page.locator("#export-menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await squircleResetTheme(page);
});

test("density-review screenshots at four widths, both themes", async ({
  page,
}) => {
  for (const [name, width] of [
    ["mobile", 360],
    ["tablet", 768],
    ["laptop", 1024],
    ["desktop", 1440],
  ] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(PAGE);
    await page.waitForTimeout(600);
    await page.screenshot({
      path: `${shotsDir}interactive-${name}.png`,
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(PAGE);
  await squircleSetTheme(page, "ocean");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(6, 34, 46)",
  );
  await page.screenshot({
    path: `${shotsDir}interactive-ocean.png`,
    fullPage: true,
  });
  await squircleResetTheme(page);
});
