/**
 * Stage 5 specs — navigation, feedback, data, media, disclosure, icons,
 * templates. Served over local HTTP; behavior verified in-browser on
 * Chromium/WebKit/mobile, captures on Chromium only.
 */

import { fileURLToPath } from "node:url";
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { squircleResetTheme, squircleSetTheme } from "./helpers.js";

const T = "/examples/templates";
const shotsDir = fileURLToPath(
  new URL("../../../.screenshots/", import.meta.url),
);
const onlyChromium = (
  browserName: string,
  testInfo: { skip: (c: boolean, r: string) => void },
): void => {
  testInfo.skip(
    browserName !== "chromium",
    "review captures run once (behavior is covered cross-engine)",
  );
};

test.describe("landing template", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${T}/landing.html`);
    await page.bringToFront();
  });

  test("mobile nav collapses and expands natively", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const menu = page.locator(".sq-nav-menu");
    // Open by default (so links stay in the accessibility tree at every
    // width — closed <details> hides content from AT even when CSS shows
    // it); the toggle collapses and re-expands without JavaScript.
    await expect(menu).toHaveAttribute("open", "");
    await page.locator(".sq-nav-menu > summary").click();
    await expect(menu).not.toHaveAttribute("open", "");
    const primaryDocs = page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("link", { name: "Docs" });
    await expect(primaryDocs).toBeHidden();
    await page.locator(".sq-nav-menu > summary").click();
    await expect(menu).toHaveAttribute("open", "");
    await expect(primaryDocs).toBeVisible();
    // Native <details> ignores Escape (nothing traps, nothing overlays —
    // documented in NAVIGATION.md); state is unchanged.
    await page.keyboard.press("Escape");
    await expect(menu).toHaveAttribute("open", "");
  });

  test("menu toggle hides at wide viewports, links stay visible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await expect(page.locator(".sq-nav-menu > summary")).toBeHidden();
    await expect(
      page.getByRole("link", { name: "Dashboard" }).first(),
    ).toBeVisible();
  });

  test("nav links recover after widening past the collapse point", async ({
    page,
  }) => {
    // Collapse the details nav while narrow, then widen: the summary
    // disappears without reopening anything, so the recovery rule must
    // show the links anyway (otherwise they strand forever — CSS-only).
    await page.setViewportSize({ width: 360, height: 800 });
    const menu = page.locator(".sq-nav-menu");
    await expect(menu).toHaveAttribute("open", "");
    await menu.locator("> summary").click();
    const docs = page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("link", { name: "Docs" });
    await expect(docs).toBeHidden();
    await page.setViewportSize({ width: 1024, height: 800 });
    await expect(menu.locator("> summary")).toBeHidden();
    await expect(docs).toBeVisible();
  });

  test("no overflow at any review width", async ({ page }) => {
    for (const width of [360, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 800 });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, `overflow at ${width}px`).toBeLessThanOrEqual(0);
    }
  });
});

test.describe("article template (content + disclosure + table)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${T}/article.html`);
    await page.bringToFront();
  });

  test("breadcrumbs name the trail, current page is text", async ({ page }) => {
    const trail = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(trail.getByRole("link")).toHaveCount(2);
    await expect(trail.getByText("The 64-pixel rule")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("disclosures toggle with keyboard, no JavaScript", async ({ page }) => {
    const second = page.locator(".sq-disclosure").nth(1);
    await expect(second).not.toHaveAttribute("open", "");
    await second.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(second).toHaveAttribute("open", "");
    await expect(second.locator(".sq-disclosure__content")).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(second).not.toHaveAttribute("open", "");
  });

  test("table scroll region is labeled and focusable", async ({ page }) => {
    const region = page.locator(".sq-table-scroll");
    await expect(region).toHaveAttribute("tabindex", "0");
    const caption = await page.locator(".sq-table caption").textContent();
    expect(caption).toMatch(/crowding/);
    await page.setViewportSize({ width: 360, height: 800 });
    const scrollable = await region.evaluate(
      (el) => el.scrollWidth > el.clientWidth,
    );
    expect(scrollable).toBe(true);
  });

  test("figure reserves space (no layout shift)", async ({ page }) => {
    const img = page.locator(".sq-figure img");
    await expect(img).toHaveAttribute("width", "1600");
    await expect(img).toHaveAttribute("height", "900");
    const box = await img.boundingBox();
    expect(box).not.toBeNull();
    if (box)
      expect(Math.abs(box.width / box.height - 16 / 9)).toBeLessThan(0.05);
  });

  test("pagination marks the current page", async ({ page }) => {
    const pager = page.getByRole("navigation", { name: "More essays" });
    await expect(pager.locator('[aria-current="page"]')).toHaveText("2");
    await expect(pager.getByRole("link", { name: /Newer/ })).toHaveAttribute(
      "rel",
      "prev",
    );
  });
});

test.describe("dashboard template (sidebar + data + alert + menu)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${T}/dashboard.html`);
    await page.bringToFront();
  });

  test("sidebar stacks narrow, sticks wide", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const sidebar = page.locator(".sq-sidebar");
    const content = page.locator("#dashboard-main");
    const stacked = await sidebar.evaluate(
      (el, main) =>
        el.getBoundingClientRect().bottom <=
        (main as HTMLElement).getBoundingClientRect().top + 1,
      await content.elementHandle(),
    );
    expect(stacked).toBe(true);
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(sidebar).toHaveCSS("position", "sticky");
  });

  test("alert announces politely with icon + title + text", async ({
    page,
  }) => {
    const alert = page.locator(".sq-alert--warning");
    await expect(alert).toHaveAttribute("role", "status");
    await expect(alert.locator(".sq-alert__title")).toContainText("Fog window");
    const iconBox = await alert.locator(".sq-alert__icon svg").boundingBox();
    expect(iconBox?.width).toBeGreaterThan(0);
  });

  test("export menu opens and activates", async ({ page }) => {
    await page.locator("#dash-export-trigger").click();
    const menu = page.locator("#dash-export");
    await expect(menu).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await expect(menu.locator(".sq-menu__item").nth(1)).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
  });

  test("metrics, badges, avatar, progress render with values", async ({
    page,
  }) => {
    await expect(page.locator(".sq-metric__value").first()).toContainText(
      "128",
    );
    await expect(page.locator(".sq-badge--success").first()).toContainText(
      "On schedule",
    );
    await expect(page.locator(".sq-avatar")).toContainText("AL");
    const progress = page.locator(".sq-progress");
    await expect(progress).toHaveAttribute("value", "62");
    const ths = page.locator(".sq-table thead th");
    expect(await ths.count()).toBe(5);
    const first = await page
      .locator(".sq-table thead th")
      .first()
      .getAttribute("scope");
    expect(first).toBe("col");
  });
});

