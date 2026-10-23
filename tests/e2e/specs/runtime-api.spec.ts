/**
 * Direct-API coverage for behaviors without dedicated example-page
 * specs: dialog open/close queries and restoration flags, theme and
 * reduced-motion subscriptions, focusableChildren, imperative
 * createMenu/createTabs (including the singleton rule), popover
 * placement geometry and scroll-follow, transient tooltip descriptions,
 * toast tones/dismissal/pausing/localization, arrow orientation on
 * tabs, and form-scoped field-error ids.
 */

import { expect, test } from "@playwright/test";

declare global {
  interface Window {
    __sq?: { seen: boolean[]; stop: () => void };
    __sqTheme?: {
      events: { previous: string; current: string }[];
      stop: () => void;
    };
  }
}

const INTERACTIVE = "/examples/interactive.html";
const FORMS = "/examples/forms.html";

/** Instant-scrolls (base CSS animates scrolling) so hover does not
 * trigger Playwright scrollIntoView — trailing smooth-scroll frames
 * fire the runtime's scroll-capture hide on tooltips. */
async function settleAndHover(
  page: import("@playwright/test").Page,
  selector: string,
): Promise<void> {
  await page
    .locator(selector)
    .evaluate((el) =>
      el.scrollIntoView({ block: "center", behavior: "instant" }),
    );
  await page.waitForTimeout(80);
  await page.locator(selector).hover();
}

test.beforeEach(async ({ page }) => {
  await page.goto(INTERACTIVE);
  await page.bringToFront();
});

test("isDialogOpen tracks open state", async ({ page }) => {
  const dialog = page.locator("#notice-dialog");
  const states = await dialog.evaluate((el) => {
    const native = el as HTMLDialogElement;
    window.Squircle.openDialog(native);
    const open = window.Squircle.isDialogOpen(native);
    window.Squircle.closeDialog(native);
    const closed = window.Squircle.isDialogOpen(native);
    return { open, closed };
  });
  expect(states.open).toBe(true);
  expect(states.closed).toBe(false);
});

test("closeDialog(restore:false) suppresses invoker restoration", async ({
  page,
}) => {
  const opener = page.locator('[data-sq-dialog-open="notice-dialog"]');
  await opener.click();
  const notice = page.locator("#notice-dialog");
  await expect(notice).toBeVisible();
  await notice.evaluate(
    (el) => void window.Squircle.closeDialog(el as HTMLDialogElement, false),
  );
  await expect(notice).toBeHidden();
  const openerFocused = await page.evaluate(() => {
    const active = document.activeElement;
    return (
      active instanceof HTMLElement &&
      active.getAttribute("data-sq-dialog-open") === "notice-dialog"
    );
  });
  expect(openerFocused).toBe(false);
});

test("closeDialog restores focus without scrolling the page", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 640 });
  const opener = page.locator('[data-sq-dialog-open="notice-dialog"]');
  // Scroll explicitly (base CSS animates scrolling): the subsequent
  // close must not shift a settled position or re-focus with scroll.
  await opener.evaluate((el) => {
    window.scrollTo({ top: 300, behavior: "instant" });
    el.focus();
  });
  const scrollBefore = await page.evaluate(() => window.scrollY);
  expect(scrollBefore).toBe(300);
  await opener.evaluate((el) => {
    const dialog = document.getElementById(
      el.getAttribute("data-sq-dialog-open") ?? "",
    );
    if (dialog instanceof HTMLDialogElement) {
      window.Squircle.openDialog(dialog, { invoker: el });
    }
  });
  const dialog = page.locator("#notice-dialog");
  const open = await dialog.evaluate((el) =>
    window.Squircle.isDialogOpen(el as HTMLDialogElement),
  );
  expect(open).toBe(true);
  await dialog.evaluate(
    (el) => void window.Squircle.closeDialog(el as HTMLDialogElement),
  );
  const restored = await page.evaluate(() => {
    const active = document.activeElement;
    return {
      scrolled: window.scrollY,
      onOpener:
        active instanceof HTMLElement &&
        active.getAttribute("data-sq-dialog-open") === "notice-dialog",
    };
  });
  expect(restored.scrolled).toBeCloseTo(scrollBefore, 0);
  expect(restored.onOpener).toBe(true);
});

