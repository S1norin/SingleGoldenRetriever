// frontend/config.js
const Config = {
  // ─── Backend Toggle ───────────────────────────────────────
  // Set to false to use real backend API (requires server)
  useMockData: true,

  // ─── Backend Address (for future HTTP API) ────────────────
  backendUrl: "http://localhost:8000",

  // ─── Polling (when useMockData: false) ────────────────────
  pollIntervalMs: 3000, // milliseconds between polls

  // ─── Default Auth ─────────────────────────────────────────
  defaultUsername: "Daria",

  // ─── Default Subscribed Topics ────────────────────────────
  defaultTopics: ["engineering", "release_ops", "product-updates"],

  // ─── Mock Data ────────────────────────────────────────────
  mockMessages: [
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

  mockUsers: [
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

  // ─── API Endpoints (future backend) ───────────────────────
  api: {
    messages: "/api/messages",
    users: "/api/users",
    send: "/api/messages",
    joinTopic: "/api/topics/join",
    leaveTopic: "/api/topics/leave",
  },
};

window.Config = Config;
