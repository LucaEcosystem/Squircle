# Feedback

Purpose: tell users what happened. Persistent messages (alerts) and
transient notifications (toasts) are different components with
different announcement contracts — read both before choosing.

## Alerts (persistent, in-flow)

```html
<div class="sq-alert sq-alert--success" role="status">
  <span class="sq-alert__icon" aria-hidden="true"><!-- svg --></span>
  <div class="sq-alert__body">
    <p class="sq-alert__title">Export ready</p>
    <p class="sq-alert__text">fleet-march.csv is in your downloads.</p>
  </div>
</div>
```

Tones: `--success/--info/--warning/--error`. Roles: `role="status"`
(completion, polite) or `role="alert"` (errors that block, assertive).
The tone border + icon + title triple Up the message — color is never
alone. Alerts stay until resolved or dismissed by context (navigation,
explicit close); they never auto-expire.

## Toasts (transient, live region)

```html
<div class="sq-toasts" data-sq-toasts role="status"></div>
<script>
  Squircle.notify("Workspace saved.", { tone: "success" });
  // { tone: "info"|"success"|"warning"|"error", duration: 6000(ms, 0=persist) }
  const handle = Squircle.notify("Uploading…", { duration: 0 });
  handle.dismiss(); // or Squircle.dismissAll();
</script>
```

`notify()` takes plain text (never HTML — injection impossible by
construction). Auto-dismiss pauses on hover/focus; every toast has a
dismiss button; errors assert (`role="alert"`), the rest are polite.
Instant appearance — no animation to gate.

**The toast rule:** if the user must act on it or find it later, it is
not a toast — use an alert or inline text. Toasts supplement; they
never carry the only copy of anything essential.

## Progress, spinner, skeleton

```html
<div class="sq-progress-label">
  <span>Uploading fleet.csv</span><span>62%</span>
</div>
<progress class="sq-progress" value="62" max="100">62%</progress>

<div role="status">
  <span class="sq-spinner" aria-hidden="true"></span>
  <span class="sq-spinner__label">Loading berth schedule…</span>
</div>

<div role="status" aria-label="Loading article…">
  <div class="sq-skeleton" style="height: 2rem; width: 60%"></div>
  <div class="sq-skeleton" style="height: 1rem"></div>
</div>
```

- `progress`/`meter` are native: labeled outside, values announced
  natively, `sq-progress--large` for hero moments.
- Spinners pair the visual with a visually-hidden status label; under
  reduced motion the ring freezes (still labeled, still honest).
- Skeletons reserve the space they will fill (explicit heights/widths
  — never auto-height shift); the shimmer becomes a static wash under
  reduced motion; the container names what loads.

## Badges, status, empty states

```html
<span class="sq-badge sq-badge--success">Live</span>
<span class="sq-status sq-status--warning"
  ><span class="sq-status__dot" aria-hidden="true"></span>Degraded</span
>

<div class="sq-empty">
  <span class="sq-empty__icon" aria-hidden="true"><!-- svg --></span>
  <p class="sq-empty__title">No exports yet</p>
  <p class="sq-empty__text">Exports you create appear here.</p>
  <a class="sq-button sq-button--primary" href="/export">Create an export</a>
</div>
```

Badge tones set fill + contrast ink; the LABEL carries meaning. Status
dots are `aria-hidden` — the text announces. Empty states name what is
missing, why, and the one next action (with a real link/button — never
a dead end).

## Accessibility

- Live regions: `status` (polite) vs `alert` (assertive) chosen by
  urgency, not by habit. Dynamic content injected into a region on the
  page announces; regions created at notify-time announce on insertion.
- Dismissal: toasts dismiss (button + timeout); alerts persist until
  their context resolves.
- Reduced motion: shimmer static, spinner frozen-but-labeled, toasts
  instant. Nothing essential animates.
- Contrast: all tones checked in both themes (fills + inks are
  contrast-paired tokens).

## Theme behavior

Tones, washes, inks, and shimmers are tokens. Error red is
semantic-only (documented in tokens); everything else re-maps per
theme without markup changes.

## Customization

Override `--sq-alert-*`, `--sq-badge-*`, `--sq-toast-*`,
`--sq-skeleton-*` or restyle tones later. Keep the border+icon+text
triple — dropping to color-only breaks the contract.

## Responsive behavior

Alerts grid (icon/text/action) wraps naturally; toasts center on
narrow, dock right at 48rem+; empty states cap at measure. Toast
max-width guards small viewports.

## Common mistakes

- Toast for errors the user must fix — alerts or inline errors.
- `role="alert"` on every status — assertive interrupts; most news is polite.
- Skeletons with no dimensions — layout shift is the bug skeletons exist to prevent.
- Badge without text ("●" alone) — the dot is decoration; the label is the message.
- Spinner without a status label — motion-only loading excludes everyone who cannot see it.

## Tested limitations

- Toast stacking beyond ~4 is untested visually (regions scroll; keep counts low).
- `progress` indeterminate state styling is platform-default (correct, unthemed).
- No confirm-dialog patterns here — destructive confirmations live in OVERLAYS.md dialogs.