test("onThemeChange reports previous and unsubscribes", async ({ page }) => {
  // MutationObserver callbacks run as microtasks, so the subscription
  // and assertions must be split across evaluates.
  await page.evaluate(() => {
    window.__sqTheme = {
      events: [],
      stop: window.Squircle.onThemeChange((event) => {
        window.__sqTheme?.events.push({ ...event });
      }),
    };
  });
  await page.evaluate(() => window.Squircle.setTheme("ocean"));
  await expect
    .poll(() => page.evaluate(() => window.__sqTheme?.events.length ?? 0))
    .toBe(1);
  expect(await page.evaluate(() => window.__sqTheme?.events[0])).toEqual({
    previous: "luca",
    current: "ocean",
  });
  await page.evaluate(() => window.__sqTheme?.stop());
  await page.evaluate(() => window.Squircle.resetTheme());
  await page.waitForTimeout(100); // observer flush
  const after = await page.evaluate(() => ({
    theme: window.Squircle.getTheme(),
    seen: window.__sqTheme?.events.length ?? 0,
  }));
  expect(after.theme).toBe("luca");
  expect(after.seen).toBe(1);
});

test("onReducedMotionChange reacts to emulated media and unsubscribes", async ({
  page,
}) => {
  await page.evaluate(() => {
    window.__sq = {
      seen: [],
      stop: window.Squircle.onReducedMotionChange((reduced) => {
        window.__sq?.seen.push(reduced);
      }),
    };
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() => page.evaluate(() => window.__sq?.seen[0] ?? null))
    .toBe(true);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect
    .poll(() => page.evaluate(() => window.__sq?.seen.length ?? 0))
    .toBe(2);
  await page.evaluate(() => window.__sq?.stop());
  await page.emulateMedia({ reducedMotion: "reduce" });
  const countAfterStop = await page.evaluate(
    () => window.__sq?.seen.length ?? 0,
  );
  expect(countAfterStop).toBe(2);
});

test("focusableChildren returns tab-order elements", async ({ page }) => {
  const result = await page.evaluate(() => {
    const host = document.createElement("div");
    host.innerHTML = `
      <a href="#first">first</a>
      <button disabled>disabled</button>
      <button tabindex="2">second</button>
      <a href="#skip" hidden>hidden</a>
      <button>third</button>
    `;
    document.body.append(host);
    const tags = window.Squircle.focusableChildren(host).map(
      (el) => `${el.tagName}:${el.textContent?.trim()}`,
    );
    host.remove();
    return tags;
  });
  expect(result).toEqual(["A:first", "BUTTON:second", "BUTTON:third"]);
});

test("createMenu is singleton per trigger; ArrowUp opens the last item", async ({
  page,
}) => {
  const singleton = await page.evaluate(() => {
    const container = document.createElement("div");
    container.innerHTML = `
      <button type="button" id="api-menu-trigger" aria-controls="api-menu">Export</button>
      <ul id="api-menu" role="menu" hidden>
        <li><button type="button" role="menuitem" class="sq-menu__item">First</button></li>
        <li><button type="button" role="menuitem" class="sq-menu__item">Mid</button></li>
        <li><button type="button" role="menuitem" class="sq-menu__item">Last</button></li>
      </ul>
    `;
    document.body.append(container);
    const trigger = container.querySelector<HTMLElement>("#api-menu-trigger");
    const menu = container.querySelector<HTMLElement>("#api-menu");
    if (!trigger || !menu) throw new Error("fixture missing");
    return (
      window.Squircle.createMenu(trigger, menu) ===
      window.Squircle.createMenu(trigger, menu)
    );
  });
  expect(singleton).toBe(true);

  // Click opens with the first item focused.
  await page.click("#api-menu-trigger");
  expect(
    await page.evaluate(() => document.activeElement?.textContent?.trim()),
  ).toBe("First");
  await page.keyboard.press("Escape");
  // APG: ArrowUp opens the menu with the LAST item focused.
  await page.focus("#api-menu-trigger");
  await page.keyboard.press("ArrowUp");
  expect(
    await page.evaluate(() => document.activeElement?.textContent?.trim()),
  ).toBe("Last");
});

test("createTabs is singleton; destroy removes listeners", async ({ page }) => {
  const singleton = await page.evaluate(() => {
    const container = document.createElement("div");
    container.innerHTML = `
      <div role="tablist" id="api-tablist">
        <button type="button" role="tab" id="api-tab-1" aria-controls="api-panel-1">One</button>
        <button type="button" role="tab" id="api-tab-2" aria-controls="api-panel-2">Two</button>
        <div id="api-panel-1" role="tabpanel">Panel one</div>
        <div id="api-panel-2" role="tabpanel" hidden>Panel two</div>
      </div>
    `;
    document.body.append(container);
    const tablist = container.querySelector<HTMLElement>("#api-tablist");
    if (!tablist) throw new Error("fixture missing");
    const handle = window.Squircle.createTabs(tablist);
    const same =
      handle === window.Squircle.createTabs(tablist) &&
      handle.selectedIndex === 0;
    handle.select(1);
    handle.destroy();
    return same;
  });
  expect(singleton).toBe(true);
  // select(1) ran before destroy(): panel two stays visible.
  await expect(page.locator("#api-panel-2")).toBeVisible();
  // After destroy() the click must NOT switch selection back to one.
  await page.click("#api-tab-1");
  const afterDestroy = await page.evaluate(() => ({
    panelTwoVisible: !(document.getElementById("api-panel-2")?.hidden ?? true),
    tabOneSelected: document
      .getElementById("api-tab-1")
      ?.getAttribute("aria-selected"),
  }));
  expect(afterDestroy.panelTwoVisible).toBe(true);
  expect(afterDestroy.tabOneSelected).toBe("false");
});

test("notify error tone asserts; dismissAll clears toasts and timers", async ({
  page,
}) => {
  const built = await page.evaluate(() => {
    window.Squircle.notify("Saved just now", { duration: 100000 });
    window.Squircle.notify("Upload failed", { tone: "error", duration: 120 });
    const region = document.querySelector("[data-sq-toasts]");
    if (!(region instanceof HTMLElement)) throw new Error("no region");
    const toasts = [...region.querySelectorAll(".sq-toast")];
    const summary = {
      count: toasts.length,
      texts: toasts.map((t) => t.querySelector(".sq-toast__text")?.textContent),
      roles: toasts.map((t) => t.getAttribute("role")),
      dismissLabels: toasts.map(
        (t) => t.querySelector("button")?.getAttribute("aria-label") ?? null,
      ),
    };
    window.Squircle.dismissAll();
    return summary;
  });
  expect(built.count).toBe(2);
  expect(built.texts).toEqual(["Saved just now", "Upload failed"]);
  expect(built.roles).toEqual([null, "alert"]);
  expect(built.dismissLabels.every((label) => label !== null)).toBe(true);
  expect(
    await page.evaluate(() => document.querySelectorAll(".sq-toast").length),
  ).toBe(0);
  // The pending 120ms timer must not resurrect a dismissed toast.
  await page.waitForTimeout(300);
  await expect
    .poll(() =>
      page.evaluate(() => document.querySelectorAll(".sq-toast").length),
    )
    .toBe(0);
});

test("toast auto-dismiss pauses while hovered or focused", async ({ page }) => {
  await page.evaluate(() => {
    window.Squircle.notify("Slow reader", { duration: 1200 });
  });
  const toast = page.locator(".sq-toast").first();
  await expect(toast).toBeVisible();
  await toast.hover();
  await page.waitForTimeout(1600);
  await expect(toast).toBeVisible(); // paused by hover
  await page.mouse.move(4, 4);
  await expect(toast).toBeHidden({ timeout: 2500 });

  await page.evaluate(() => {
    window.Squircle.notify("Focused reader", { duration: 1200 });
  });
  const focused = page.locator(".sq-toast").first();
  await expect(focused).toBeVisible();
  await focused.locator("button").evaluate((el) => el.focus());
  await page.waitForTimeout(1600);
  await expect(focused).toBeVisible(); // paused by focus
  await page.evaluate(() =>
    (document.activeElement as HTMLElement | null)?.blur(),
  );
  await expect(focused).toBeHidden({ timeout: 2500 });
});

test("localized dismiss labels via region attribute and option", async ({
  page,
}) => {
  const labels = await page.evaluate(() => {
    document.querySelector("[data-sq-toasts]")?.remove();
    const region = document.createElement("div");
    region.setAttribute("data-sq-toasts", "");
    region.setAttribute("role", "status");
    region.setAttribute("data-sq-toast-dismiss-label", "Schließen");
    document.body.append(region);
    window.Squircle.notify("Bereit", { duration: 0 });
    window.Squircle.notify("Bereit auch", {
      duration: 0,
      region,
      dismissLabel: "Verbergen",
    });
    return [...region.querySelectorAll(".sq-toast button")].map((button) =>
      button.getAttribute("aria-label"),
    );
  });
  expect(labels).toEqual(["Schließen", "Verbergen"]);
});

test("positionPopover resolves four-way placement geometry", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 640 });
  const placements = await page.evaluate(() => {
    const results: Record<string, { left: number; top: number }> = {};
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.style.cssText =
      "position:fixed; top:40px; left:40px; width:60px; height:32px;";
    document.body.append(trigger);
    const popover = document.createElement("div");
    popover.setAttribute("popover", "manual");
    popover.style.cssText =
      "width:120px; height:60px; padding:0; border:0; margin:0;";
    document.body.append(popover);
    popover.showPopover?.();
    for (const placement of ["bottom", "top", "left", "right"] as const) {
      window.Squircle.positionPopover(trigger, popover, { placement });
      const rect = popover.getBoundingClientRect();
      results[placement] = { left: rect.left, top: rect.top };
    }
    return {
      results,
      anchorBottom: trigger.getBoundingClientRect().bottom,
    };
  });
  // Anchor 60×32 at (40, 40); popover 120×60; viewport 1024×640.
  // bottom fits; top (28px tall) has no room and flips back down;
  // left has no room and flips to the right, vertically centered.
  expect(placements.results.bottom.top).toBeCloseTo(
    placements.anchorBottom + 8,
    0,
  );
  expect(placements.results.bottom.left).toBe(40);
  expect(placements.results.top.top).toBeCloseTo(
    placements.anchorBottom + 8,
    0,
  );
  expect(placements.results.left.left).toBe(108);
  expect(placements.results.left.top).toBeCloseTo(26, 0);
  expect(placements.results.right.left).toBe(108);
  expect(placements.results.right.top).toBeCloseTo(26, 0);
});

