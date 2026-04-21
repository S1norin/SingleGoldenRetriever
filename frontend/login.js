// frontend/login.js
(function () {
  const form = document.querySelector("[data-form='auth']");
  const usernameInput = document.querySelector("[data-role='auth-username']");
  const errorEl = document.querySelector("[data-role='auth-error']");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();

    if (!username) {
      errorEl.textContent = "Enter a username.";
      errorEl.classList.remove("hidden");
      return;
    }

    localStorage.setItem("authUser", username);
    window.location.href = "main.html";
  });
})();
