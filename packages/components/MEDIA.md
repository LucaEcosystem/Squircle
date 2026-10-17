# Media

Purpose: images, video, and audio that reserve their space, keep their
captions, and never shift the page. No external dependencies.

## Figures

```html
<figure class="sq-figure">
  <img
    src="harbor.jpg"
    alt="Cranes over berth 7 at dawn"
    width="1600"
    height="900"
  />
  <figcaption>Berth 7 handles the morning arrivals.</figcaption>
</figure>
```

`width`/`height` attributes reserve the ratio before load (no layout
shift); `alt` carries the content (empty `alt=""` only for purely
decorative images); captions are muted, measured prose.

## Responsive containers

```html
<div class="sq-media">
  <iframe
    src="…"
    title="Harbor overview film"
    loading="lazy"
    allow="fullscreen"
  ></iframe>
</div>
```

16:9 default, `--square`, `--wide`. Children fill the reserved box;
iframes need `title`; `loading="lazy"` below the fold. The sunken
background shows while content loads — never a white flash or a
collapsing box.

## Audio

```html
<audio class="sq-audio" controls src="foghorn.mp3">
  <a href="foghorn.mp3">Download the recording (MP3)</a>
</audio>
```

Native controls, full width. The fallback link inside serves engines
without audio support. Never autoplay; never hide controls.

## Placeholders

```html
<div class="sq-media-placeholder" role="img" aria-label="Loading chart…">
  Chart loading…
</div>
```

Fixed-ratio shells (never auto-height) with a text label naming what
loads. Replace with the real figure when ready — same footprint, zero
shift.

## Accessibility

- Every informative image has `alt`; decorative images have empty
  `alt` AND no figcaption pointing at them.
- Iframes are titled; video keeps captions where the medium needs them
  (`<track kind="captions">` — author-provided, documented, not magic).
- Audio never autoplays; transcripts accompany meaningful audio
  (author-provided, beside the player).
- Placeholders are labeled regions, not silent boxes.

## Theme behavior

Borders, sunken wells, captions, and placeholder dashes are tokens.
Media content itself is theme-agnostic (photographs do not re-skin).

## Customization

Ratios beyond 16:9/square/wide are page CSS (`aspect-ratio` +
`object-fit: cover`). Keep the border/radius pairing so media reads
as Squircle surfaces.

## Responsive behavior

Media is fluid by construction (`width: 100%`, `height: auto` or ratio
boxes). Figures never overflow narrow viewports; captions wrap at
measure.

## Common mistakes

- Missing `width`/`height` on images — the classic layout-shift bug.
- `alt` describing the file ("IMG_0042.jpg") instead of the content.
- Background-image for content images — invisible to AT and print.
- Autoplaying video with sound — blocked by browsers, hated by users.
- Placeholders that collapse (`min-height` mysteries) — fixed ratios only.

## Tested limitations

- No lightbox/zoom behavior (application concern; styles compose with it).
- `<track>` caption files are author-provided; rendering is platform-native.
- Art direction (`picture`/`srcset`) is markup, fully supported, unstyled.
