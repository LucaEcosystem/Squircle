/**
 * Theme application and environment helpers (unchanged Stage 1–2 API).
 * Moved verbatim from the former single-file runtime; behavior intact.
 */

export type ThemeName = string;

const THEME_ATTRIBUTE = "data-sq-theme";
const DEFAULT_THEME = "luca";

/** Applies a theme by setting `data-sq-theme` on `<html>`. */
export function setTheme(name: ThemeName): void {
  document.documentElement.setAttribute(THEME_ATTRIBUTE, name);
  try {
    window.localStorage.setItem("sq-theme", name);
  } catch {
    // Private mode / blocked storage: theme still applies for the session.
  }
}

/** Returns the active theme name (attribute, stored preference, or default). */
export function getTheme(): ThemeName {
  return (
    document.documentElement.getAttribute(THEME_ATTRIBUTE) ??
    storedTheme() ??
    DEFAULT_THEME
  );
}

function storedTheme(): ThemeName | null {
  try {
    return window.localStorage.getItem("sq-theme");
  } catch {
    return null;
  }
}

/**
 * Restores the stored theme (if any) without a flash of the wrong theme.
 * Call synchronously in `<head>` — it only touches the root attribute.
 */
export function initTheme(): ThemeName {
  const theme = storedTheme() ?? DEFAULT_THEME;
  document.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
  return theme;
}

/**
 * Clears the stored preference and returns to the default theme.
 * Use for "reset to system default" controls and for test teardown.
 */
export function resetTheme(): ThemeName {
  try {
    window.localStorage.removeItem("sq-theme");
  } catch {
    // Storage already unavailable — nothing to clear.
  }
  document.documentElement.setAttribute(THEME_ATTRIBUTE, DEFAULT_THEME);
  return DEFAULT_THEME;
}

/** Change record delivered to `onThemeChange` subscribers. */
export interface ThemeChange {
  previous: ThemeName | null;
  current: ThemeName;
}

/**
 * Subscribes to theme switches (any source: `setTheme`, `resetTheme`,
 * DevTools, other scripts). Backed by MutationObserver on the root
 * attribute, so late subscribers still observe programmatic changes.
 * Returns an unsubscribe function.
 */
export function onThemeChange(
  callback: (change: ThemeChange) => void,
): () => void {
  let previous: ThemeName | null = getTheme();
  const observer = new MutationObserver(() => {
    const current = getTheme();
    if (current !== previous) {
      const change: ThemeChange = { previous, current };
      previous = current;
      callback(change);
    }
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [THEME_ATTRIBUTE],
  });
  return () => {
    observer.disconnect();
  };
}
