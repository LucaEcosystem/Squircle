/**
 * Consumer app logic against the PUBLIC classic bundle only
 * (`window.Squircle` — no source-tree imports, no bundler).
 */
(function () {
  var form = document.getElementById("pickup-form");
  Squircle.initTheme();
  Squircle.init();
  Squircle.enhanceForm(form);
  // Reveal pre-rendered error messages when native validation flags a field.
  // (`submit` does not fire while validation blocks, so this listens for
  // `invalid` in capture phase, exactly like the real-world pattern.)
  form.addEventListener(
    "invalid",
    function (event) {
      if (!(event.target instanceof HTMLElement)) return;
      var input = event.target;
      var described = (input.getAttribute("aria-describedby") || "").split(
        /\s+/,
      );
      var valid = input.checkValidity();
      input.classList.toggle("sq-input--invalid", !valid);
      for (var i = 0; i < described.length; i++) {
        var id = described[i];
        if (!id.endsWith("-error")) continue;
        var message = document.getElementById(id);
        if (message) message.hidden = valid;
      }
    },
    true,
  );

  document.getElementById("toast-demo").addEventListener("click", function () {
    Squircle.notify("Manila 24mm restocked — 200 metres on the shelf.", {
      tone: "success",
    });
  });

  // Dynamic class construction: the tone suffix resolves at runtime.
  // squircle.config.json safelists every possible tone explicitly —
  // the trim report flags the pattern AND keeps the styles.
  var tones = ["success", "warning", "error"];
  var step = 0;
  var badge = document.getElementById("dynamic-badge");
  document.getElementById("tone-cycle").addEventListener("click", function () {
    var tone = tones[step % tones.length];
    step += 1;
    badge.className = "sq-badge sq-badge--" + tone;
    badge.textContent = "Tone: " + tone;
  });
})();
