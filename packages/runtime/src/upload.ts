/**
 * File upload: a file input (visually hidden but focusable) presented by
 * a drop-zone label. Everything is native until drag-and-drop; the
 * runtime binds the zone, reflects drag state with a presentation
 * class, and feeds dropped files into the input — which fires its own
 * `change`, so the author's handler (and any validation) runs the same
 * way for picks and drops.
 *
 * Markup contract:
 *
 *   <label class="sq-file" data-sq-file>
 *     <input class="sq-file__input" type="file" …>
 *     <span class="sq-file__zone">Choose files or drop them here</span>
 *   </label>
 *
 * The zone (or the label itself, when no zone is marked) receives
 * `sq-file__zone--hover` while a drag hovers and `--filled` once the
 * input holds files. Presentation only: never instead of the input.
 */

import { initMarks, INITIALIZED_ATTRS } from "./dom.js";

interface Wiring {
  destroy(): void;
}

function createUpload(content: HTMLElement): Wiring {
  const input = content.querySelector<HTMLInputElement>(".sq-file__input");
  if (input === null) return { destroy() {} };
  const zone = content.querySelector<HTMLElement>(".sq-file__zone") ?? content;

  const controller = new AbortController();
  const { signal } = controller;

  const hover = (): void => zone.classList.add("sq-file__zone--hover");
  const unhover = (): void => zone.classList.remove("sq-file__zone--hover");

  // preventDefault on dragover is what makes the zone a drop target.
  zone.addEventListener(
    "dragenter",
    (event) => {
      event.preventDefault();
      hover();
    },
    { signal },
  );
  zone.addEventListener(
    "dragover",
    (event) => {
      event.preventDefault();
      hover();
    },
    { signal },
  );
  zone.addEventListener(
    "dragleave",
    (event) => {
      if (
        event.relatedTarget instanceof Node &&
        zone.contains(event.relatedTarget)
      ) {
        return;
      }
      unhover();
    },
    { signal },
  );
  zone.addEventListener(
    "drop",
    (event) => {
      event.preventDefault();
      unhover();
      const dropped = event.dataTransfer;
      if (
        dropped !== null &&
        input.multiple === false &&
        dropped.files.length > 1
      ) {
        // Multiple adds nothing for single-file inputs; the browser
        // takes files[0] when assigning? It refuses the list — pass the
        // first file through a fresh transfer.
        const transfer = new DataTransfer();
        const first = dropped.files[0];
        if (first !== undefined) transfer.items.add(first);
        input.files = transfer.files;
      } else if (dropped !== null) {
        input.files = dropped.files;
      }
      input.dispatchEvent(new Event("change"));
    },
    { signal },
  );

  input.addEventListener(
    "change",
    () => {
      zone.classList.toggle(
        "sq-file__zone--filled",
        input.files !== null && input.files.length > 0,
      );
    },
    { signal },
  );

  return {
    destroy(): void {
      unhover();
      zone.classList.remove("sq-file__zone--filled");
      controller.abort();
    },
  };
}

/**
 * Declarative wiring (idempotent): every `[data-sq-file]` label binds
 * its input and drop zone. Returns a cleanup function.
 */
export function initUploads(root: ParentNode = document): () => void {
  const wirings: Wiring[] = [];
  const marks = initMarks(INITIALIZED_ATTRS.file);
  for (const content of root.querySelectorAll("[data-sq-file]")) {
    if (!(content instanceof HTMLElement)) continue;
    if (!content.querySelector(".sq-file__input")) continue;
    if (!marks.claim(content)) continue;
    wirings.push(createUpload(content));
  }
  return () => {
    for (const wiring of wirings) wiring.destroy();
    marks.release();
  };
}
