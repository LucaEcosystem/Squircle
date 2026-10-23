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
| `<select class="sq-input">` inside `<div class="sq-select">`      | Dressed select: painted token-colored, em-scaled chevron; native popup always. `.sq-select--native` opts back out.   |
| `.sq-combobox` + input + list                                     | Typeahead: native input with `role="combobox"`; list is `role="listbox"` (see below).                                |
| `.sq-file` label + input + zone                                   | File input presented as a drop zone (see below).                                                                     |
| `.sq-rating` radio group                                          | Radio stars: DOM order is highest-first; visual fill is left-to-right 1…n (see below).                               |
| `<select class="sq-input">` (bare)                                | Native indicator kept deliberately. First-option placeholder: `<option value="" disabled selected>Choose…</option>`. |
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

## Select, dressed

```html
<div class="sq-field">
  <label for="order-currency">Billing currency</label>
  <div class="sq-select">
    <select class="sq-input" id="order-currency" name="currency">
      <option value="usd" selected>USD — US Dollar</option>
      <option value="eur">EUR — Euro</option>
    </select>
  </div>
</div>
```

The wrapper paints a chevron from tokens; the select itself stays a
native `<select>` — the popup list, its fonts, and its zoom are the
browser's, always. The chevron is em-scaled (scales with zoom) and
token-colored (contrast-checked), so the classic broken-custom-chevron
failure modes don't apply. `multiple` and `size` selects, and
`.sq-select--native`, keep the browser's own indicator: that chrome is
part of the control there.

## Combobox

```html
<div class="sq-field">
  <label for="cb-country">Country</label>
  <div class="sq-combobox">
    <input
      class="sq-input"
      id="cb-country"
      name="country"
      type="text"
      role="combobox"
      aria-expanded="false"
      aria-controls="cb-country-list"
      aria-autocomplete="list"
      autocomplete="off"
      data-sq-combobox
    />
    <ul
      class="sq-combobox__list"
      id="cb-country-list"
      role="listbox"
      aria-label="Countries"
      hidden
    >
      <li role="option" data-value="de">Germany</li>
      <li role="option" data-value="jp">Japan</li>
      <li class="sq-combobox__empty" hidden>No countries match.</li>
    </ul>
  </div>
</div>
<script>
  Squircle.init(); // or Squircle.initComboboxes(document)
</script>
```

The input is the value carrier: options may carry `data-value` to write
back a machine value (the label stays what was shown while browsing).
Behavior, served by the runtime:

- Typing opens the panel and filters options by label text
  (`data-sq-combobox-filter="off"` keeps server-driven lists intact —
  the runtime then only navigates).
- `ArrowDown`/`ArrowUp` move (wrapping); `Home`/`End` jump; `PageUp`/
  `PageDown` move five; `Enter` commits the active option; `Escape`
  closes and restores the pre-open value; `Tab` closes and lets focus
  travel.
- The active option is announced through `aria-activedescendant`
  (options receive ids automatically when missing); the panel hides on
  outside clicks and on focus leaving the group.

Keyboard typing is native (the input does the announcing); the panel is
presentation.

## File upload

```html
<label class="sq-file" data-sq-file>
  <input
    class="sq-file__input"
    id="upload-logo"
    name="logo"
    type="file"
    accept="image/*"
    multiple
  />
  <span class="sq-file__zone">
    <span class="sq-file__icon" aria-hidden="true">
      <svg
        class="sq-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        focusable="false"
      >
        <path d="M12 15V4" />
        <path d="m7 8 5-5 5 5" />
        <path d="M5 20h14" />
      </svg>
    </span>
    <span class="sq-file__title">Choose files or drop them</span>
    <span class="sq-file__hint">PNG, JPEG, SVG.</span>
  </span>
</label>
<script>
  Squircle.init(); // or Squircle.initUploads(document)
</script>
```

The input stays a real file input (Tab reaches it; the focus ring lands
on the zone). The runtime binds the label as a drop target: dragging
over adds `sq-file__zone--hover` to the zone, dropping feeds
`dataTransfer.files` into the input (single-file inputs keep the first
file), and a `change` event fires — the author's handler then runs the
same way it does for a picker pick. The zone also picks up
`sq-file__zone--filled` for styling completeness. Disabled is the
native attribute on the input; the zone dims through it.

## Rating

```html
<fieldset class="sq-fieldset">
  <legend>Rate your onboarding</legend>
  <div class="sq-rating">
    <label class="sq-rating__star">
      <input class="sq-rating__input" type="radio" name="rating" value="5" />
      <span class="sq-sr-only">5 stars</span>
    </label>
    <label class="sq-rating__star">
      <input class="sq-rating__input" type="radio" name="rating" value="4" />
      <span class="sq-sr-only">4 stars</span>
    </label>
    <label class="sq-rating__star">
      <input class="sq-rating__input" type="radio" name="rating" value="3" />
      <span class="sq-sr-only">3 stars</span>
    </label>
    <label class="sq-rating__star">
      <input class="sq-rating__input" type="radio" name="rating" value="2" />
      <span class="sq-sr-only">2 stars</span>
    </label>
    <label class="sq-rating__star">
      <input
        class="sq-rating__input"
        type="radio"
        name="rating"
        value="1"
        checked
      />
      <span class="sq-sr-only">1 star</span>
    </label>
  </div>
</fieldset>
```

Stars are painted by the CSS (token-colored mask, em-scaled); the
author never draws one. Options are native radios: DOM order is
highest-first so that "fill everything before the checked one" paints a
left-to-right 1..n visually; each option announces its label ("5
stars"); arrows move as radios always do. Pre-select a default to
communicate an existing value; leave all unchecked for no default.

## Theme behavior

Surfaces, borders, placeholders, help/error text, accents, and the
switch track/knob are tokens; both themes were contrast-checked
including invalid and disabled states. The select chevron, rating
stars, and combobox panel all follow the active theme the same way.

## Customization

Override `--sq-input-*`, `--sq-check-*`, `--sq-switch-*` tokens, or
restyle in a later stylesheet. Keep the 3rem default heights unless a
documented dense context justifies `small`.

## Common mistakes

- Placeholder as label — labels are always visible.
- `.sq-input--invalid` without a message element — color alone.
- `novalidate` + an incomplete custom engine — keep native validation.
- Custom chevrons that break zoom or contrast — the dressed select
  paints from tokens and scales with text; opt out with
  `.sq-select--native` (or bare `select.sq-input`) when unsure.
- Errors announced only via `role="alert"` on every keystroke — associate
  with `describedby`; reserve live regions for submit summaries.
- Fake drop zones with hashes of JS that never touch the input — the
  input stays the value carrier; the runtime feeds it, it doesn't
  replace it.
- Rating as clickable hearts/dots divs — the radios ARE the control;
  every star is a real labeled option.

## Tested limitations

- No date-picker theming beyond the surface (picker chrome is native).
- The combobox list has no built-in result-count live region (the active
  option is announced; add one if your lists are long).
- Combobox multi-select is out of scope for now — one selection at a
  time.
- No character counters or password-strength meters (later stages).
- `enhanceForm` focuses but does not scroll custom containers — native
  `scrollIntoView` behavior applies.
- The dressed select cannot style the popup list (that is native
  chrome, deliberately).
