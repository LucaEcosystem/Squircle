# Forms

Purpose: collect input with native controls, dressed in tokens. The
browser owns behavior (validation, pickers, keyboard, AT mappings);
Squircle styles the surface and associates the messages.

## The row pattern

Every field is a `.sq-field`: label above, control in the middle, help
and error below. Labels stay close to their fields; fields stay far
from each other.

```html
<div class="sq-field">
  <label for="signup-name">Full name</label>
  <input
    class="sq-input"
    id="signup-name"
    name="name"
    type="text"
    autocomplete="name"
    aria-describedby="signup-name-help"
  />
  <p class="sq-field__help" id="signup-name-help">Shown on confirmations.</p>
</div>
```

## Controls

| Markup                                                            | Notes                                                                                                                |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `<input class="sq-input" type="text                               | email                                                                                                                | …">` | All text-like types, `date`, `time`, `color`, `file`. 48px default; `--small` (40px, dense rows only), `--large` (56px). |
| `<textarea class="sq-input">`                                     | 8rem minimum, vertical resize.                                                                                       |
| `<select class="sq-input">`                                       | Native indicator kept deliberately. First-option placeholder: `<option value="" disabled selected>Choose…</option>`. |
| `.sq-check` / `.sq-radio` label rows                              | Native input + themed `accent-color`; the padded ROW is the target. Optional `.sq-check__description` underneath.    |
| `.sq-switch` label + `input[type=checkbox]` + `.sq-switch__track` | Input carries state in the tab order; track is presentation. 56×32px.                                                |
| `<input class="sq-range" type="range">`                           | Native slider, themed accent, full width. Pair with `.sq-range__value` + `aria-live="polite"` for the readout.       |
| `<fieldset class="sq-fieldset">` + `<legend>`                     | Checkbox/radio groups. Borderless; legend reads as the group label.                                                  |

## States

- `disabled` / `readonly`: native attributes, dimmed, `not-allowed`.
  Never fake these with classes.
- Invalid: `aria-invalid="true"` (or `.sq-input--invalid` — the runtime
  sets both). The border widens without moving layout (padding
  compensates). An invalid field MUST have an associated message (below).
- Focus: border warms to accent AND the global focus ring shows for
  keyboard users. Neither is ever removed.

## Required marks

```html
<label for="f-email"
  >Email address
  <span class="sq-required-mark" aria-hidden="true">*</span>
</label>
```

The asterisk is decorative (`required` announces natively). Never rely
on the mark alone: the attribute + native validation do the work.

## Validation (native-first)

1. Write constraints in HTML: `required`, `type="email"`,
   `minlength`, `pattern`, `min`/`max`. The browser validates.
2. Associate every error: `aria-describedby="<input-id>-error"` +
   `<p class="sq-field__error" id="<input-id>-error">` with a message
   that names the fix ("Enter an address like ada@example.com").
   The message text — not the red border — carries the meaning.
3. Optional enhancement: `Squircle.enhanceForm(form)` moves focus to
   the first invalid field on submit. It never prevents or replaces
   native UI. `setFieldError`/`clearFieldError` manage the
   `aria-invalid` + `describedby` + message wiring for custom
   (e.g. server-side) errors. For native errors, reveal pre-rendered
   messages and toggle `.sq-input--invalid` on `invalid` (capture —
   `submit` does not fire while validation blocks) and re-sync on
   `input`, as `examples/forms.html` demonstrates.

```html
<form id="signup">
  <div class="sq-field">
    <label for="f-email"
      >Email address
      <span class="sq-required-mark" aria-hidden="true">*</span>
    </label>
    <input
      class="sq-input"
      id="f-email"
      name="email"
      type="email"
      required
      autocomplete="email"
      aria-describedby="f-email-help f-email-error"
    />
    <p class="sq-field__help" id="f-email-help">We never share it.</p>
    <p class="sq-field__error" id="f-email-error">
      Enter an address like ada@example.com.
    </p>
  </div>
</form>
<script>
  Squircle.enhanceForm(document.getElementById("signup"));
</script>
```

Pre-rendered error text (as above) suits server-rendered forms; the
runtime creates the message element when it does not exist.

## Switch, range, and checks: keyboard

All are native inputs: Tab reaches them, Space toggles checks/switches,
arrows move radios and sliders. Nothing to wire. The switch track
shows the global focus ring via `:focus-visible` on the (visually
hidden but focusable) input.

## Theme behavior

Surfaces, borders, placeholders, help/error text, accents, and the
switch track/knob are tokens; both themes were contrast-checked
including invalid and disabled states.

## Customization

Override `--sq-input-*`, `--sq-check-*`, `--sq-switch-*` tokens, or
restyle in a later stylesheet. Keep the 3rem default heights unless a
documented dense context justifies `small`.

## Common mistakes

- Placeholder as label — labels are always visible.
- `.sq-input--invalid` without a message element — color alone.
- `novalidate` + an incomplete custom engine — keep native validation.
- Custom select chevrons that break zoom/contrast — native indicators stay.
- Errors announced only via `role="alert"` on every keystroke — associate
  with `describedby`; reserve live regions for submit summaries.

## Tested limitations

- No date-picker theming beyond the surface (picker chrome is native).
- No character counters or password-strength meters (later stages).
- `enhanceForm` focuses but does not scroll custom containers — native
  `scrollIntoView` behavior applies.
