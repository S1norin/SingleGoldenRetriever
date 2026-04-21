// frontend/main.js
(function () {
  const app = document.getElementById("app");

  // ── State ─────────────────────────────────────────────────
  let state = {
    messages: [],
    users: [],
    subscribedTopics: [...Config.defaultTopics],
    selectedTopics: [...Config.defaultTopics],
    joinDraft: "",
    joinError: "",
    composerText: "",
    mobilePanel: null,
  };

  // ── Auth Check ────────────────────────────────────────────
  const authUser = localStorage.getItem("authUser");
  if (!authUser) {
    window.location.href = "login.html";
  }

  // ── Data Loading ──────────────────────────────────────────
  async function loadData() {
    if (Config.useMockData) {
      state.messages = [...Config.mockMessages];
      state.users = [...Config.mockUsers];
    } else {
      try {
        const [messagesRes, usersRes] = await Promise.all([
          fetch(Config.backendUrl + Config.api.messages),
          fetch(Config.backendUrl + Config.api.users),
        ]);
        state.messages = await messagesRes.json();
        state.users = await usersRes.json();
      } catch (e) {
        console.error("Failed to load data:", e);
      }
    }
  }

  // ── Polling (when useMockData: false) ─────────────────────
  let pollTimer = null;

  function startPolling() {
    pollTimer = setInterval(async () => {
      if (!Config.useMockData) {
        try {
          const [messagesRes, usersRes] = await Promise.all([
            fetch(Config.backendUrl + Config.api.messages),
            fetch(Config.backendUrl + Config.api.users),
          ]);
          state.messages = await messagesRes.json();
          state.users = await usersRes.json();
        } catch (e) {
          console.error("Polling failed:", e);
        }
      }
    }, Config.pollIntervalMs);
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  // ── Render ────────────────────────────────────────────────
  function render() {
    app.innerHTML = `
      <div class="app-shell">
        <header class="topbar mobile-only">
          <div class="brand-block">
            <div class="subtitle">SingleGoldenRetriever</div>
            <div class="brand-title">Messenger</div>
          </div>
          <div class="header-actions">
            <button class="button" type="button" data-action="logout">Sign out</button>
            <button class="button" type="button" data-action="open-panel" data-panel="left">Panels</button>
            <button class="button" type="button" data-action="open-panel" data-panel="producer">Send</button>
          </div>
        </header>
        <div class="layout">
          <aside class="column layout-area--left desktop-only">
            ${renderLeftSidebar("panel--topics")}
          </aside>
          <main class="column layout-area--center">
            <section class="panel">
              <div class="topbar desktop-only">
                <div class="brand-block">
                  <div class="subtitle">SingleGoldenRetriever</div>
                  <div class="brand-title">Single Kafka Messenger</div>
                  <div class="hint">Realtime flow, topic filters, one shared stream.</div>
                </div>
                <div class="metrics-row">
                  <div class="metric-box"><strong>User</strong> ${Utils.escapeHtml(currentUser())}</div>
                  <div class="metric-box"><strong>Visible</strong> ${visibleMessages().length}</div>
                  <div class="metric-box"><strong>Topics</strong> ${state.subscribedTopics.length}</div>
                  <button class="button" type="button" data-action="logout">Sign out</button>
                </div>
              </div>
              <section class="feed">
                ${renderMessageFeed()}
              </section>
            </section>
          </main>
          <aside class="column layout-area--right desktop-only">
            <div class="right-stack">
              ${renderRightSidebar("panel--presence")}
              ${renderProducerPanel()}
            </div>
          </aside>
        </div>
        ${renderDrawer()}
      </div>
    `;
  }

  // ── Sub-renderers ─────────────────────────────────────────
  function renderLeftSidebar(extraClass) {
    const rows =
      state.subscribedTopics.length > 0
        ? state.subscribedTopics
            .map(
              (topic) => `
                <div class="list-row">
                  <span>${Utils.escapeHtml(topic)}</span>
                  <button class="button" type="button" data-action="remove-topic" data-topic="${Utils.escapeHtml(topic)}">[x]</button>
                </div>
              `,
            )
            .join("")
        : `<div class="empty-box">No subscriptions yet.</div>`;

    return `
      <section class="panel ${extraClass}">
        <div class="panel-section stack">
          <div class="panel-intro">
            <div class="section-title">Subscribed Topics</div>
            <div class="hint">Join channels and use them as the global feed filter.</div>
          </div>
          <form class="stack" data-form="join-topic">
            <div class="split">
              <input class="input" type="text" value="${Utils.escapeHtml(state.joinDraft)}" placeholder="Enter topic name..." data-role="join-draft" />
              <button class="button button--accent" type="submit">Join</button>
            </div>
            <div class="meta">
              Sanitized: <span data-role="join-preview">${Utils.escapeHtml(sanitizeTopicPreview(state.joinDraft) || "topicname")}</span>
            </div>
            <p class="error ${state.joinError ? "" : "hidden"}" data-role="join-error">${Utils.escapeHtml(state.joinError)}</p>
          </form>
        </div>
        <div class="panel-body panel-body--spread">
          <div class="metric-box"><strong>${state.subscribedTopics.length}</strong> active topics</div>
          <div class="list">${rows}</div>
          <div class="hint">Global feed filter.</div>
        </div>
      </section>
    `;
  }

  function renderRightSidebar(extraClass) {
    return `
      <section class="panel ${extraClass}">
        <div class="panel-section">
          <div class="panel-intro">
            <div class="section-title">Online Now</div>
            <div class="hint">Presence is tracked separately from messages.</div>
          </div>
        </div>
        <div class="panel-body panel-body--spread">
          <div class="list">
            ${state.users.map(renderUserRow).join("")}
          </div>
          <div class="metric-box"><strong>${Utils.onlineUsersCount(state.users)}</strong> online users</div>
        </div>
      </section>
    `;
  }

  function renderUserRow(user) {
    const online = user.status === "online";
    return `
      <div class="list-row">
        <span>
          <span class="presence-dot ${online ? "presence-dot--online" : ""}"></span>
          ${Utils.escapeHtml(user.username)}
        </span>
        <span class="meta">${Utils.escapeHtml(user.status)}</span>
      </div>
    `;
  }

  function renderProducerPanel() {
    return `
      <section class="panel panel--producer">
        <div class="panel-body">
          ${renderComposer()}
        </div>
      </section>
    `;
  }

  function renderComposer() {
    const checkboxes =
      state.subscribedTopics.length > 0
        ? state.subscribedTopics
            .map(
              (topic) => `
                <label class="checkbox-item">
                  <input type="checkbox" ${state.selectedTopics.includes(topic) ? "checked" : ""} data-role="topic-checkbox" data-topic="${Utils.escapeHtml(topic)}" />
                  <span>${Utils.escapeHtml(topic)}</span>
                </label>
              `,
            )
            .join("")
        : `<span class="meta">Join a topic to enable sending.</span>`;

    const disabled =
      !state.composerText.trim() || state.selectedTopics.length === 0;

    return `
      <form class="stack" data-form="composer">
        <div class="panel-intro">
          <div class="section-title">Producer</div>
          <div class="hint">Select target topics and send into the shared stream.</div>
        </div>
        <div class="checkbox-line producer-topics">${checkboxes}</div>
        <textarea class="textarea" placeholder="Write a message..." data-role="composer-text">${Utils.escapeHtml(state.composerText)}</textarea>
        <button class="button button--accent button--block" type="submit" data-role="send-button" ${disabled ? "disabled" : ""}>
          Send Message
        </button>
      </form>
    `;
  }

  function renderDrawer() {
    if (!state.mobilePanel) return "";

    const title = state.mobilePanel === "producer" ? "Producer" : "Panels";
    const body =
      state.mobilePanel === "producer"
        ? renderProducerPanel()
        : `
          <div class="right-stack">
            ${renderLeftSidebar("")}
            ${renderRightSidebar("")}
          </div>
        `;

    return `
      <div class="drawer-layer mobile-only">
        <button class="drawer-overlay" type="button" data-action="close-panel"></button>
        <aside class="drawer">
          <div class="drawer-head">
            <div class="section-title">${title}</div>
            <button class="button" type="button" data-action="close-panel">Close</button>
          </div>
          <div class="drawer-body">${body}</div>
        </aside>
      </div>
    `;
  }

  function renderMessageFeed() {
    const messages = visibleMessages();

    if (messages.length === 0) {
      return `<div class="feed-stack"><div class="empty-box">No messages match the current subscription filter.</div></div>`;
    }

    return `
      <div class="feed-stack">
        <div class="metric-box"><strong>Filtered for</strong> ${Utils.escapeHtml(currentUser())}</div>
        ${messages.map(renderMessageCard).join("")}
      </div>
    `;
  }

  function renderMessageCard(message) {
    const preview = Utils.formatTopicPreview(message.targetTopics);
    const topicBadges = message.targetTopics
      .map((topic) => `<span class="topic-badge">${Utils.escapeHtml(topic)}</span>`)
      .join("");

    return `
      <button class="message-card" type="button" data-action="open-message" data-message-id="${message.id}">
        <div class="message-head">
          <div class="message-author">
            <div class="message-name">${Utils.escapeHtml(message.sender)}</div>
            <div class="hint">User message</div>
          </div>
          <div class="message-time hint">${Utils.formatTime(message.createdAt)}</div>
        </div>
        <div class="topic-badges">${topicBadges}</div>
        <p class="message-line"><strong>To:</strong> ${preview}</p>
        <p class="message-line">${Utils.escapeHtml(message.text)}</p>
      </button>
    `;
  }

  // ── Event Handlers ────────────────────────────────────────
  app.addEventListener("click", (event) => {
    const actionTarget = event.target.closest("[data-action]");
    if (!actionTarget) return;

    const { action, topic, panel } = actionTarget.dataset;

    if (action === "logout") {
      logout();
      return;
    }

    if (action === "open-panel") {
      state.mobilePanel = panel;
      render();
      return;
    }

    if (action === "close-panel") {
      state.mobilePanel = null;
      render();
      return;
    }

    if (action === "remove-topic") {
      state.subscribedTopics = state.subscribedTopics.filter(
        (item) => item !== topic,
      );
      state.selectedTopics = state.selectedTopics.filter(
        (item) => item !== topic,
      );
      render();
      return;
    }

    if (action === "open-message") {
      const messageId = actionTarget.dataset.messageId;
      MessageDetail.open(messageId, state.messages, state.users);
      return;
    }
  });

  app.addEventListener("submit", (event) => {
    const form = event.target;
    event.preventDefault();

    if (form.dataset.form === "join-topic") {
      const sanitized = sanitizeTopicPreview(state.joinDraft);
      if (!sanitized) {
        state.joinError = "Use letters, numbers, hyphens, or underscores.";
        render();
        return;
      }
      if (state.subscribedTopics.includes(sanitized)) {
        state.joinError = "Already subscribed.";
        render();
        return;
      }
      state.subscribedTopics.push(sanitized);
      state.selectedTopics.push(sanitized);
      state.joinDraft = "";
      state.joinError = "";
      state.mobilePanel = null;
      render();
      return;
    }

    if (form.dataset.form === "composer") {
      const text = state.composerText.trim();
      if (!text || state.selectedTopics.length === 0) {
        render();
        return;
      }

      const message = {
        id: `message-${Date.now()}`,
        sender: currentUser(),
        text,
        targetTopics: [...state.selectedTopics],
        createdAt: new Date().toISOString(),
      };

      state.messages.unshift(message);

      // Send to real backend if not using mock data
      if (!Config.useMockData) {
        fetch(Config.backendUrl + Config.api.send, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: message.sender,
            text: message.text,
            targetTopics: message.targetTopics,
          }),
        }).catch((e) => console.error("Failed to send message:", e));
      }

      state.composerText = "";
      render();
    }
  });

  app.addEventListener("input", (event) => {
    const role = event.target.dataset.role;

    if (role === "join-draft") {
      state.joinDraft = event.target.value;
      state.joinError = "";
      const preview = app.querySelector("[data-role='join-preview']");
      const error = app.querySelector("[data-role='join-error']");
      if (preview) {
        preview.textContent = sanitizeTopicPreview(state.joinDraft) || "topicname";
      }
      if (error) {
        error.textContent = "";
        error.classList.add("hidden");
      }
      return;
    }

    if (role === "composer-text") {
      state.composerText = event.target.value;
      const sendButton = app.querySelector("[data-role='send-button']");
      if (sendButton) {
        sendButton.disabled =
          !state.composerText.trim() || state.selectedTopics.length === 0;
      }
    }
  });

  app.addEventListener("change", (event) => {
    if (event.target.dataset.role !== "topic-checkbox") return;

    const topic = event.target.dataset.topic;
    if (event.target.checked) {
      if (!state.selectedTopics.includes(topic)) {
        state.selectedTopics.push(topic);
      }
    } else {
      state.selectedTopics = state.selectedTopics.filter(
        (item) => item !== topic,
      );
    }
    render();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      state.mobilePanel = null;
      MessageDetail.close();
      render();
    }
  });

  // ── Business Logic ────────────────────────────────────────
  function visibleMessages() {
    return state.messages.filter((message) =>
      message.targetTopics.some((topic) =>
        state.subscribedTopics.includes(topic),
      ),
    );
  }

  function currentUser() {
    return localStorage.getItem("authUser") || Config.defaultUsername;
  }

  function sanitizeTopicPreview(value) {
    return value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  }

  function onlineUsersCount() {
    return Utils.onlineUsersCount(state.users);
  }

  function logout() {
    localStorage.removeItem("authUser");
    stopPolling();
    MessageDetail.close();
    window.location.href = "login.html";
  }

  // ── Init ──────────────────────────────────────────────────
  loadData().then(render);
  if (!Config.useMockData) startPolling();
})();
