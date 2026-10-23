/**
 * Docs-site specs — the generated component reference site
 * (`docs-site/dist/`). Static output; verified for load, sidebar
 * navigation, table rendering, and axe cleanliness on a sample page.
 */

import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const SITE = "/docs-site/dist";

test("index lists all component docs", async ({ page }) => {
  await page.goto(`${SITE}/index.html`);
  const cards = page.locator(".sq-card a");
  await expect(cards).toHaveCount(14); // 13 docs + the pinned contract card
  await expect(page.locator("h1")).toHaveText("Squircle component docs");
});

test("forms page renders tables and code blocks", async ({ page }) => {
  await page.goto(`${SITE}/forms.html`);
  await expect(page.locator(".sq-table").first()).toBeVisible();
  await expect(
    page.locator("pre").filter({ hasText: "data-sq-combobox" }),
  ).toHaveCount(1);
  const heading = page.locator("h1");
  await expect(heading).toContainText("Forms");
  await page.locator("#combobox").scrollIntoViewIfNeeded();
  await expect(page.locator("#combobox")).toBeInViewport();
});

test("sidebar navigates between doc pages", async ({ page }) => {
  await page.goto(`${SITE}/contract.html`);
  await page.locator('.sq-sidebar a[href="data.html"]').click();
  await expect(page).toHaveURL(/data\.html$/);
  await expect(page.locator("h1")).toContainText("Data");
});

for (const pageName of ["index", "forms", "contract"]) {
  test(`axe clean on docs site ${pageName}`, async ({ page }) => {
    await page.goto(`${SITE}/${pageName}.html`);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(
      results.violations.map((v) => `${v.id}: ${v.help}`),
      `axe violations on docs site ${pageName}`,
    ).toEqual([]);
  });
}
