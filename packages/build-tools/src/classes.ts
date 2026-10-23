/**
 * The one `sq-*` class-token shape, shared by the source scanner
 * (`scan.ts`) and the CSS trimmer (`trim.ts`). Both regexes are built
 * from a single character range so there is nothing to drift apart:
 * wherever the scanner finds a class, the trimmer finds the same class
 * in the emitted selector, and vice versa.
 *
 * Class names are case-sensitive in CSS — `sq-Button` is a legitimate
 * class the trimmer must see, so the range is `[A-Za-z0-9-]`, not the
 * lowercase-only range an early trimmer draft used.
 */

/** Character range of a Squircle class name after `sq-` and a hyphen. */
export const SQ_CLASS_CHARS = "A-Za-z0-9-";

/** A class token in scanned source text (`sq-panel`), not inside a word. */
export const SQ_CLASS_TOKEN = new RegExp(
  `(?<![a-z]-)sq-[${SQ_CLASS_CHARS}]+`,
  "g",
);

/** A class reference inside a selector (`.sq-panel`). */
export const SQ_CLASS_IN_SELECTOR = new RegExp(
  `\\.sq-[${SQ_CLASS_CHARS}]+`,
  "g",
);
