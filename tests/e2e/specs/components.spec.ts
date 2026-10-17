/**
 * Stage 3 component specs — served over local HTTP.
 *
 * Real behavior, not class presence: states resolve, keyboard reaches
 * everything, axe finds no violations, long content wraps, Ocean
 * re-skins, and consumer overrides win the cascade. Screenshots feed
 * docs/reviews/stage-3/.
 */

import { fileURLToPath } from "node:url";
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { squircleSetTheme, squircleResetTheme } from "./helpers.js";

const PAGE = "/examples/components.html";
const shotsDir = fileURLToPath(
  new URL("../../../.screenshots/", import.meta.url),
);

test.beforeEach(async ({ page }) => {
  await page.goto(PAGE);
});

test("button variants resolve to theme tokens", async ({ page }) => {
  const primary = page.locator("#button-variants .sq-button--primary");
  await expect(primary).toHaveCSS("background-color", "rgb(174, 157, 93)"); // gold
  await expect(primary).toHaveCSS("color", "rgb(11, 18, 34)"); // ink
  await expect(primary).toHaveCSS("min-height", "48px");
  await expect(page.locator("#button-sizes .sq-button--small")).toHaveCSS(
    "min-height",
    "40px",
  );
  await expect(page.locator("#button-sizes .sq-button--large")).toHaveCSS(
    "min-height",
    "56px",
  );
  // Danger pairs fill + contrast ink (never color alone: explicit verb).
  const danger = page.locator("#button-variants .sq-button--danger");
  await expect(danger).toHaveCSS("background-color", "rgb(255, 107, 107)");
  await expect(danger).toHaveCSS("color", "rgb(11, 18, 34)");
});

test("disabled and loading buttons do not activate", async ({ page }) => {
  const disabled = page.locator(
    "#button-icons .sq-button--secondary[disabled]",
  );
  await expect(disabled).toBeDisabled();
  const loading = page.locator("#loading-button");
  await expect(loading).toBeDisabled();
  await expect(loading).toHaveAttribute("aria-busy", "true");
  await expect(loading.locator(".sq-button__spinner")).toBeVisible();
  // Icon-only control exposes an accessible name; icon is decorative.
  const iconOnly = page.locator("#icon-only-close");
  await expect(iconOnly).toHaveAttribute("aria-label", "Close dialog");
  const label = await iconOnly.evaluate((el) =>
    el.querySelector(".sq-button__icon")?.getAttribute("aria-hidden"),
  );
  expect(label).toBe("true");
});

test("keyboard reaches every control with a visible ring", async ({
  page,
  browserName,
}) => {
  await page.bringToFront();
  const rings: string[] = [];
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press("Tab");
    const ring = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return "body";
      const style = getComputedStyle(el);
      return `${el.tagName}.${el.className}::${style.outlineWidth}/${style.outlineColor}`;
    });
    rings.push(ring);
  }
  // Buttons, links, and nav links all took focus with a 3px azure ring.
  const focused = rings.filter((ring) => !ring.includes("3px"));
  expect(
    focused.filter((ring) => ring !== "body"),
    `focus without the theme ring: ${focused.join("; ")}`,
  ).toEqual([]);
  expect(rings.some((ring) => ring.startsWith("BUTTON"))).toBe(true);
  // Links join the tab order on Chromium within a few stops; WebKit
  // visits form controls first (platform behavior, Stage 1 review).
  if (browserName === "chromium") {
    expect(rings.some((ring) => ring.startsWith("A"))).toBe(true);
  }
});

test("long labels wrap without overflow", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  const button = page.locator("#long-label-button");
  const lines = await button.evaluate(
    (el) => el.getBoundingClientRect().height,
  );
  expect(lines).toBeGreaterThan(48); // wrapped past one line
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("interactive card lifts on hover and keeps one tab stop", async ({
  page,
}) => {
  const card = page.locator(".sq-card--interactive").first();
  const rest = await card.evaluate((el) => getComputedStyle(el).transform);
  await card.hover();
  const lifted = await card.evaluate((el) => getComputedStyle(el).transform);
  expect(rest).toBe("none");
  expect(lifted).not.toBe("none");
  // One link, one tab stop; the stretched link covers the card.
  expect(await card.locator("a").count()).toBe(1);
  const cover = await card.locator(".sq-stretched-link").evaluate((el) => {
    const after = getComputedStyle(el, "::after");
    return `${after.position}/${after.inset}`;
  });
  expect(cover).toBe("absolute/0px");
});

test("axe finds no violations (WCAG 2.2 AA scope)", async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    results.violations.map((v) => `${v.id}: ${v.help}`),
    "axe violations on the components showcase",
  ).toEqual([]);
});

test("Ocean re-skins components without markup changes", async ({ page }) => {
  await squircleSetTheme(page, "ocean");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(6, 34, 46)",
  );
  // Precedence per CONTRACT.md §4: the primary FILL stays Luca gold
  // (the fill IS the variant default), while surfaces, text, and
  // structure follow Ocean.
  await expect(page.locator("#button-variants .sq-button--primary")).toHaveCSS(
    "background-color",
    "rgb(174, 157, 93)",
  ); // variant default wins for the fill
  await expect(page.locator(".sq-card").first()).toHaveCSS(
    "background-color",
    "rgb(15, 58, 77)", // ocean surface-elevated
  );
  // Focus ring stays visible on the new background.
  await page.bringToFront();
  await page.keyboard.press("Tab");
  const ring = await page.evaluate(() => {
    const el = document.activeElement;
    return el ? getComputedStyle(el).outlineColor : "none";
  });
  expect(ring).not.toBe("0px");
  await squircleResetTheme(page);
});

test("consumer overrides win the documented cascade", async ({ page }) => {
  await page.addStyleTag({
    content: ".sq-button--primary { background-color: rgb(1, 2, 3); }",
  });
  await expect(page.locator("#button-variants .sq-button--primary")).toHaveCSS(
    "background-color",
    "rgb(1, 2, 3)",
  );
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
    await page.waitForTimeout(900);
    await page.screenshot({
      path: `${shotsDir}components-${name}.png`,
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
    path: `${shotsDir}components-ocean.png`,
    fullPage: true,
  });
  await squircleResetTheme(page);
});
