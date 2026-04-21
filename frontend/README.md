# Frontend

Static frontend for `SingleGoldenRetriever`.

This UI is built with plain `HTML`, `CSS`, and `JavaScript`. It does not require React, Vite, or any build step.

## Files

### Pages

- `login.html` — Login page (username only). Redirects to `main.html` on sign-in.
- `main.html` — Messenger page (feed, topics, composer, presence). Redirects to `login.html` if not authenticated.

### Scripts

- `config.js` — Central configuration. Toggle `useMockData` to switch between mock and real backend.
- `utils.js` — Shared utility functions (`escapeHtml`, `formatTime`, `sanitizeTopicInput`, etc.).
- `login.js` — Login form rendering, validation, and localStorage redirect.
- `main.js` — Messenger UI: feed, topics, composer, presence panel, mobile drawer, async data loading.
- `message.js` — Message detail overlay module (opens on click, shows flow path, topics, recipients).

### Styles

- `styles.css` — Layout and visual styles (dark theme, grid layout, components).

## Features

- **Login page** — Username-only authentication, stored in `localStorage`
- **Topic subscription management** — Join/remove topics, filter feed by subscribed topics
- **Message composer** — Select target topics, send messages (mock or real backend)
- **Online users panel** — Presence tracking (mock or real backend via polling)
- **Message detail overlay** — Click any message to see full details, flow path, and recipients
- **Mobile drawer** — Panels accessible via hamburger menu on small screens
- **Mock/Real toggle** — Change `Config.useMockData` in `config.js`

## Layout

- **Left:** subscribed topics (filter feed)
- **Center:** message feed
- **Right:** online users + producer (composer)
- **Overlay:** message detail (flow path, recipients)
- **Mobile:** hamburger menu opens drawer with panels

## Run

Open `login.html` in a browser.

If you want a local server instead of opening the file directly, run one from the `frontend` directory:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/login.html`.

## Configuration

Edit `config.js` to change behavior:

```javascript
// Toggle between mock data and real backend
useMockData: true,  // false = use real backend API

// Backend address (used when useMockData: false)
backendUrl: "http://localhost:8000",

// Polling interval for messages and presence (ms)
pollIntervalMs: 3000,

// Default username (pre-filled on login)
defaultUsername: "Daria",

// Default subscribed topics
defaultTopics: ["engineering", "release_ops", "product-updates"],
```

### Mock Mode (default)

Works without any backend server. Uses `Config.mockMessages` and `Config.mockUsers` as seed data.

### Real Backend Mode

Set `useMockData: false` and configure `backendUrl`. The frontend will:

1. `fetch(backendUrl + "/api/messages")` on page load
2. `fetch(backendUrl + "/api/users")` on page load
3. Poll both endpoints every `pollIntervalMs` milliseconds
4. `POST(backendUrl + "/api/messages")` when sending a message

## Architecture

```
login.html ──(submit)──→ localStorage.authUser ──(redirect)──→ main.html
                                                                        │
                                                                    message.js
                                                                    (overlay)
```

- `config.js` loads first — defines `window.Config`
- `utils.js` loads second — defines `window.Utils`
- `message.js` loads third — defines `window.MessageDetail` (no dependencies on other modules)
- `main.js` loads last — uses `Config`, `Utils`, and `MessageDetail`

## Notes

- Authentication is frontend-only (localStorage). No server-side auth yet.
- Message flow visualization is static (no animation) — shown in the message detail overlay.
- Recipients are derived from user topic subscriptions.

## Future Integration

To connect to a real backend:

1. Build an HTTP API server (Flask/FastAPI) on top of Kafka
2. Implement endpoints: `GET /api/messages`, `GET /api/users`, `POST /api/messages`
3. Set `useMockData: false` in `config.js`
4. Optionally replace polling with WebSockets for real-time updates
