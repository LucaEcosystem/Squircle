/**
 * Typed access to the Squircle browser runtime inside specs.
 * Mirrors the real `window.Squircle` shape from the IIFE build —
 * no `any`, no non-null assertions.
 */

import type { Page } from "@playwright/test";

export interface SquircleBrowserApi {
  setTheme(name: string): void;
  getTheme(): string;
  resetTheme(): void;
  prefersReducedMotion(): boolean;
  openDialog(dialog: HTMLDialogElement, options?: { modal?: boolean }): void;
  closeDialog(dialog: HTMLDialogElement, restoreFocus?: boolean): void;
  isDialogOpen(dialog: HTMLDialogElement): boolean;
  setFieldError(input: Element, message: string): void;
  clearFieldError(input: Element): void;
  notify(message: string, options?: { tone?: string; duration?: number }): void;
  dismissAll(): void;
}

declare global {
  interface Window {
    Squircle: SquircleBrowserApi;
  }
}

export async function squircleGetTheme(page: Page): Promise<string> {
  return page.evaluate(() => window.Squircle.getTheme());
}

export async function squircleSetTheme(
  page: Page,
  name: string,
): Promise<void> {
  await page.evaluate((theme) => window.Squircle.setTheme(theme), name);
}

export async function squircleResetTheme(page: Page): Promise<void> {
  await page.evaluate(() => window.Squircle.resetTheme());
}

export async function squirclePrefersReducedMotion(
  page: Page,
): Promise<boolean> {
  return page.evaluate(() => window.Squircle.prefersReducedMotion());
}

export async function squircleOpenDialog(
  page: Page,
  selector: string,
  modal = true,
): Promise<void> {
  await page.locator(selector).evaluate((el, isModal) => {
    window.Squircle.openDialog(el as HTMLDialogElement, { modal: isModal });
  }, modal);
}

export async function squircleCloseDialog(
  page: Page,
  selector: string,
): Promise<void> {
  await page.locator(selector).evaluate((el) => {
    window.Squircle.closeDialog(el as HTMLDialogElement);
  });
}

export async function squircleSetFieldError(
  page: Page,
  selector: string,
  message: string,
): Promise<void> {
  await page
    .locator(selector)
    .evaluate((el, msg) => window.Squircle.setFieldError(el, msg), message);
}