test.describe("settings template (tabs + toast + danger dialog)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${T}/settings.html`);
    await page.bringToFront();
  });

  test("save confirms with a polite toast, dismiss removes it", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Save general" }).click();
    const toast = page.locator(".sq-toast");
    await expect(toast).toBeVisible();
    await expect(toast.locator(".sq-toast__text")).toContainText(
      "Settings saved.",
    );
    await expect(page.locator("[data-sq-toasts]")).toHaveAttribute(
      "role",
      "status",
    );
    await toast.getByRole("button", { name: "Dismiss notification" }).click();
    await expect(toast).toHaveCount(0);
  });

  test("danger tab holds alert + guarded dialog", async ({ page }) => {
    const tabs = page.locator('[aria-label="Settings sections"] [role="tab"]');
    await tabs.nth(2).click();
    await expect(tabs.nth(2)).toHaveAttribute("aria-selected", "true");
    await expect(page.locator(".sq-alert--error")).toHaveAttribute(
      "role",
      "alert",
    );
    await page.locator("#open-decom").click();
    await expect(page.locator("#decom-dialog")).toHaveAttribute("open", "");
    await page.locator("#confirm-decom").click();
    await expect(page.locator("#decom-dialog")).not.toHaveAttribute("open", "");
    await expect(page.locator(".sq-toast__text")).toContainText(
      "Decommission cancelled",
    );
  });
});

test.describe("docs template (nav-heavy)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${T}/docs.html`);
    await page.bringToFront();
  });

  test("sidebar names sections, current page marked", async ({ page }) => {
    const sidebar = page.getByRole("navigation", { name: "Docs sections" });
    await expect(
      sidebar.getByRole("link", { name: "Spacing" }),
    ).toHaveAttribute("aria-current", "page");
  });

  test("tooltip supplements the search button", async ({ page }) => {
    const search = page.getByRole("button", { name: "Search" });
    await search.focus();
    await expect(page.locator("#sq-tooltip")).toContainText("demo here");
    await page.keyboard.press("Escape");
  });

  test("prev/next paging carries rel", async ({ page }) => {
    const pager = page.getByRole("navigation", { name: "Docs pages" });
    await expect(
      pager.getByRole("link", { name: /Introduction/ }),
    ).toHaveAttribute("rel", "prev");
    await expect(pager.getByRole("link", { name: /Color/ })).toHaveAttribute(
      "rel",
      "next",
    );
  });
});

test.describe("icons", () => {
  test("glyphs render at sizes in both themes", async ({ page }) => {
    await page.goto(`${T}/dashboard.html`);
    const icon = page.locator(".sq-alert__icon svg");
    const box = await icon.boundingBox();
    expect(box?.width).toBeGreaterThan(0);
    // 1.5em icon at 16px base ≈ 24px.
    expect(box?.width).toBeGreaterThan(20);
    await squircleSetTheme(page, "ocean");
    const boxOcean = await icon.boundingBox();
    expect(boxOcean?.width).toBeGreaterThan(20);
    await squircleResetTheme(page);
  });
});

test.describe("stage 5 axe + density", () => {
  for (const name of ["landing", "article", "dashboard", "settings", "docs"]) {
    test(`axe clean on ${name}`, async ({ page }) => {
      await page.goto(`${T}/${name}.html`);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(
        results.violations.map((v) => `${v.id}: ${v.help}`),
        `axe violations on template ${name}`,
      ).toEqual([]);
    });
  }

  test("template captures at four widths + ocean", async ({
    page,
    browserName,
  }, testInfo) => {
    onlyChromium(browserName, testInfo);
    for (const name of [
      "landing",
      "article",
      "dashboard",
      "settings",
      "docs",
    ]) {
      for (const [size, width] of [
        ["mobile", 360],
        ["tablet", 768],
        ["laptop", 1024],
        ["desktop", 1440],
      ] as const) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`${T}/${name}.html`);
        await page.waitForTimeout(400);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow, `${name} overflow at ${width}px`).toBeLessThanOrEqual(
          0,
        );
        await page.screenshot({
          path: `${shotsDir}template-${name}-${size}.png`,
          fullPage: true,
        });
      }
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`${T}/${name}.html`);
      await squircleSetTheme(page, "ocean");
      await expect(page.locator("body")).toHaveCSS(
        "background-color",
        "rgb(6, 34, 46)",
      );
      await page.screenshot({
        path: `${shotsDir}template-${name}-ocean.png`,
        fullPage: true,
      });
      await squircleResetTheme(page);
    }
  });
});
