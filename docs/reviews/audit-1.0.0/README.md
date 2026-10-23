# Squircle 1.0.0 — Engineering audit (post-release review)

Static review + browser probes + full local gate runs. Everything here was
verified against the committed `1.0.0` baseline, then re-verified after each
fix. Not a design review — see `docs/reviews/premium-1.1.0/` (wave 8) for
that pass.

**Baseline gates at audit start** (all fixes below verified against these):

- Build + freshness + package gates, lint, format: green.
- Unit (Vitest): **143/143**.
- Playwright **chromium**: **97 passed**, 1 documented skip.
- Playwright **webkit**: **86 passed** (after finding 25 fix; 85 + 1 failure before).
- Playwright **mobile** (iPhone 13, webkit engine): **86 passed**.
- Playwright **firefox**: NOT VERIFIABLE on this host. Playwright's bundled
  Firefox (Nightly 157.0, build v1555) dies at profile initialization —
  "Could not find profile folder" — regardless of flags (`--version` works,
  pre-created profile dirs, `-profile` with trailing slash, `/tmp` and
  default `TMPDIR`, GUI `open`): identical exit 1 in every mode. No
  quarantine xattr; `HOME`/`TMPDIR` sane. Same symptom as the carried
  Stage-1 environment note. CI's ubuntu runner (Firefox via
  `playwright install --with-deps`) is unaffected; treat the CI firefox
  step as **verify-on-first-run**.

## Findings

Severity: blocker = breaks the shipped gate or a documented public path;
major = user-visible correctness; minor = real but bounded; polish =
hygiene/quality. Status field updated as fixes land in this wave.

### Blockers

1. **CI browser steps run from the wrong directory.** F1 ·
   `.github/workflows/ci.yml:67–76` — the four Playwright steps ran
   `pnpm exec playwright test --project=…` from the repo root, where no
   Playwright config is discoverable (`--list` reported
   `Project(s) "chromium" not found`; root collection crashes on Vitest
   unit files). The root `test:e2e` script (`package.json:16`) was broken
   identically. Engines themselves were fine. **Status: FIXED** — root
   script now `corepack pnpm --filter squircle-e2e test`; CI steps run
   `pnpm --filter squircle-e2e test --project=<engine>`.

2. **The consumer spec's fixture never existed.** F2 ·
   `tests/e2e/specs/consumer.spec.ts` — `shopFor("chromium")` resolved to
   `fixtures/consumers/shop-chromium`, but only `shop`, `shop-webkit`, and
   `shop-mobile` were committed; every `npm install` ran in a nonexistent
   cwd and the packaged-css trim check could not reach its config. During
   the restructure two further latent defects surfaced and were fixed with
   it: the fixture's HTML still referenced the unscoped pre-release
   `node_modules/squircle` paths (three in `index.html`, one in
   `module.html`), and the fixture declared a versioned `file:../_tarball`
   dependency that pins it to `1.0.0.tgz` forever. **Status: FIXED** —
   fixture renamed to `shop-chromium`; dead `shop-webkit`/`shop-mobile`
   copies and the vestigial committed `_tarball` removed; scoped paths in
   all four SPA references; spec now installs with `--no-save
--package-lock=false`, derives the tarball name and `manifest.version`
   from `packages/squircle/package.json` (version-bump-proof), and is
   documented as chromium-only.

### Major

3. **Init cleanups never unmark `data-sq-initialized`.** F3 ·
   `packages/runtime/src/dom.ts:23–31` (+ all `init*` call sites) — the
   returned cleanups tear listeners down but leave the marks, so a
   cleanup→re-init cycle (the HMR/SPA-remount use case the cleanup
   contract advertises) permanently skips dialogs, menus, popovers,
   tooltips, tabs, and forms with no error surfaced. **Status: FIXED**
   (per-behavior mark attributes whose cleanups release the claims).