test("placement flips above at the bottom edge of the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 640 });
  const flipped = await page.evaluate(() => {
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.style.cssText = `position:fixed; top:${
      window.innerHeight - 50
    }px; left:40px; width:60px; height:32px;`;
    document.body.append(trigger);
    const popover = document.createElement("div");
    popover.setAttribute("popover", "manual");
    popover.style.cssText =
      "width:120px; height:60px; padding:0; border:0; margin:0;";
    document.body.append(popover);
    window.Squircle.positionPopover(trigger, popover, { placement: "bottom" });
    const rect = popover.getBoundingClientRect();
    const anchor = trigger.getBoundingClientRect();
    return {
      top: rect.top,
      anchorTop: anchor.top,
      below: rect.top >= anchor.bottom,
    };
  });
  expect(flipped.below).toBe(false);
  expect(flipped.top).toBeLessThan(flipped.anchorTop);
});

test("anchored popovers reposition on scroll while open", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 640 });
  const before = await page.evaluate(() => {
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.id = "anchor-follow";
    trigger.textContent = "Anchor";
    document.body.append(trigger);
    const popover = document.createElement("div");
    popover.setAttribute("popover", "auto");
    popover.id = "follow-pop";
    popover.style.cssText = "width:120px; min-height:40px;";
    popover.setAttribute("data-sq-popover-anchor", "anchor-follow");
    document.body.append(popover);
    window.Squircle.initPopovers();
    // Scroll explicitly with headroom (base CSS animates scrolling).
    const maxScroll =
      document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: Math.max(1, maxScroll - 200), behavior: "instant" });
    popover.showPopover();
    const rect = popover.getBoundingClientRect();
    return { top: rect.top, scrollY: window.scrollY };
  });
  expect(before.scrollY).toBeGreaterThan(0);
  await page.evaluate(() => window.scrollBy({ top: 120, behavior: "instant" }));
  await page.waitForTimeout(120); // scroll event → reposition
  const after = await page.evaluate(() => ({
    top:
      document.getElementById("follow-pop")?.getBoundingClientRect().top ?? 0,
    scrollY: window.scrollY,
  }));
  expect(after.scrollY - before.scrollY).toBeCloseTo(120, 0);
  // Repositioned beside the trigger: it tracks the scroll (position
  // flips are legitimate — assert the movement, not the direction).
  expect(Math.abs(after.top - before.top)).toBeGreaterThan(30);
  expect(after.top).toBeGreaterThanOrEqual(0);
  expect(after.top).toBeLessThanOrEqual(600);
  await page
    .locator("#follow-pop")
    .evaluate((el) => (el as HTMLElement).hidePopover());
});

