/**
 * Native-first validation helpers.
 *
 * Squircle never replaces browser constraint validation — these helpers
 * only ASSOCIATE messages the author writes: wiring `aria-invalid` and
 * `aria-describedby`, creating the message element, and moving focus to
 * the first problem on submit. No custom validity engine, no shadow
 * validity state to drift from the platform.
 */

function fieldErrorId(input: Element): string {
  const base =
    input.id !== "" ? input.id : (input.getAttribute("name") ?? "field");
  return `${base}-error`;
}

function messageElement(input: HTMLElement, id: string): HTMLElement {
  let message = document.getElementById(id);
  if (message instanceof HTMLElement) return message;
  message = document.createElement("p");
  message.id = id;
  message.className = "sq-field__error";
  const field = input.closest(".sq-field, .sq-fieldset");
  (field ?? input.parentElement ?? document.body).append(message);
  return message;
}

export type ValidatableField =
  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/**
 * Shows `message` for `input`: sets `aria-invalid`, appends the message
 * id to `aria-describedby` (preserving author descriptions), adds the
 * invalid class, and creates the `.sq-field__error` element when the
 * author did not provide one. Safe to call repeatedly (updates in place).
 */
export function setFieldError(input: ValidatableField, message: string): void {
  const id = fieldErrorId(input);
  const messageEl = messageElement(input, id);
  messageEl.textContent = message;
  input.setAttribute("aria-invalid", "true");
  input.classList.add("sq-input--invalid");
  const described = (input.getAttribute("aria-describedby") ?? "")
    .split(/\s+/)
    .filter((token) => token !== "");
  if (!described.includes(id)) described.push(id);
  input.setAttribute("aria-describedby", described.join(" "));
}

/**
 * Clears a `setFieldError` state: removes `aria-invalid` and the class,
 * empties the message element, and drops its id from `aria-describedby`
 * (preserving the author's own descriptions).
 */
export function clearFieldError(input: ValidatableField): void {
  const id = fieldErrorId(input);
  input.removeAttribute("aria-invalid");
  input.classList.remove("sq-input--invalid");
  const described = (input.getAttribute("aria-describedby") ?? "")
    .split(/\s+/)
    .filter((token) => token !== "" && token !== id);
  if (described.length > 0) {
    input.setAttribute("aria-describedby", described.join(" "));
  } else {
    input.removeAttribute("aria-describedby");
  }
  const messageEl = document.getElementById(id);
  if (messageEl && messageEl.classList.contains("sq-field__error")) {
    messageEl.textContent = "";
  }
}

/**
 * Progressive enhancement for a form: when native validation finds
 * problems on submit, moves focus to the first invalid field so
 * keyboard and screen-reader users land on the problem (native bubbles
 * still show — nothing is prevented or replaced). Idempotent per form.
 * Returns a cleanup function.
 *
 * Implementation note: the `submit` event does NOT fire when native
 * validation blocks submission, so this listens for `invalid` events
 * (capture phase — `invalid` does not bubble). All of a form's invalid
 * events fire synchronously in one task, so only the first focuses and
 * the rest are ignored until the next task.
 */
export function enhanceForm(form: HTMLFormElement): () => void {
  if (form.hasAttribute("data-sq-initialized")) {
    return () => undefined;
  }
  form.setAttribute("data-sq-initialized", "");
  const controller = new AbortController();
  let handling = false;
  form.addEventListener(
    "invalid",
    (event) => {
      if (handling) return;
      handling = true;
      setTimeout(() => {
        handling = false;
      }, 0);
      const target = event.target;
      if (target instanceof HTMLElement) {
        target.focus({ preventScroll: false });
      }
    },
    { signal: controller.signal, capture: true },
  );
  return () => {
    controller.abort();
  };
}