4. **Menus have no overlay treatment.** F4 · `packages/css/src/overlays.css:63–74`
   (+ `packages/components/OVERLAYS.md:72–129`) — `.sq-menu` carried no
   `position` or `z-index`: a menu opened in document flow and pushed all
   following content down, while dialogs, popovers, and tooltips all
   behaved as real overlays. OVERLAYS.md never stated that positioning
   was author-owned. **Status: FIXED** (positioned menu + stacking token
   - docs).

5. **Toast motion contradiction across the three layers.** F5 ·
   `packages/css/src/feedback.css:112–126` vs `packages/runtime/src/toast.ts:8–10`
   and `packages/components/FEEDBACK.md:40` — `.sq-toast` ran an
   `sq-rise-in` entrance while the module header and FEEDBACK.md both
   claimed "instant appearance, no animation." Decision (user): the gentle
   entrance is canonical (PRM-flattened automatically by the base block).
   **Status: FIXED** — docs + header aligned to the entrance, explicit PRM
   gate verified.

6. **`fieldErrorId` collisions across forms.** F6 ·
   `packages/runtime/src/validation.ts:11–26` — ids derived from the
   input's `name`, so two forms on one page with same-named fields shared
   one message node: errors rendered into the other form's slot, and
   clearing one cleared both. **Status: FIXED** (form-scoped id derivation).

7. **Toast timers can strand live toasts.** F7 ·
   `packages/runtime/src/toast.ts:92–136` — `dismissAll` never cleared
   pending per-toast timers; `focusout` could re-arm a timer on an
   already-removed toast; a same-tick `mouseenter` race could drive
   `remaining ≤ 0` with the timer already cleared, leaving a toast on
   screen forever. **Status: FIXED** (timer registry + `isConnected`
   gates + remaining clamp with dismissal at 0).

8. **`closeDialog(dialog, false)` could not suppress restoration for
   wired dialogs.** F8 · `packages/runtime/src/dialog.ts:74–83,132–141` —
   the module's `close` listener unconditionally refocused the invoker, so
   the documented flag was honored only for unwired dialogs. **Status:
   FIXED** (restoration routed through the invoker registry).

9. **Menu keyboard map deviates from APG on overflow triggers.** F9 ·
   `packages/runtime/src/menu.ts:73–86` — ArrowUp from a trigger should
   land on the LAST item (all open keys focused the first). **Status:
   FIXED** (APG-accurate open keys).

10. **Tabs bound vertical keys in horizontal lists.** F10 ·
    `packages/runtime/src/tabs.ts:90–105` — ArrowUp/Down handlers bound
    without checking `aria-orientation`. **Status: FIXED** (orientation
    check).

11. **Tooltip description leak + dead marker.** F11 ·
    `packages/runtime/src/tooltip.ts:42–51` — `aria-describedby` was added
    on show and never removed on hide; the `data-sq-describedby="managed"`
    marker was written but never read. **Status: FIXED** (remove on hide;
    marker deleted).

12. **Popover only flips on one axis.** F12 ·
    `packages/runtime/src/popover.ts:22–59` (+ `OVERLAYS.md:159–164`) —
    flip logic handled `bottom`/`top` only; `left`/`right` never checked
    fit; an invalid `data-sq-popover-placement` silently behaved as
    `bottom`; engines without `event.newState` never positioned at all;
    no reposition on scroll/resize while open. **Status: FIXED** (four-way
    fit checks, validated placement, `newState` fallback, scroll-follow
    while open, docs).