test("tooltip wiring adds and removes describedby transiently", async ({
  page,
}) => {
  await settleAndHover(page, "[data-sq-tooltip]");
  const trigger = page.locator("[data-sq-tooltip]").first();
  const tip = page.locator("#sq-tooltip");
  await expect(tip).toBeVisible();
  await expect(tip).toHaveText("Exports include archived projects.");
  expect(
    await trigger.evaluate((el) =>
      (el.getAttribute("aria-describedby") ?? "").split(/\s+/),
    ),
  ).toContain("sq-tooltip");
  await page.mouse.move(4, 4);
  await expect(tip).toBeHidden();
  await expect(trigger).not.toHaveAttribute("aria-describedby");
});

test("tooltip preserves author descriptions across show/hide", async ({
  page,
}) => {
  await page.evaluate(() => {
    const button = document.createElement("button");
    button.type = "button";
    button.id = "author-tooltip";
    button.setAttribute("aria-describedby", "author-hint");
    button.setAttribute("data-sq-tooltip", "Extra detail here");
    button.textContent = "Hover me";
    document.body.append(button);
    window.Squircle.initTooltips();
  });
  const targeted = page.locator("#author-tooltip");
  await settleAndHover(page, "#author-tooltip");
  const tip = page.locator("#sq-tooltip");
  await expect(tip).toBeVisible();
  // hint first (from the author), then the tooltip id appended
  const condition = await targeted.evaluate((el) =>
    (el.getAttribute("aria-describedby") ?? "").split(/\s+/),
  );
  expect(condition).toEqual(["author-hint", "sq-tooltip"]);
  await page.mouse.move(4, 4);
  await expect(tip).toBeHidden();
  const describedAfter = await targeted.evaluate((el) =>
    (el.getAttribute("aria-describedby") ?? "").split(/\s+/),
  );
  expect(describedAfter).toEqual(["author-hint"]);
});

