# Squircle 1.1.0 — Premium review

Total pass over 1.0.1: nine new components, motion pass, showcase
upgrade, docs site, release engineering. This is the design and
engineering review the 1.0.0 audit promised (`docs/reviews/audit-1.0.0`
pointed here) — what changed, and which invariants it kept.

## The nine components

| Component      | Home (css / docs)              | Nativeness                                                             |
| -------------- | ------------------------------ | ---------------------------------------------------------------------- |
| Combobox       | forms.css / FORMS.md           | Native input + ARIA 1.2 listbox (`initComboboxes`)                     |
| Dressed select | forms.css / FORMS.md           | Native `<select>`; painted token chevron, `.sq-select--native` opt-out |
| File upload    | forms.css / FORMS.md           | Native input; runtime only mirrors drag state + imports dropped files  |
| Rating         | forms.css / FORMS.md           | Radio group, DOM-order 5→1 + row-reverse fill                          |
| Chips          | feedback.css / FEEDBACK.md     | Semantic list of tags; removal is author JS on a labeled button        |
| Banner         | feedback.css / FEEDBACK.md     | Semantic region; dismissal is author JS                                |
| Stepper        | navigation.css / NAVIGATION.md | `aria-current="step"`, vertical mobile-first                           |
| Carousel       | media.css / MEDIA.md           | Native scroll-snap; runtime pages by snap position                     |
| Timeline       | data.css / DATA.md             | `<ol>` entries; rail drawn by CSS                                      |

Each one follows the component contract: block/variant/part naming,
native control underneath where one exists, tokens not hex, docs that
document their classes (the "no undocumented classes" gate enforces
it), and e2e specs across engines.

## Engineering pass highlights

- **Motion pass.** A fifth "no one re-gates PRM" invariant is enforced
  mechanically now (`packages/css/test/motion.test.ts`): every duration
  and easing rides motion/component tokens, the reduced-motion gate
  lives exactly once in `base.css`, and keyframes stay in the `sq-`
  namespace. CONTRACT.md section 6b states the contract.
- **Showcase upgrade.** Templates demo 1.1 behavior where it belongs:
  dashboard (stepper + timeline), settings (dressed select + chips +
  rating), landing (carousel + chips). Templates restarted axe-clean and
  overflow-clean at all four widths, in Luca and Ocean.
- **Docs site.** `pnpm site:build` renders `packages/components/*.md`
  into a static, zero-dependency site under `docs-site/dist/`
  (14 pages). Docs tables — including FORMS.md's hand-wrapped,
  code-span-with-pipes table — render as `sq-table`, code fences as
  focusable `pre` regions (axe demanded, and received, keyboard access).
- **Release engineering.** Changeset-managed minor for the four public
  packages; all eight workspace packages ride the same `1.1.0`
  (the version-consistency test's contract). Changelogs carry sensible
  per-package entries.

## Gates at 1.1.0

- Build + check ("css dist is fresh") + lint + format: green.
- Unit: **171/171** (motion contract tests included).
- Playwright trio (chromium/webkit/mobile): **398 passed**, 25 skipped
  (the +25 skip group is unchanged — chromium-only captures, firefox
  parity, and the consumer fixture documented exclusions).
- New specs this release: 51 component specs + 18 docs-site specs.
- bundles: squircle.css **89,187 B** readable / squircle.min.css
  **76,536 B** minified.
- Firefox remains **verify-on-first-run** in CI (local host cannot
  launch the bundled Nightly build; see the 1.0.0 audit note).

## Publish status

`changeset publish` was NOT executed: this host has no npm credentials
(npm whoami E401). The repo is publish-ready — every manifest at
`1.1.0`, changelogs written, gates green — and the publish step is:

```
corepack pnpm changeset publish
```

Nothing is committed: the workspace tree contains the whole 1.1.0 state
for whoever ships it (baseline commit e7537a2 remains the last commit).
