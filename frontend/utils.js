// frontend/utils.js
const Utils = {
  escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  },

  formatTime(value) {
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  },

  sanitizeTopicInput(value) {
    return value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  },

  formatTopicPreview(topics) {
    if (topics.length <= 3) return topics.join(", ");
    return `${topics.slice(0, 3).join(", ")}, +${topics.length - 3} more`;
  },

  onlineUsersCount(users) {
    return users.filter((user) => user.status === "online").length;
  },
};

window.Utils = Utils;
