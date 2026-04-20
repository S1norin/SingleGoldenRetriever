(function () {
  const app = document.getElementById("app");
  const flowTimeouts = new Set();

  const state = {
    authUser: null,
    authDraftUsername: "Daria",
    authDraftPassword: "",
    authError: "",
    subscribedTopics: ["engineering", "release_ops", "product-updates"],
    selectedTopics: ["engineering", "release_ops", "product-updates"],
    joinDraft: "",
    joinError: "",
    composerText: "",
    mobilePanel: null,
    activeMessageId: null,
    activeRecipientsFlowId: null,
    flowItems: [],
    messages: [
      {
        id: "message-1",
        sender: "Ava",
        text: "Consumer lag is back to zero after the rebalance.",
        targetTopics: ["engineering", "release_ops"],
        createdAt: "2026-04-18T09:15:00.000Z",
      },
      {
        id: "message-2",
        sender: "Noah",
        text: "Frontend build now groups single-topic traffic into channel views.",
        targetTopics: ["engineering", "product-updates", "qa", "release_ops", "ui-lab"],
        createdAt: "2026-04-18T08:40:00.000Z",
      },
      {
        id: "message-3",
        sender: "Lena",
        text: "QA signoff is blocked until the topic filter is easier to scan.",
        targetTopics: ["qa", "product-updates"],
        createdAt: "2026-04-18T08:05:00.000Z",
      },
      {
        id: "message-4",
        sender: "Mateo",
        text: "Release freeze starts at 18:00 UTC. Finish topic cleanup before then.",
        targetTopics: ["release_ops", "announcements", "leadership"],
        createdAt: "2026-04-18T07:45:00.000Z",
      },
    ],
    users: [
      {
        id: "user-1",
        username: "Ava",
        status: "online",
        subscribedTopics: ["engineering", "release_ops"],
      },
      {
        id: "user-2",
        username: "Noah",
        status: "online",
        subscribedTopics: ["engineering", "product-updates", "qa"],
      },
      {
        id: "user-3",
        username: "Lena",
        status: "offline",
        subscribedTopics: ["product-updates", "qa"],
      },
      {
        id: "user-4",
        username: "Mateo",
        status: "online",
        subscribedTopics: ["release_ops", "announcements"],
      },
      {
        id: "user-5",
        username: "Daria",
        status: "online",
        subscribedTopics: ["engineering", "release_ops", "product-updates"],
      },
    ],
  };

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      state.activeMessageId = null;
      state.activeRecipientsFlowId = null;
      state.mobilePanel = null;
      render();
    }
  });

  app.addEventListener("click", (event) => {
    const actionTarget = event.target.closest("[data-action]");

    if (!actionTarget && event.target.closest("[data-stop-close]")) {
      return;
    }

    if (!actionTarget) {
      return;
    }

    const { action, topic, messageId, panel } = actionTarget.dataset;

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
      state.subscribedTopics = state.subscribedTopics.filter((item) => item !== topic);
      state.selectedTopics = state.selectedTopics.filter((item) => item !== topic);
      render();
      return;
    }

    if (action === "open-message") {
      state.activeMessageId = messageId;
      render();
      return;
    }

    if (action === "open-recipients") {
      state.activeRecipientsFlowId = actionTarget.dataset.flowId;
      render();
      return;
    }

    if (action === "close-modal") {
      state.activeMessageId = null;
      state.activeRecipientsFlowId = null;
      render();
    }
  });

  app.addEventListener("submit", (event) => {
    const form = event.target;
    event.preventDefault();

    if (form.dataset.form === "auth") {
      const username = state.authDraftUsername.trim();
      const password = state.authDraftPassword.trim();

      if (!username || !password) {
        state.authError = "Enter username and password.";
        render();
        return;
      }

      state.authUser = { username };
      state.authError = "";
      syncPresence(username, "online");
      render();
      return;
    }

    if (form.dataset.form === "join-topic") {
      const sanitized = sanitizeTopicInput(state.joinDraft);

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
      state.composerText = "";
      startFlow(message);
      render();
    }
  });

  app.addEventListener("input", (event) => {
    const role = event.target.dataset.role;

    if (role === "auth-username") {
      state.authDraftUsername = event.target.value;
      return;
    }

    if (role === "auth-password") {
      state.authDraftPassword = event.target.value;
      return;
    }

    if (role === "join-draft") {
      state.joinDraft = event.target.value;
      state.joinError = "";
      const preview = app.querySelector("[data-role='join-preview']");
      const error = app.querySelector("[data-role='join-error']");
      if (preview) {
        preview.textContent = sanitizeTopicInput(state.joinDraft) || "topicname";
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
    if (event.target.dataset.role !== "topic-checkbox") {
      return;
    }

    const topic = event.target.dataset.topic;
    if (event.target.checked) {
      if (!state.selectedTopics.includes(topic)) {
        state.selectedTopics.push(topic);
      }
    } else {
      state.selectedTopics = state.selectedTopics.filter((item) => item !== topic);
    }

    render();
  });

  function render() {
    app.innerHTML = state.authUser ? renderApp() : renderAuth();
  }

  function renderAuth() {
    return `
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
                value="${escapeHtml(state.authDraftUsername)}"
                data-role="auth-username"
              />
            </label>
            <label class="field">
              <span>Password</span>
              <input
                class="input"
                type="password"
                value="${escapeHtml(state.authDraftPassword)}"
                data-role="auth-password"
              />
            </label>
            <p class="error ${state.authError ? "" : "hidden"}">${escapeHtml(state.authError)}</p>
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

  function renderApp() {
    return `
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
                  <div class="metric-box"><strong>User</strong> ${escapeHtml(currentUser())}</div>
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
          <section class="layout-area--flow">
            ${renderFlowPanel()}
          </section>
          <aside class="column layout-area--right desktop-only">
            ${renderRightWorkbench()}
          </aside>
        </div>
        ${renderDrawer()}
        ${renderModal()}
        ${renderRecipientsModal()}
      </div>
    `;
  }

  function renderRightWorkbench() {
    return `
      <div class="right-stack">
        ${renderRightSidebar("panel--presence")}
        ${renderProducerPanel()}
      </div>
    `;
  }

  function renderFlowPanel() {
    return `
      <section class="panel panel--flowbox">
        <div class="panel-section panel-section--flow">
          ${renderFlowMonitor()}
        </div>
      </section>
    `;
  }

  function renderLeftSidebar(extraClass = "") {
    const rows = state.subscribedTopics.length
      ? state.subscribedTopics
          .map(
            (topic) => `
              <div class="list-row">
                <span>${escapeHtml(topic)}</span>
                <button
                  class="button"
                  type="button"
                  data-action="remove-topic"
                  data-topic="${escapeHtml(topic)}"
                >
                  [x]
                </button>
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
              <input
                class="input"
                type="text"
                value="${escapeHtml(state.joinDraft)}"
                placeholder="Enter topic name..."
                data-role="join-draft"
              />
              <button class="button button--accent" type="submit">Join</button>
            </div>
            <div class="meta">
              Sanitized: <span data-role="join-preview">${escapeHtml(
                sanitizeTopicInput(state.joinDraft) || "topicname",
              )}</span>
            </div>
            <p class="error ${state.joinError ? "" : "hidden"}" data-role="join-error">
              ${escapeHtml(state.joinError)}
            </p>
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

  function renderFlowMonitor() {
    if (!state.flowItems.length) {
      return `
        <div class="flow-monitor">
          <div class="section-title">Live Flow</div>
        </div>
      `;
    }

    return `
      <div class="flow-monitor">
        <div class="section-title">Live Flow</div>
        <div class="flow-stack">
          ${state.flowItems.map(renderFlowCard).join("")}
        </div>
      </div>
    `;
  }

  function renderFlowCard(flow) {
    return `
      <article class="flow-card">
        <div class="flow-row">
          <div>
            <div class="message-line"><strong>${escapeHtml(flow.sender)}</strong> to ${escapeHtml(flow.targetTopics.join(", "))}</div>
            <div class="hint">${escapeHtml(flow.text)}</div>
          </div>
          <div class="flow-card-actions">
            <button
              class="metric-box metric-box--interactive"
              type="button"
              data-action="open-recipients"
              data-flow-id="${escapeHtml(flow.id)}"
            >
              <strong>${flow.recipients.length}</strong> tracked
            </button>
            <div class="metric-box"><strong>${escapeHtml(flow.statusLabel)}</strong></div>
          </div>
        </div>
        <div class="flow-steps">
          ${renderFlowStep(flow.sender, flow.stages.producer, flow.activeStage === "producer")}
          <span class="flow-arrow">-&gt;</span>
          ${renderFlowStep("Single Kafka Topic", flow.stages.topic, flow.activeStage === "topic")}
          <span class="flow-arrow">-&gt;</span>
          ${renderFlowStep(currentUser(), flow.stages.consumer, flow.activeStage === "consumer")}
        </div>
        <div class="progress">
          ${["producer", "topic", "consumer"]
            .map((stage) => {
              const status = flow.stages[stage];
              const modifier =
                status === "done"
                  ? "progress-bar--done"
                  : status === "active"
                    ? "progress-bar--active"
                    : "";
              return `<div class="progress-bar ${modifier}"></div>`;
            })
            .join("")}
        </div>
      </article>
    `;
  }

  function renderFlowStep(label, status, active) {
    const activeClass = active ? "flow-step--active" : "";
    const statusLabel =
      status === "done" ? "done" : status === "active" ? "active" : "waiting";

    return `
      <div class="flow-step ${activeClass}">
        <div><strong>${escapeHtml(label)}</strong></div>
        <div class="hint">${escapeHtml(statusLabel)}</div>
      </div>
    `;
  }

  function renderMessageFeed() {
    const messages = visibleMessages();

    if (!messages.length) {
      return `
        <div class="feed-stack">
          <div class="empty-box">No messages match the current subscription filter.</div>
        </div>
      `;
    }

    return `
      <div class="feed-stack">
        <div class="metric-box"><strong>Filtered for</strong> ${escapeHtml(currentUser())}</div>
        ${messages.map(renderMessageCard).join("")}
      </div>
    `;
  }

  function renderMessageCard(message) {
    const preview = formatTopicPreview(message.targetTopics);
    const topicBadges = renderTopicBadges(message.targetTopics);

    return `
      <button
        class="message-card"
        type="button"
        data-action="open-message"
        data-message-id="${escapeHtml(message.id)}"
      >
        <div class="message-head">
          <div class="message-author">
            <div class="message-name">${escapeHtml(message.sender)}</div>
            <div class="hint">User message</div>
          </div>
          <div class="message-time hint">${escapeHtml(formatTime(message.createdAt))}</div>
        </div>
        <div class="topic-badges">${topicBadges}</div>
        <p class="message-line"><strong>To:</strong> ${escapeHtml(preview)}</p>
        <p class="message-line">${escapeHtml(message.text)}</p>
      </button>
    `;
  }

  function renderComposer() {
    const checkboxes = state.subscribedTopics.length
      ? state.subscribedTopics
          .map(
            (topic) => `
              <label class="checkbox-item">
                <input
                  type="checkbox"
                  ${state.selectedTopics.includes(topic) ? "checked" : ""}
                  data-role="topic-checkbox"
                  data-topic="${escapeHtml(topic)}"
                />
                <span>${escapeHtml(topic)}</span>
              </label>
            `,
          )
          .join("")
      : `<span class="meta">Join a topic to enable sending.</span>`;

    const disabled = !state.composerText.trim() || state.selectedTopics.length === 0;

    return `
      <form class="stack" data-form="composer">
        <div class="panel-intro">
          <div class="section-title">Producer</div>
          <div class="hint">Select target topics and send into the shared stream.</div>
        </div>
        <div class="checkbox-line producer-topics">${checkboxes}</div>
        <textarea
          class="textarea"
          placeholder="Write a message..."
          data-role="composer-text"
        >${escapeHtml(state.composerText)}</textarea>
        <button
          class="button button--accent button--block"
          type="submit"
          data-role="send-button"
          ${disabled ? "disabled" : ""}
        >
          Send Message
        </button>
      </form>
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

  function renderRightSidebar(extraClass = "") {
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
          <div class="metric-box"><strong>${onlineUsersCount()}</strong> online users</div>
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
          ${escapeHtml(user.username)}
        </span>
        <span class="meta">${escapeHtml(user.status)}</span>
      </div>
    `;
  }

  function renderDrawer() {
    if (!state.mobilePanel) {
      return "";
    }

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

  function renderModal() {
    const message = state.messages.find((item) => item.id === state.activeMessageId);
    if (!message) {
      return "";
    }

    return `
      <div class="modal" data-action="close-modal">
        <article class="modal-card" data-stop-close="true">
          <div class="modal-head">
            <div class="brand-block">
              <div class="subtitle">Detail View</div>
              <div class="brand-title">Message from ${escapeHtml(message.sender)}</div>
            </div>
            <button class="button" type="button" data-action="close-modal">Close</button>
          </div>
          <div class="modal-body stack">
            <div class="detail-box">
              <div class="message-line">${escapeHtml(message.text)}</div>
            </div>
            <div class="detail-grid">
              <div class="detail-box stack">
                <div class="section-title">All Topics</div>
                <div class="topic-badges">${message.targetTopics
                  .map((topic) => `<span class="topic-badge">${escapeHtml(topic)}</span>`)
                  .join("")}</div>
              </div>
              <div class="detail-box stack">
                <div class="section-title">Message Flow</div>
                <div class="flow-steps">
                  <div class="flow-step"><strong>${escapeHtml(message.sender)}</strong><div class="hint">producer</div></div>
                  <span class="flow-arrow">-&gt;</span>
                  <div class="flow-step"><strong>Single Kafka Topic</strong><div class="hint">shared stream</div></div>
                  <span class="flow-arrow">-&gt;</span>
                  <div class="flow-step"><strong>${escapeHtml(currentUser())}</strong><div class="hint">consumer</div></div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    `;
  }

  function startFlow(message) {
    const flowId = `flow-${Date.now()}`;
    const recipients = recipientsForTopics(message.targetTopics, message.sender);
    const flow = {
      id: flowId,
      sender: message.sender,
      text: message.text,
      targetTopics: [...message.targetTopics],
      recipients,
      activeStage: "producer",
      statusLabel: "Producing",
      stages: {
        producer: "active",
        topic: "waiting",
        consumer: "waiting",
      },
    };

    state.flowItems = [flow, ...state.flowItems].slice(0, 5);

    const topicTimeout = window.setTimeout(() => {
      state.flowItems = state.flowItems.map((item) =>
        item.id === flowId
          ? {
              ...item,
              activeStage: "topic",
              statusLabel: "In Topic",
              stages: {
                producer: "done",
                topic: "active",
                consumer: "waiting",
              },
            }
          : item,
      );
      flowTimeouts.delete(topicTimeout);
      render();
    }, 500);

    const consumerTimeout = window.setTimeout(() => {
      state.flowItems = state.flowItems.map((item) =>
        item.id === flowId
          ? {
              ...item,
              activeStage: "consumer",
              statusLabel: "Delivered",
              stages: {
                producer: "done",
                topic: "done",
                consumer: "done",
              },
            }
          : item,
      );
      flowTimeouts.delete(consumerTimeout);
      render();
    }, 1100);

    flowTimeouts.add(topicTimeout);
    flowTimeouts.add(consumerTimeout);
  }

  function logout() {
    if (state.authUser) {
      syncPresence(state.authUser.username, "offline");
      state.authDraftUsername = state.authUser.username;
    }

    state.authUser = null;
    state.authDraftPassword = "";
    state.authError = "";
    state.activeMessageId = null;
    state.activeRecipientsFlowId = null;
    state.mobilePanel = null;
    state.flowItems = [];

    flowTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
    flowTimeouts.clear();

    render();
  }

  function syncPresence(username, status) {
    const existing = state.users.find((user) => user.username === username);

    if (existing) {
      existing.status = status;
      return;
    }

    state.users.unshift({
      id: `user-${Date.now()}`,
      username,
      status,
      subscribedTopics: [...state.subscribedTopics],
    });
  }

  function visibleMessages() {
    return state.messages.filter((message) =>
      message.targetTopics.some((topic) => state.subscribedTopics.includes(topic)),
    );
  }

  function currentUser() {
    return state.authUser ? state.authUser.username : state.authDraftUsername || "Daria";
  }

  function sanitizeTopicInput(value) {
    return value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  }

  function formatTopicPreview(topics) {
    if (topics.length <= 3) {
      return topics.join(", ");
    }

    return `${topics.slice(0, 3).join(", ")}, +${topics.length - 3} more`;
  }

  function renderTopicBadges(topics) {
    const preview = topics.slice(0, 3);
    const hidden = topics.length - preview.length;

    return [
      ...preview.map((topic) => `<span class="topic-badge">${escapeHtml(topic)}</span>`),
      ...(hidden > 0 ? [`<span class="topic-badge topic-badge--muted">+${hidden} more</span>`] : []),
    ].join("");
  }

  function onlineUsersCount() {
    return state.users.filter((user) => user.status === "online").length;
  }

  function formatTime(value) {
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function recipientsForTopics(topics, sender) {
    return state.users
      .filter((user) => user.username !== sender)
      .filter(
        (user) =>
          Array.isArray(user.subscribedTopics) &&
          user.subscribedTopics.some((topic) => topics.includes(topic)),
      )
      .map((user) => ({
        username: user.username,
        status: user.status,
        matchedTopics: user.subscribedTopics.filter((topic) => topics.includes(topic)),
      }));
  }

  function renderRecipientsModal() {
    const flow = state.flowItems.find((item) => item.id === state.activeRecipientsFlowId);
    if (!flow) {
      return "";
    }

    const recipientRows = flow.recipients.length
      ? flow.recipients
          .map(
            (recipient) => `
              <div class="list-row">
                <div>
                  <div class="message-line"><strong>${escapeHtml(recipient.username)}</strong></div>
                  <div class="hint">topics: ${escapeHtml(recipient.matchedTopics.join(", "))}</div>
                </div>
                <div class="meta">${escapeHtml(recipient.status)}</div>
              </div>
            `,
          )
          .join("")
      : `<div class="empty-box">No recipients matched the selected topics.</div>`;

    return `
      <div class="modal" data-action="close-modal">
        <article class="modal-card" data-stop-close="true">
          <div class="modal-head">
            <div class="brand-block">
              <div class="subtitle">Recipients</div>
              <div class="brand-title">${flow.recipients.length} tracked</div>
            </div>
            <button class="button" type="button" data-action="close-modal">Close</button>
          </div>
          <div class="modal-body stack">
            <div class="detail-box">
              <div class="message-line"><strong>Message</strong></div>
              <div class="hint">${escapeHtml(flow.text)}</div>
            </div>
            <div class="list list--compact">
              ${recipientRows}
            </div>
          </div>
        </article>
      </div>
    `;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  render();
})();
