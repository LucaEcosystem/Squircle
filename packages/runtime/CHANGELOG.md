# @squircle/runtime

## 1.1.0

### Minor Changes

- Nine new components land as part of the 1.1 premium pass.

  - **CSS** (`@squircle/css`): dressed `.sq-select` (native select, painted chevron), `.sq-file` drop zones, radio-based `.sq-rating`, `.sq-combobox` panels, `.sq-chips`/`.sq-chip` tonal tags, dismissible `.sq-banner`, `.sq-stepper`, `.sq-carousel` scroll-snap track with `--half` multi-up, `.sq-timeline` activity feed. Component tokens grow matching tiers (select, combobox, file, stepper, chip, banner, rating, timeline, carousel).
  - **Runtime** (`@squircle/runtime`): `initComboboxes()` (ARIA 1.2 listbox autocomplete: filter, wrap navigation, Enter commits `data-value`, Escape restores open-time text), `initCarousels()` (snap-position paging, end-disabled controls, RTL-safe, reduced-motion aware), `initUploads()` (drop zones feed files into the input with real `change`). All wired through `init()`.
  - **Docs/examples**: ready-to-paste sections in FORMS/FEEDBACK/NAVIGATION/MEDIA/DATA plus demos in the example pages.
  - `sq-trim` counts dynamic classes so trimmed builds keep all nine, including `data-value`-dependent combobox options.

## 1.0.1

### Patch Changes

- Ship-shape audit pass for 1.0.1 (25 findings, all engine-parity verified):

  **Runtime behaviors**
  - `init*()` cleanups now release their idempotency marks (per-behavior attributes like `data-sq-dialogs-initialized`), so a cleanup→re-init cycle rebinds — the SPA/HMR case. Co-located features (dialog opener that also carries a tooltip) no longer block each other.
  - `createMenu`/`createTabs` are singleton per element (binding twice double-fired clicks and arrow keys); `createMenu` opens can target the last item (APG ArrowUp-open).
  - Tabs follow `aria-orientation`: vertical lists use ArrowUp/ArrowDown only, horizontal use ArrowLeft/ArrowRight only.
  - Dialog closes never scroll the page; `closeDialog(el, false)` truly skips restoration (wiring + Chromium's native close refocus).
  - Vastly more robust popover placement: requested → opposite → perpendicular flip order, viewport clamp, scroll/resize repositioning while open, unknown placements warn instead of silently meaning "bottom".
  - Toasts: `dismissAll` cancels pending timers, hover/focus pauses honor expiring mid-pause, dismiss button is localizable (`dismissLabel` option or the region's `data-sq-toast-dismiss-label`), author regions get their live-region role repaired, calls before `<body>` defer instead of throwing.
  - Tooltip `aria-describedby` is transient (added on show, removed on hide).
  - Field-error ids are form-scoped — two forms with same-named fields no longer share one message node.

  **CSS**
  - `.sq-menu` now overlays (absolute + `--sq-z-index-dropdown`) instead of pushing content down; modal-dialog centering is scoped with `:modal`.
  - Component styles stop bypassing tokens: four new component tiers (`--sq-progress-*`, `--sq-spinner-*`, `--sq-audio-*`, `--sq-media-*`) and a sweep of migrated hardcoded values; `:focus-visible` no longer mutates corner radii; logical-first property sweep; the switch knob animates `translateX`.
  - Collapsed mobile navs recover when the viewport widens (no stranded links).

  **Tooling & gates**
  - `sq-trim` surfaces unterminated-block parse conditions, unreadable files/directories, and safelist ambiguity warnings instead of failing (or losing data) silently; scanner and trimmer share one class-token regex.
  - `check.mjs` performs the banner↔version check it always advertised; `build.mjs` clears `dist/` before assembling.
  - Custom-theme contrast validation now pins the same 22 pairs as the built-in Luca theme (was 7).