test("vertical tablists navigate with ArrowUp/ArrowDown only", async ({
  page,
}) => {
  await page.evaluate(() => {
    const seed = (vertical: boolean, id: string): void => {
      const container = document.createElement("div");
      container.id = id;
      container.innerHTML = `
        <div role="tablist" ${vertical ? 'aria-orientation="vertical"' : ""}>
          <button type="button" role="tab" aria-controls="${id}-p1">One</button>
          <button type="button" role="tab" aria-controls="${id}-p2">Two</button>
          <div id="${id}-p1" role="tabpanel">P1</div>
          <div id="${id}-p2" role="tabpanel" hidden>P2</div>
        </div>
      `;
      document.body.append(container);
      const tablist = container.querySelector<HTMLElement>("[role=tablist]");
      if (!tablist) throw new Error("fixture missing");
      window.Squircle.createTabs(tablist);
    };
    seed(true, "api-vert-tabs");
    seed(false, "api-horiz-tabs");
  });

  const selectedOf = (id: string): Promise<string | undefined> =>
    page.evaluate(
      (listId) =>
        document.querySelector(`#${listId} [role=tab][aria-selected="true"]`)
          ?.textContent ?? undefined,
      id,
    );

  // Vertical list: horizontal keys inert; vertical keys navigate.
  await page.locator("#api-vert-tabs [role=tab]").first().click();
  await page.keyboard.press("ArrowRight");
  expect(await selectedOf("api-vert-tabs")).toBe("One");
  await page.keyboard.press("ArrowDown");
  expect(await selectedOf("api-vert-tabs")).toBe("Two");
  await page.keyboard.press("ArrowUp");
  expect(await selectedOf("api-vert-tabs")).toBe("One");

  // Horizontal list: vertical keys inert; horizontal navigate (wrap on
  // ArrowLeft from the first tab to the last).
  await page.locator("#api-horiz-tabs [role=tab]").first().click();
  await page.keyboard.press("ArrowDown");
  expect(await selectedOf("api-horiz-tabs")).toBe("One");
  await page.keyboard.press("ArrowLeft");
  expect(await selectedOf("api-horiz-tabs")).toBe("Two");
});

