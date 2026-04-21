// frontend/login.js
(function () {
  const app = document.getElementById("app");
  let draftUsername = Config.defaultUsername;

  function render() {
    app.innerHTML = `
      <div class="auth-shell">
        <section class="auth-card">
          <div class="auth-head">
            <div class="brand-block">
              <div class="subtitle">SingleGoldenRetriever</div>
              <h1 class="brand-title">Sign in to the messenger</h1>
              <div class="hint">One shared Kafka topic. Clean channel-style view.</div>
            </div>
          </div>
          <form class="auth-body stack" data-form="auth">
            <label class="field">
              <span>Username</span>
              <input
                class="input"
                type="text"
                value="${Utils.escapeHtml(draftUsername)}"
                data-role="auth-username"
                autofocus
              />
            </label>
            <p class="error hidden" data-role="auth-error"></p>
            <div class="auth-actions">
              <button class="button button--accent button--block" type="submit">
                Sign In
              </button>
            </div>
          </form>
        </section>
      </div>
    `;
  }

  function showError(message) {
    const errorEl = app.querySelector("[data-role='auth-error']");
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove("hidden");
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    const username = draftUsername.trim();

    if (!username) {
      showError("Enter a username.");
      return;
    }

    localStorage.setItem("authUser", username);
    window.location.href = "main.html";
  }

  function handleInput(event) {
    const role = event.target.dataset.role;
    if (role === "auth-username") {
      draftUsername = event.target.value;
    }
  }

  app.addEventListener("submit", handleSubmit);
  app.addEventListener("input", handleInput);
  render();
})();
