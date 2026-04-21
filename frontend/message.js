// frontend/message.js
const MessageDetail = {
  overlayEl: null,

  open(messageId, messages, users) {
    const message = messages.find((m) => m.id === messageId);
    if (!message) return;

    const recipients = this.recipientsForTopics(
      message.targetTopics,
      message.sender,
      users,
    );
    const html = this.renderHTML(message, recipients);

    this.overlayEl = document.createElement("div");
    this.overlayEl.className = "modal";
    this.overlayEl.innerHTML = html;

    // Close on overlay click (outside modal card)
    this.overlayEl.addEventListener("click", (e) => {
      if (e.target === this.overlayEl) {
        this.close();
      }
    });

    // Close on close button
    this.overlayEl.addEventListener("click", (e) => {
      if (e.target.closest("[data-action='close-modal']")) {
        this.close();
      }
    });

    document.body.appendChild(this.overlayEl);
  },

  close() {
    if (this.overlayEl) {
      this.overlayEl.remove();
      this.overlayEl = null;
    }
  },

  renderHTML(message, recipients) {
    const topicBadges = message.targetTopics
      .map((t) => `<span class="topic-badge">${Utils.escapeHtml(t)}</span>`)
      .join("");

    const recipientRows =
      recipients.length > 0
        ? recipients
            .map(
              (r) => `
              <div class="list-row">
                <div>
                  <div class="message-line"><strong>${Utils.escapeHtml(r.username)}</strong></div>
                  <div class="hint">topics: ${Utils.escapeHtml(r.matchedTopics.join(", "))}</div>
                </div>
                <div class="meta">${Utils.escapeHtml(r.status)}</div>
              </div>
            `,
            )
            .join("")
        : `<div class="empty-box">No recipients matched the selected topics.</div>`;

    const currentUser =
      localStorage.getItem("authUser") || Config.defaultUsername;

    return `
      <article class="modal-card" data-stop-close="true">
        <div class="modal-head">
          <div class="brand-block">
            <div class="subtitle">Detail View</div>
            <div class="brand-title">Message from ${Utils.escapeHtml(message.sender)}</div>
          </div>
          <button class="button" type="button" data-action="close-modal">Close</button>
        </div>
        <div class="modal-body stack">
          <div class="detail-box">
            <div class="message-line">${Utils.escapeHtml(message.text)}</div>
          </div>
          <div class="detail-grid">
            <div class="detail-box stack">
              <div class="section-title">All Topics</div>
              <div class="topic-badges">${topicBadges}</div>
            </div>
            <div class="detail-box stack">
              <div class="section-title">Message Path</div>
              <div class="flow-steps">
                <div class="flow-step">
                  <strong>${Utils.escapeHtml(message.sender)}</strong>
                  <div class="hint">producer</div>
                </div>
                <span class="flow-arrow">-&gt;</span>
                <div class="flow-step">
                  <strong>Single Kafka Topic</strong>
                  <div class="hint">shared stream</div>
                </div>
                <span class="flow-arrow">-&gt;</span>
                <div class="flow-step">
                  <strong>${Utils.escapeHtml(currentUser)}</strong>
                  <div class="hint">consumer</div>
                </div>
              </div>
            </div>
          </div>
          <div class="detail-box stack">
            <div class="section-title">Recipients (${recipients.length} tracked)</div>
            <div class="list list--compact">
              ${recipientRows}
            </div>
          </div>
        </div>
      </article>
    `;
  },

  recipientsForTopics(topics, sender, users) {
    return users
      .filter((user) => user.username !== sender)
      .filter(
        (user) =>
          Array.isArray(user.subscribedTopics) &&
          user.subscribedTopics.some((topic) => topics.includes(topic)),
      )
      .map((user) => ({
        username: user.username,
        status: user.status,
        matchedTopics: user.subscribedTopics.filter((topic) =>
          topics.includes(topic),
        ),
      }));
  },
};

window.MessageDetail = MessageDetail;