test("fieldError message ids stay form-scoped", async ({ page }) => {
  await page.goto(FORMS);
  const ids = await page.evaluate(() => {
    const build = (formId: string | null): HTMLFormElement => {
      const form = document.createElement("form");
      form.innerHTML = '<input name="email" type="email">';
      if (formId) form.id = formId;
      document.body.append(form);
      return form;
    };
    const formA = build("scope-form-a");
    const formB = build(null); // no id → serial scope (sq-form-N)
    const firstA = formA.querySelector("input");
    const firstB = formB.querySelector("input");
    if (!(firstA instanceof HTMLElement) || !(firstB instanceof HTMLElement)) {
      throw new Error("no fields");
    }
    window.Squircle.setFieldError(firstA as HTMLInputElement, "Form A problem");
    window.Squircle.setFieldError(firstB as HTMLInputElement, "Form B problem");
    const describedA = (firstA.getAttribute("aria-describedby") ?? "").split(
      " ",
    );
    const describedB = (firstB.getAttribute("aria-describedby") ?? "").split(
      " ",
    );
    const errorIdA = describedA.find((token) => token.endsWith("-error"));
    const errorIdB = describedB.find((token) => token.endsWith("-error"));
    window.Squircle.clearFieldError(firstA as HTMLInputElement);
    const messageBAfterClearingA =
      errorIdB !== undefined
        ? (document.getElementById(errorIdB)?.textContent ?? "")
        : "";
    return { errorIdA, errorIdB, messageBAfterClearingA };
  });
  // The id'd form scopes by its id; the id-less form falls back to a
  // generated scope — never the bare field name.
  expect(ids.errorIdA).toBe("scope-form-a-email-error");
  expect(ids.errorIdB).toMatch(/^sq-form-\d+-email-error$/);
  // Clearing form A's error must never erase form B's message content.
  expect(ids.messageBAfterClearingA).toBe("Form B problem");
});

test("fieldError honors pre-declared author message elements", async ({
  page,
}) => {
  await page.goto(FORMS);
  const reused = await page.evaluate(() => {
    const field = document.createElement("div");
    field.innerHTML = `
      <p id="predeclared-error" class="sq-field__error"></p>
      <input id="predeclared-input"autocomplete="off">
    `;
    document.body.append(field);
    const input = field.querySelector("input");
    if (!(input instanceof HTMLElement)) throw new Error("no input");
    window.Squircle.setFieldError(
      input as HTMLInputElement,
      "Wired into the author's node",
    );
    window.Squircle.clearFieldError(input as HTMLInputElement);
    const message = document.getElementById("predeclared-error");
    return {
      messageEmpty: message?.textContent === "",
      describedClean: input.getAttribute("aria-describedby") === null,
    };
  });
  expect(reused.messageEmpty).toBe(true);
  expect(reused.describedClean).toBe(true);
});