13. **Global focus rule mutates corner shapes.** F13 ·
    `packages/css/src/base.css:47–55` — the `:focus-visible` rule set
    `border-radius: var(--sq-radius-xs)`, visibly squaring/mutating the
    focused element's own corners; equal-or-higher-specificity radii could
    silently override it. **Status: FIXED** (radius line removed — the
    ring already follows each element's radius).

14. **Component CSS still bypasses tokens numerically.** F14 ·
    `packages/css/src/components.css` et al. — raw sizes/opacities against
    the layers' own "no hardcoded values" headers: tab underline
    `inset 0 -3px 0` (components.css:433,444), state opacities
    0.55/0.65/0.45 (components.css:105,155; overlays.css:102; forms.css:49,210,294,321;
    feedback.css:214), hover `brightness(1.08/1.1)` (components.css:53,82),
    textarea `8rem`, audio `3rem`, grid card `18rem`, table `min-width:36rem`,
    code `0.9em`, shimmer `1600ms`, min-heights `3rem/2.75rem`, and
    component-level `@media` rem thresholds untested against
    `--sq-breakpoint-*` tokens (feedback.css:103; navigation.css:137,265,284).
    **Status: FIXED** (token tiers added — including missing
    `--sq-progress-*`, `--sq-spinner-*`, `--sq-audio-*`, `--sq-media-*`
    tiers from finding 15 — hardcoded values migrated, breakpoint tests
    extended).

15. **Missing component token tiers for progress/spinner/audio/media.** F15 ·
    `packages/tokens/src/component.ts` (+ `feedback.css:157–199`,
    `media.css`) — toast/table/skeleton had tiers; these four families did
    not. Folded into finding 14's fix. Also fixed `data.css:10`'s comment
    claiming a "sticky header wash" no rule provides.

16. **Physical/logical property mix.** F16 · `data.css:47,54,87,91`,
    `components.css:264,284,335,417`, `navigation.css:17`, `base.css:95`
    — physical `border-top/bottom` alongside the predominantly logical
    `border-block-end`/`border-inline-start` style; utilities expose both
    `margin-left` and `margin-inline-start` families; the switch knob
    animates physical `left` (forms.css:264,279) and the skip link uses
    `left` (utilities.css:894). **Status: FIXED** (logical-first sweep;
    knob on `translateX`).

17. **`sq-trim` silent failure modes.** F17 ·
    `packages/build-tools/src/trim.ts:43,134,204`, `cli.ts:87–88,122`,
    `files.ts:37–44` — `parseCss` truncated silently on the first
    unterminated block ("ignore the tail"); unguarded `readdirSync` in
    `walk()` (files.ts:37–44) and per-source `readFileSync` (cli.ts:122)
    crash uncaught on EACCES; a safelist entry carrying both `prefix` and
    `pattern` silently dropped the pattern; selector-regex character
    classes diverged between trim (lowercase-only) and scan.ts:34.
    **Status: FIXED** (errors surfaced with file context, IO guarded,
    ambiguity warned, classes aligned).

18. **`check.mjs` promises a check it never performs; `build.mjs` never
    cleans `dist/`.** F18 · `packages/squircle/check.mjs:4–6`,
    `build.mjs` — the docstring claims a CSS-banner version check that
    lives (mis-stated) in `package.test.ts:85–96`; removed upstream files
    could linger in `dist/` while wildcard existence checks still pass.
    **Status: FIXED** (real banner↔(manifest+sources) version assertion in
    the gate; dist cleared before assemble).

19. **Stale/contradictory internal comments.** F19 ·
    `packages/tokens/src/semantic.ts:21` (cites nonexistent
    `test/contrast.test.ts`), `packages/tokens/src/emit-css.ts:5`
    (describes gitignored `dist/` as "committed build output"),
    `tests/e2e/specs/consumer.spec.ts:24–29` (false Playwright-1.64
    narrative — moot after finding 2's rewrite), `packages/css/src/base.css:9–10`
    (claims instant transitions are exempt from the blanket PRM nuke at
    106–116). **Status: FIXED** (all four rewritten truthfully).

20. **`dialog.sq-dialog { position: fixed; inset: 0 }` hits non-modal
    dialogs too.** F20 · `packages/css/src/overlays.css:53–56` (+
    `dialog.ts` "non-modal keeps native behavior" header vs
    `OVERLAYS.md`) — modeless dialogs were forced viewport-centered
    instead of in-flow. **Status: FIXED** (scoped with `:modal`).

21. **Mobile nav strands links after resize.** F21 ·
    `packages/css/src/navigation.css:137–147` — collapsing the details
    nav narrow, then widening past 48rem stranded links (summary hidden
    at md+; nothing re-opens `<details>`), unrecoverable without JS.
    **Status: FIXED** (min-width recovery rule + regression test).

22. **Custom-theme contrast checklist is weaker than Luca's.** F22 ·
    `packages/themes/src/theme.ts:83–91` vs
    `packages/tokens/test/tokens.test.ts:131–151` — custom themes
    validated 7 pairs while Luca pins 17; the promised
    muted-on-surfaceOverlay pair was asserted nowhere. **Status: FIXED**
    (single shared 17-pair list for both validators).

23. **Direct-API e2e coverage gaps.** F23 · `tests/e2e/specs/` —
    `isDialogOpen`, `dismissAll`, `onThemeChange` (unsubscribe/`previous`),
    `onReducedMotionChange`, `focusableChildren`, imperative
    `createMenu`/`createTabs`, `notify` error tone (`role="alert"`), toast
    hover/focus pausing, tooltip hover path, popover placements, and nav
    collapse-recovery were never exercised. **Status: FIXED** (new
    `runtime-api.spec.ts` covers the full list).

24. **Verb families mixed across the runtime surface; init-marking
    duplicated.** F24 · `packages/runtime/src/index.ts:14–41` (+
    popover.ts:77–78, tooltip.ts:81–82) — `init*`/`open*`/`close*` vs
    `create*` vs `positionPopover` vs `notify`/`dismissAll` vs `enhance*`
    lack a documented verb contract; popover/tooltip re-implement
    `data-sq-initialized` marking with raw literals. **Status: FIXED**
    (verb contract table in API.md; marking routed through `dom.ts`).

25. **(Bonus, found during baseline) Cascade contract drift: the
    "primary fill stays Luca gold under Ocean" story is impossible and
    wrong.** F25 · `tests/e2e/specs/components.spec.ts:138–144`,
    `packages/components/CONTRACT.md:51–54`,
    `packages/components/BUTTONS.md:101` — the assertion captured a
    transient first-paint value: live probes proved both engines re-resolve
    the fill to Ocean's accent retune (`#e0a458`, pinned by
    `theme.test.ts:93`) once recalc settles. The product's own architecture
    ("components reference semantic tokens, so one override retunes a
    whole surface") makes retuned accent fills the correct behavior.
    **Status: FIXED** — spec now asserts `rgb(224, 164, 88)` with the
    retune rationale; CONTRACT.md and BUTTONS.md now describe the fill-vs-
    token relationship as it actually cascades (accent-derived fills ride
    a theme's accent retune; danger red stays red).

## Things notably solid (verified, not aspirational)

1. The mechanical contract is enforced, not hoped for: naming, token
   references, no-hardcoded-colors, dist freshness, luca.css drift, and
   version/zero-deps pinning are all test-asserted.
2. Contrast is computed (WCAG 2.2 luminance) with 17 pinned Luca pairs and
   pixel-exact color assertions recurring through the e2e suite.
3. The runtime leans on platform primitives correctly (`<dialog>`, popover
   top layer, `AbortController`-scoped listeners, `innerText`-only
   injection, documented opinionated policies).
4. `sq-trim` is defensively conservative with honest diagnostics
   (regression-tested string-aware parsing, exit-2 zero-kept guard).
5. Reduced motion is gated at the base layer with sensible per-component
   degradation (spinner freezes, skeleton holds).

## Disposition

All 25 findings are fixed in this wave (`v1.0.1`, changeset-managed).
Post-fix verification: unit **163/163** (baseline 143 — trim guard,
breakpoint-conformance, safelist, banner and shared-contrast tests added);
Playwright **329 passed** across chromium/webkit/mobile (+25 per-suite
skips: captures and single-fixture consumer that run on one engine by
design). The only open item is the Firefox _local_ verification (host
limitation, thoroughly documented above) and the consequent
verify-on-first-run flag for the CI firefox step.
