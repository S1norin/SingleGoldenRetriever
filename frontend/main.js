// frontend/main.js
(function () {
  // ── State ─────────────────────────────────────────────────
  let state = {
    messages: [],
    users: [],
    subscribedTopics: [...Config.defaultTopics],
    selectedTopics: [...Config.defaultTopics],
    mobilePanel: null,
  };

  // ── Auth Check ────────────────────────────────────────────
  if (!localStorage.getItem("authUser")) {
    window.location.href = "login.html";
  }

  // ── DOM References ────────────────────────────────────────
  const feed = document.querySelector("[data-role='feed']");
  const topicsList = document.querySelector("[data-role='topics-list']");
  const usersList = document.querySelector("[data-role='users-list']");
  const producerTopics = document.querySelector("[data-role='producer-topics']");
  const currentUserEl = document.querySelector("[data-role='current-user']");
  const visibleCountEl = document.querySelector("[data-role='visible-count']");
  const topicCountEl = document.querySelector("[data-role='topic-count']");
  const drawer = document.querySelector("[data-role='drawer']");
  const drawerTitle = document.querySelector("[data-role='drawer-title']");
  const drawerPanels = document.querySelector("[data-role='drawer-panels']");
  const drawerProducer = document.querySelector("[data-role='drawer-producer']");
  const drawerTopicsList = document.querySelector("[data-role='drawer-topics-list']");
  const drawerUsersList = document.querySelector("[data-role='drawer-users-list']");
  const drawerProducerTopics = document.querySelector("[data-role='drawer-producer-topics']");
  const drawerSendButton = document.querySelector("[data-role='drawer-send-button']");
  const onlineCountEl = document.querySelector(".panel--presence .metric-box strong");

  // ── Render Functions ──────────────────────────────────────
  function renderTopics() {
    topicsList.innerHTML =
      state.subscribedTopics.length > 0
        ? state.subscribedTopics
            .map(
              (t) => `
              <div class="list-row">
                <span>${Utils.escapeHtml(t)}</span>
                <button class="button" type="button" data-action="remove-topic" data-topic="${Utils.escapeHtml(t)}">[x]</button>
              </div>
            `,
            )
            .join("")
        : `<div class="empty-box">No subscriptions yet.</div>`;
    topicCountEl.textContent = state.subscribedTopics.length;
    const drawerTopics = document.querySelector("[data-role='drawer-topics-list']");
    if (drawerTopics) drawerTopics.innerHTML = topicsList.innerHTML;
  }

  function renderUsers() {
    usersList.innerHTML = state.users
      .map((u) => {
        const online = u.status === "online";
        return `
          <div class="list-row">
            <span>
              <span class="presence-dot ${online ? "presence-dot--online" : ""}"></span>
              ${Utils.escapeHtml(u.username)}
            </span>
            <span class="meta">${Utils.escapeHtml(u.status)}</span>
          </div>
        `;
      })
      .join("");
    document.querySelectorAll("[data-role='online-count']").forEach((el) => {
      el.textContent = Utils.onlineUsersCount(state.users);
    });
  }

  function renderFeed() {
    const visible = state.messages.filter((m) =>
      m.targetTopics.some((t) => state.subscribedTopics.includes(t)),
    );
    visibleCountEl.textContent = visible.length;

    if (visible.length === 0) {
      feed.innerHTML = `<div class="empty-box">No messages match the current subscription filter.</div>`;
      return;
    }

    feed.innerHTML = `
      <div class="feed-stack">
        <div class="metric-box"><strong>Filtered for</strong> ${Utils.escapeHtml(currentUser())}</div>
        ${visible.map(renderMessageCard).join("")}
      </div>
    `;
  }

  function renderMessageCard(msg) {
    const preview = Utils.formatTopicPreview(msg.targetTopics);
    const badges = msg.targetTopics
      .map((t) => `<span class="topic-badge">${Utils.escapeHtml(t)}</span>`)
      .join("");
    return `
      <button class="message-card" type="button" data-action="open-message" data-message-id="${msg.id}">
        <div class="message-head">
          <div class="message-author">
            <div class="message-name">${Utils.escapeHtml(msg.sender)}</div>
            <div class="hint">User message</div>
          </div>
          <div class="message-time hint">${Utils.formatTime(msg.createdAt)}</div>
        </div>
        <div class="topic-badges">${badges}</div>
        <p class="message-line"><strong>To:</strong> ${preview}</p>
        <p class="message-line">${Utils.escapeHtml(msg.text)}</p>
      </button>
    `;
  }

  function renderProducerCheckboxes() {
    producerTopics.innerHTML =
      state.subscribedTopics.length > 0
        ? state.subscribedTopics
            .map(
              (t) => `
              <label class="checkbox-item">
                <input type="checkbox" ${state.selectedTopics.includes(t) ? "checked" : ""} data-role="topic-checkbox" data-topic="${Utils.escapeHtml(t)}" />
                <span>${Utils.escapeHtml(t)}</span>
              </label>
            `,
            )
            .join("")
        : `<span class="meta">Join a topic to enable sending.</span>`;
  }

  function renderDrawer() {
    if (!state.mobilePanel) {
      drawer.classList.add("hidden");
      return;
    }
    drawer.classList.remove("hidden");
    drawerTitle.textContent =
      state.mobilePanel === "producer" ? "Producer" : "Panels";
    drawerPanels.classList.toggle("hidden", state.mobilePanel !== "left");
    drawerProducer.classList.toggle("hidden", state.mobilePanel !== "producer");

    // Populate drawer lists from main page (HTML strings, event delegation handles clicks)
    drawerTopicsList.innerHTML = topicsList.innerHTML;
    drawerUsersList.innerHTML = usersList.innerHTML;
    drawerProducerTopics.innerHTML = producerTopics.innerHTML;

    // Sync send button disabled state
    drawerSendButton.disabled = state.selectedTopics.length === 0;
  }

  function fullRender() {
    currentUserEl.textContent = currentUser();
    renderTopics();
    renderUsers();
    renderFeed();
    renderProducerCheckboxes();
    renderDrawer();
  }

  // ── Event Handlers ────────────────────────────────────────
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const { action, topic, panel } = btn.dataset;

    if (action === "logout") {
      localStorage.removeItem("authUser");
      window.location.href = "login.html";
    }

    if (action === "open-panel") {
      state.mobilePanel = panel;
      renderDrawer();
    }

    if (action === "close-panel") {
      state.mobilePanel = null;
      renderDrawer();
    }

    if (action === "remove-topic") {
      state.subscribedTopics = state.subscribedTopics.filter((t) => t !== topic);
      state.selectedTopics = state.selectedTopics.filter((t) => t !== topic);
      fullRender();
    }

    if (action === "open-message") {
      MessageDetail.open(btn.dataset.messageId, state.messages, state.users);
    }
  });

  document.addEventListener("submit", (e) => {
    const form = e.target;
    if (!form.dataset.form) return;
    e.preventDefault();

    if (form.dataset.form === "join-topic") {
      const draftInput = form.querySelector("[data-role='join-draft']");
      const previewSpan = form.querySelector("[data-role='join-preview']");
      const errorEl = form.querySelector("[data-role='join-error']");
      const sanitized = draftInput.value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "");

      if (!sanitized) {
        errorEl.textContent = "Use letters, numbers, hyphens, or underscores.";
        errorEl.classList.remove("hidden");
        return;
      }
      if (state.subscribedTopics.includes(sanitized)) {
        errorEl.textContent = "Already subscribed.";
        errorEl.classList.remove("hidden");
        return;
      }

      state.subscribedTopics.push(sanitized);
      state.selectedTopics.push(sanitized);
      draftInput.value = "";
      errorEl.textContent = "";
      errorEl.classList.add("hidden");
      state.mobilePanel = null;
      fullRender();
      return;
    }

    if (form.dataset.form === "composer") {
      const textarea = form.querySelector(
        "[data-role='composer-text'], [data-role='drawer-composer-text']",
      );
      const text = textarea.value.trim();
      if (!text || state.selectedTopics.length === 0) return;

      const msg = {
        id: `message-${Date.now()}`,
        sender: currentUser(),
        text,
        targetTopics: [...state.selectedTopics],
        createdAt: new Date().toISOString(),
      };
      state.messages.unshift(msg);
      textarea.value = "";
      fullRender();
    }
  });

  document.addEventListener("input", (e) => {
    if (e.target.dataset.role === "join-draft") {
      const form = e.target.closest("form");
      const previewSpan = form.querySelector("[data-role='join-preview']");
      const errorEl = form.querySelector("[data-role='join-error']");
      const sanitized = e.target.value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "");
      previewSpan.textContent = sanitized || "topicname";
      errorEl.textContent = "";
      errorEl.classList.add("hidden");
    }

    if (
      e.target.dataset.role === "composer-text" ||
      e.target.dataset.role === "drawer-composer-text"
    ) {
      const form = e.target.closest("form");
      const sendBtn = form.querySelector(
        "[data-role='send-button'], [data-role='drawer-send-button']",
      );
      sendBtn.disabled =
        !e.target.value.trim() || state.selectedTopics.length === 0;
    }
  });

  document.addEventListener("change", (e) => {
    if (e.target.dataset.role !== "topic-checkbox") return;
    const topic = e.target.dataset.topic;
    if (e.target.checked) {
      if (!state.selectedTopics.includes(topic)) {
        state.selectedTopics.push(topic);
      }
    } else {
      state.selectedTopics = state.selectedTopics.filter((t) => t !== topic);
    }
    fullRender();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      state.mobilePanel = null;
      MessageDetail.close();
      renderDrawer();
    }
  });

  // ── Utilities ─────────────────────────────────────────────
  function currentUser() {
    return localStorage.getItem("authUser") || Config.defaultUsername;
  }

  // ── Init ──────────────────────────────────────────────────
  state.messages = [...Config.mockMessages];
  state.users = [...Config.mockUsers];
  fullRender();
})();
