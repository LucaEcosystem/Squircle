# Squircle Component Contract (v1.0: plain HTML + CSS + JS)

Every Squircle component obeys this contract. Read it before adding or
changing a component. Stages 3+ implement against it; tests enforce the
mechanical parts (naming, token references, documented-class coverage).

## 1. Naming

- `sq-<component>` for the block (`.sq-button`, `.sq-panel`, `.sq-card`).
- `sq-<component>--<variant>` for variants and sizes, double hyphen
  (`.sq-button--primary`, `.sq-button--large`).
- `sq-<component>__<element>` for internal parts, double underscore
  (`.sq-button__icon`, `.sq-panel__header`). Parts are never used alone;
  they inherit the block's context.
- Utilities (`sq-p-md`, `sq-hidden`) compose with components but never
  replace them: state, semantics, and accessibility live in the component.

## 2. Semantics first

- The HTML element carries the meaning; classes carry the appearance.
  Actions are `<button>`, navigation is `<a href>`, headings are `h1–h6`.
- Never use an anchor as a button or a button as a link. Never add ARIA
  that duplicates native semantics (`role="button"` on a `<button>` is a
  defect, not diligence).
- Icon-only controls MUST have an accessible name (`aria-label`);
  decorative icons MUST be hidden (`aria-hidden="true"`, `focusable="false"`).
- Disabled is `disabled` (form controls) or `aria-disabled="true"` plus
  non-activation (links — see LINKS.md). Never communicate state by
  color alone: pair every color cue with text, shape, or position.

## 3. States

Every interactive component specifies, implements, and tests: default,
hover, `:focus-visible`, active, disabled, and loading/busy where it can
occur. `:focus-visible` is always the 3px azure ring (or the theme's
focus token) — components never remove or restyle it into invisibility.
All motion honors `prefers-reduced-motion`.

## 4. Tokens and theme behavior

- Components reference semantic or component-tier tokens — never brand
  hex, never another component's tokens.
- No Luca-specific values in generic rules. A component must render
  correctly under any theme that passes `checkThemeContrast`; Luca and
  Ocean are both tested.
- Customization precedence (verified by cascade test in `components.spec.ts`):
  1. Framework defaults (this layer).
  2. Active theme tokens (`:root` / `[data-sq-theme]`).
  3. Component variant defaults (`.sq-button--primary`, …).
  4. Consumer overrides (later stylesheets, higher-or-equal specificity).
     Qualifications: variant defaults (3) beat theme tokens (2) ONLY for the
     properties the variant sets — e.g. a primary button keeps its accent
     fill under Ocean (the fill IS the variant), while its text, radius, and
     spacing still follow the theme. Consumers (4) win by source order at
     equal specificity; Squircle never uses `!important`, so one consumer
     rule always suffices.

## 5. Spacing and density

- Internal padding, gaps, and section rhythm come from `--sq-space-*`.
  Comfortable defaults are the DEFAULT — there is no compact density.
- Related elements group tightly (`2xs–sm`); content groups separate
  (`md–lg`); sections separate generously (`section` token).
- Long labels wrap; controls never clip text. Minimum target height for
  interactive controls is 44px (Squircle default: 48px/3rem, 40px/2.5rem
  for `sm` size only where justified).
- Every component passes the §8.6 density gate at 360/768/1024/1440 in
  both Luca and Ocean before it is marked complete.

## 6. Responsive behavior

- Components reflow or stack; they never squeeze. Breakpoint-specific
  changes use the documented responsive utilities or component rules —
  never duplicated ad-hoc media queries per instance.
- Touch targets stay ≥44px on coarse pointers; hover-only affordances
  always have a touch/keyboard path.

## 7. Documentation requirements (per component)

Purpose · semantic HTML · attributes · variants/sizes · states ·
accessibility guidance · theme behavior · customization · responsive
notes · common mistakes · tested limitations. Examples in docs MUST be
copy-pasteable and MUST match the implementation (the coverage test
fails otherwise).
