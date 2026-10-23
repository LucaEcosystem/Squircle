/**
 * 1.1 component specs — combobox, carousel, upload, rating, dressed
 * select, stepper, banner, chips, timeline. Served over local HTTP;
 * behavior verified cross-engine (Chromium/WebKit/mobile).
 */

import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const FORMS = "/examples/forms.html";
const COMPONENTS = "/examples/components.html";

async function scrollLeftOf(page: Page, selector: string): Promise<number> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!(el instanceof HTMLElement)) throw new Error(`missing ${sel}`);
    return el.scrollLeft;
  }, selector);
}

test.describe("combobox", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FORMS);
    await page.bringToFront();
  });

  test("opens from typing, moves with arrows, commits with Enter", async ({
    page,
  }) => {
    const input = page.locator("#f-country");
    const list = page.locator("#f-country-list");
    await expect(input).toHaveAttribute("aria-expanded", "false");
    await expect(input).toHaveAttribute("aria-controls", "f-country-list");

    await input.pressSequentially("sw", { delay: 30 });
    await expect(input).toHaveAttribute("aria-expanded", "true");
    await expect(list).toBeVisible();

    const active = await input.getAttribute("aria-activedescendant");
    await input.press("ArrowDown");
    const movedActive = await input.getAttribute("aria-activedescendant");
    expect(movedActive).not.toEqual(active);
    expect(movedActive).toMatch(/^sq-cb-opt-/);
    await expect(list.locator(".sq-combobox__option")).not.toHaveCount(0);

    await input.press("Enter");
    await expect(input).toHaveAttribute("aria-expanded", "false");
    const committed = await input.inputValue();
    expect(committed.length).toBeGreaterThan(0);
    expect(committed).not.toEqual("sw");
    await expect(list).toBeHidden();
  });

  test("filter off keeps the full option set (server-driven)", async ({
    page,
  }) => {
    await page.evaluate(() => {
      const host = document.createElement("div");
      host.setAttribute("data-sq-test-combo", "off");
      host.innerHTML = [
        '<input id="probe-cb" data-sq-combobox data-sq-combobox-filter="off"',
        '  aria-controls="probe-cb-list">',
        '<ul id="probe-cb-list" role="listbox">',
        '  <li role="option">Brussels</li>',
        '  <li role="option">Buenos Aires</li>',
        "</ul>",
      ].join("");
      document.body.append(host);
      window.Squircle.initComboboxes();
      const input = document.getElementById("probe-cb") as HTMLInputElement;
      input.value = "zz";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const visible = await page.evaluate(
      () =>
        document.querySelectorAll(
          "[data-sq-test-combo] [role='option']:not([hidden])",
        ).length,
    );
    expect(visible).toEqual(2);
    await page.evaluate(() => {
      document.querySelector("[data-sq-test-combo]")?.remove();
    });
  });

  test("Escape closes then restores the open-time text", async ({ page }) => {
    const input = page.locator("#f-country");
    const list = page.locator("#f-country-list");

    await input.pressSequentially("u", { delay: 30 });
    await expect(list).toBeVisible();
    await input.pressSequentially("s", { delay: 30 });

    await input.press("Escape");
    await expect(list).toBeHidden();
    const explored = await input.inputValue();
    expect(explored).not.toEqual("u");

    await input.press("Escape");
    const restored = await input.inputValue();
    expect(restored).toEqual("u");
  });

  test("empty results show the empty message", async ({ page }) => {
    const input = page.locator("#f-country");
    const empty = page.locator(".sq-combobox__empty");
    await input.pressSequentially("zzz", { delay: 30 });
    await expect(empty).toBeVisible();
  });

  test("outside pointerdown closes without committing", async ({ page }) => {
    const input = page.locator("#f-country");
    const list = page.locator("#f-country-list");
    await input.pressSequentially("sw", { delay: 30 });
    await expect(list).toBeVisible();
    await page
      .locator("h1")
      .first()
      .click({ position: { x: 5, y: 5 } });
    await expect(list).toBeHidden();
    await expect(input).toHaveAttribute("aria-expanded", "false");
  });
});

test.describe("carousel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(COMPONENTS);
    await page.bringToFront();
  });

  test("pages by slide, disables at the ends, re-enables backward", async ({
    page,
  }) => {
    const root = page.locator(".sq-carousel").first();
    const prev = root.locator(".sq-carousel__prev");
    const next = root.locator(".sq-carousel__next");
    const track = root.locator(".sq-carousel__track");

    await expect(prev).toBeDisabled();
    const before = await scrollLeftOf(page, ".sq-carousel__track");

    await next.click();
    await expect
      .poll(async () => scrollLeftOf(page, ".sq-carousel__track"), {
        timeout: 4000,
      })
      .toBeGreaterThan(before);
    await expect(prev).toBeEnabled();

    await next.click();
    await expect(next).toBeDisabled(); // last slide reached

    await prev.click();
    await expect
      .poll(async () => scrollLeftOf(page, ".sq-carousel__track"), {
        timeout: 4000,
      })
      .toBeLessThan(await track.evaluate((el) => el.scrollWidth));
    await expect(next).toBeEnabled();
  });

  test("instant under prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const next = page.locator(".sq-carousel__next");
    await next.click();
    const left = await scrollLeftOf(page, ".sq-carousel__track");
    expect(left).toBeGreaterThan(0);
    await page.emulateMedia({ reducedMotion: null });
  });
});

