/**
 * Stage 4 form specs — served over local HTTP.
 *
 * Native semantics first: labels, constraint validation, describedby
 * associations, and keyboard behavior are the platform's; Squircle adds
 * surfaces and message wiring. Verified in the browser, both themes.
 */

import { fileURLToPath } from "node:url";
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import {
  squircleResetTheme,
  squircleSetFieldError,
  squircleSetTheme,
} from "./helpers.js";

const PAGE = "/examples/forms.html";
const shotsDir = fileURLToPath(
  new URL("../../../.screenshots/", import.meta.url),
);

test.beforeEach(async ({ page }) => {
  await page.goto(PAGE);
});

test("labels, help, and controls are associated", async ({ page }) => {
  const name = page.locator("#f-name");
  await expect(name).toHaveAttribute("id", "f-name");
  // Clicking the label focuses the control (native association).
  await page.getByText("Project notes", { exact: true }).click();
  await expect(page.locator("#f-bio")).toBeFocused();
  // Help text is referenced, not just adjacent.
  await expect(page.locator("#f-email")).toHaveAttribute(
    "aria-describedby",
    /f-email-help/,
  );
});

test("native validation blocks empty required submit and focuses the problem", async ({
  page,
}) => {
  await page.locator("#signup-submit").click();
  // Still on the page (submission blocked), focus moved to first invalid.
  await expect(page).toHaveURL(/forms\.html/);
  await expect(page.locator("#f-email")).toBeFocused();
  // The pre-rendered message is revealed with its fix-it text.
  const error = page.locator("#f-email-error");
  await expect(error).toBeVisible();
  await expect(error).toContainText("ada@example.com");
  // The field carries the invalid border (class toggled by the invalid
  // listener — never color alone: the message above carries the meaning).
  await expect(page.locator("#f-email")).toHaveCSS(
    "border-color",
    "rgb(255, 107, 107)",
  );
});

test("valid input clears the error path", async ({ page }) => {
  // Reveal the message first, then fix the value: the input listener
  // hides the message once the field validates (no manual hiding).
  await page.locator("#signup-submit").click();
  await expect(page.locator("#f-email-error")).toBeVisible();
  await page.locator("#f-email").fill("ada@example.com");
  await expect(page.locator("#f-email-error")).toBeHidden();
});

test("server-side errors wire identically to native ones", async ({ page }) => {
  await page.locator("#server-error-demo").click();
  const email = page.locator("#f-email");
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(email).toHaveAttribute("aria-describedby", /f-email-error/);
  await expect(email).toHaveCSS("border-color", "rgb(255, 107, 107)");
  await expect(page.locator("#f-email-error")).toContainText("signing in");
  await expect(email).toBeFocused();
  await page.locator("#server-error-clear").click();
  await expect(email).not.toHaveAttribute("aria-invalid", "true");
});

test("setFieldError helper creates missing message elements", async ({
  page,
}) => {
  await squircleSetFieldError(
    page,
    "#f-name",
    "Names need at least 2 characters.",
  );
  const name = page.locator("#f-name");
  await expect(name).toHaveAttribute("aria-invalid", "true");
  const described = await name.getAttribute("aria-describedby");
  expect(described).toMatch(/f-name-error/);
  const message = page.locator("#f-name-error");
  await expect(message).toHaveText("Names need at least 2 characters.");
  await expect(message).toHaveClass(/sq-field__error/);
});

test("checks, radios, switch, and range are keyboard-operable", async ({
  page,
}) => {
  // Radio group arrow navigation (native).
  const harbor = page.locator('input[name="plan"][value="harbor"]');
  const fleet = page.locator('input[name="plan"][value="fleet"]');
  await harbor.focus();
  await page.keyboard.press("ArrowDown");
  await expect(fleet).toBeChecked();
  // Switch toggles with Space and keeps its accessible name.
  const notify = page.locator("#f-notify");
  await expect(notify).toHaveRole("switch");
  await notify.focus();
  const was = await notify.isChecked();
  await page.keyboard.press("Space");
  await expect(notify.isChecked()).resolves.toBe(!was);
  // Range arrows move the value; the live readout follows.
  const seats = page.locator("#f-seats");
  await seats.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#f-seats-value")).toHaveText("13");
  // Disabled check is exposed as disabled.
  await expect(
    page.locator('input[name="channel"][value="none"]'),
  ).toBeDisabled();
});

test("switch track shows the focus ring", async ({ page }) => {
  await page.bringToFront();
  await page.locator("#f-notify").focus();
  const ring = await page.evaluate(() => {
    const track = document.querySelector(".sq-switch__track");
    if (!track) return "missing";
    const style = getComputedStyle(track);
    return `${style.outlineWidth}/${style.outlineColor}`;
  });
  expect(ring).toBe("3px/rgb(0, 187, 255)");
});

test("long option labels do not break the select", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  const select = page.locator("#f-role");
  await expect(select).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("axe finds no violations on the forms page", async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    results.violations.map((v) => `${v.id}: ${v.help}`),
    "axe violations on the forms showcase",
  ).toEqual([]);
});

test("forms hold their density in Ocean", async ({ page }) => {
  await squircleSetTheme(page, "ocean");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(6, 34, 46)",
  );
  await page.locator("#server-error-demo").click();
  await expect(page.locator("#f-email")).toHaveCSS(
    "border-color",
    "rgb(255, 107, 107)",
  );
  await expect(page.locator("#f-email-error")).toBeVisible();
  await page.setViewportSize({ width: 360, height: 800 });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("density-review screenshots: errors shown, four widths, both themes", async ({
  page,
}) => {
  // Submit empty so every validation message is visible in captures.
  await page.locator("#signup-submit").click();
  await expect(page.locator("#f-email-error")).toBeVisible();
  for (const [name, width] of [
    ["mobile", 360],
    ["tablet", 768],
    ["laptop", 1024],
    ["desktop", 1440],
  ] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(400);
    await page.screenshot({
      path: `${shotsDir}forms-${name}.png`,
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await squircleSetTheme(page, "ocean");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(6, 34, 46)",
  );
  await page.screenshot({
    path: `${shotsDir}forms-ocean.png`,
    fullPage: true,
  });
  await squircleResetTheme(page);
});
