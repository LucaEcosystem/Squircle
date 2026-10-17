/**
 * Direct-file (`file://`) support probe — Chromium only.
 *
 * Squircle's classic assets (plain CSS `<link>`, classic IIFE `<script>`)
 * are designed to work from `file://` with zero server. ES modules and
 * `fetch()` are NOT used by the Stage 1 browser assets, so nothing in the
 * critical path trips file-protocol restrictions. This spec pins that:
 * if a future change breaks `file://`, it fails here first.
 *
 * Skipped outside Chromium: file-protocol behavior is engine-specific and
 * only Chromium's is asserted. WebKit/Firefox coverage runs over HTTP.
 */

import { fileURLToPath, pathToFileURL } from "node:url";
import { expect, test } from "@playwright/test";
import { squircleGetTheme } from "./helpers.js";

test.skip(
  ({ browserName }) => browserName !== "chromium",
  "file:// support is asserted on Chromium only",
);

test("foundation page renders from file:// with CSS and runtime", async ({
  page,
}) => {
  const file = pathToFileURL(
    fileURLToPath(
      new URL("../../../examples/foundation.html", import.meta.url),
    ),
  ).href;
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(file);
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(19, 30, 51)",
  );
  expect(await squircleGetTheme(page)).toBe("luca");
  expect(errors).toEqual([]);
});