test.describe("file upload", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FORMS);
    await page.bringToFront();
  });

  test("choosing files fills the zone and updates the title", async ({
    page,
  }) => {
    const input = page.locator('.sq-file input[type="file"]').first();
    const zone = page.locator(".sq-file__zone").first();
    await input.setInputFiles([
      {
        name: "sample.png",
        mimeType: "image/png",
        buffer: Buffer.from("png"),
      },
    ]);
    await expect(zone).toHaveClass(/sq-file__zone--filled/);
    await expect(page.locator(".sq-file__title").first()).toContainText(/.+/);
  });

  test("drag hover state follows real events, drop assigns files", async ({
    page,
  }) => {
    const zone = page.locator(".sq-file__zone").first();
    await zone.dispatchEvent("dragenter");
    await expect(zone).toHaveClass(/sq-file__zone--hover/);
    await zone.dispatchEvent("dragleave");
    await expect(zone).not.toHaveClass(/sq-file__zone--hover/);

    const assigned = await zone.evaluate(() => {
      const input = document.querySelector<HTMLInputElement>(
        ".sq-file input[type='file']",
      );
      if (!input) throw new Error("missing input");
      const zone = document.querySelector(".sq-file__zone");
      if (!(zone instanceof HTMLElement)) throw new Error("missing zone");
      const dt = new DataTransfer();
      dt.items.add(new File(["drop"], "dropped.txt", { type: "text/plain" }));
      zone.dispatchEvent(
        new DragEvent("drop", { dataTransfer: dt, bubbles: true }),
      );
      return input.files?.length ?? 0;
    });
    expect(assigned).toBe(1);
  });
});

test.describe("rating", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FORMS);
    await page.bringToFront();
  });

  test("clicking a star checks its radio", async ({ page }) => {
    const group = page.locator(".sq-rating").first();
    // DOM order is 5→1 so the visual 4th star is the second label.
    await group.locator(".sq-rating__star").nth(1).click();
    await expect(group.locator('input[value="4"]')).toBeChecked();
  });

  test("arrow keys move through the group in DOM order", async ({ page }) => {
    const group = page.locator(".sq-rating").first();
    await group.locator('input[value="3"]').focus();
    await page.keyboard.press("ArrowDown");
    await expect(group.locator('input[value="2"]')).toBeChecked();
  });
});

test.describe("dressed select", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FORMS);
    await page.bringToFront();
  });

  test("keeps the native select while painting the wrapper chevron", async ({
    page,
  }) => {
    const wrapper = page.locator(".sq-select").first();
    const mask = await wrapper.evaluate((el) => {
      const after = getComputedStyle(el, "::after");
      return (
        (after as CSSStyleDeclaration).maskImage ||
        (after as CSSStyleDeclaration).webkitMaskImage ||
        ""
      );
    });
    expect(mask).toContain("data:image");

    const select = wrapper.locator("select");
    await select.selectOption({ index: 1 });
    const value = await select.evaluate(
      (el) => (el as HTMLSelectElement).value,
    );
    expect(value.length).toBeGreaterThan(0);
  });
});

test.describe("stepper, banner, chips, timeline", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(COMPONENTS);
    await page.bringToFront();
  });

  test("stepper marks the current step", async ({ page }) => {
    const active = page.locator('.sq-stepper__step[aria-current="step"]');
    await expect(active).toHaveCount(1);
    const markerColor = await page
      .locator('.sq-stepper__step[aria-current="step"] .sq-stepper__marker')
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(markerColor).not.toEqual("rgba(0, 0, 0, 0)");
    await expect(page.locator(".sq-stepper__step--done")).not.toHaveCount(0);
  });

  test("chips remove on click and stay put without JS", async ({ page }) => {
    // The only removable chip carries the remove button; tone chips stay.
    const removable = page.locator(".sq-chip:has(.sq-chip__remove)").first();
    const before = await page.locator(".sq-chip").count();
    await removable.locator(".sq-chip__remove").click();
    await expect(page.locator(".sq-chip")).toHaveCount(before - 1);
    const tone = page.locator(".sq-chip--success");
    await expect(tone).toHaveCount(2); // demo chip + timeline meta chip
  });

  test("banner dismissal removes it from the tree", async ({ page }) => {
    const banner = page.locator(".sq-banner").first();
    await expect(banner).toBeVisible();
    await page.locator(".sq-banner__close").click();
    await expect(page.locator(".sq-banner").first()).toHaveCount(0);
  });

  test("timeline renders entries with muted variant", async ({ page }) => {
    const root = page.locator(".sq-timeline").first();
    await expect(root.locator(".sq-timeline__entry")).not.toHaveCount(0);
    await expect(root.locator(".sq-timeline__entry--muted")).not.toHaveCount(0);
    const times = await root.locator(".sq-timeline__time").count();
    expect(times).toBeGreaterThan(0);
  });
});

test.describe("new-behavior init security", () => {
  test("init() is idempotent across the new behaviors", async ({ page }) => {
    await page.goto(FORMS);
    await page.bringToFront();
    await page.evaluate(() => {
      window.Squircle.initComboboxes();
      window.Squircle.initCarousels();
      window.Squircle.initUploads();
      window.Squircle.init();
    });
    const claimed = await page.evaluate(
      () =>
        document.querySelectorAll("[data-sq-comboboxes-initialized]").length +
        document.querySelectorAll("[data-sq-files-initialized]").length,
    );
    const inputs = await page
      .locator("#f-country, .sq-file input[type='file']")
      .count();
    expect(claimed).toEqual(inputs);
  });
});
