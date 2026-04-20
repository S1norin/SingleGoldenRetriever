// --- Frontend Configuration (single source of truth) ---
// All values come from Vite env vars (prefixed with VITE_).
// Edit frontend/.env or pass via docker-compose.yml build args.

const splitCsv = (value) =>
  value
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

const config = {
  defaultUsername: import.meta.env.VITE_DEFAULT_USERNAME ?? "Daria",
  subscribedTopics: splitCsv(import.meta.env.VITE_SUBSCRIBED_TOPICS) ?? [
    "engineering",
    "release_ops",
    "product-updates",
  ],
  onlineUsers: splitCsv(import.meta.env.VITE_ONLINE_USERS).map(
    (username, index) => ({
      id: `user-${index + 1}`,
      username,
      status: index % 3 === 2 ? "offline" : "online",
    }),
  ),
  mockMessageCount:
    parseInt(import.meta.env.VITE_MOCK_MESSAGE_COUNT, 10) || 4,
};

// --- Data ---

export const defaultCurrentUser = config.defaultUsername;

export const mockSubscribedTopics = config.subscribedTopics;

export const mockMessages = [
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
    targetTopics: [
      "engineering",
      "product-updates",
      "qa",
      "release_ops",
      "ui-lab",
    ],
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
].slice(0, config.mockMessageCount);

export const mockOnlineUsers = config.onlineUsers;
