# Frontend — Single Kafka Messenger

React single-page application served by nginx. Built with Vite + Tailwind CSS.

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| React | 18.3 | UI library |
| Vite | 8.0 | Build tool & dev server |
| Tailwind CSS | 3.4 | Utility-first CSS |
| Nginx | Alpine | Production server (Docker) |

## Getting Started

```bash
cd frontend
npm install
npm run dev        # Dev server at http://localhost:5173
npm run build      # Production build → dist/
npm run preview    # Preview production build
```

## Project Structure

```
frontend/
├── App.jsx                  # Root component
├── main.jsx                 # Entry point
├── index.html               # HTML template
├── index.css                # Tailwind + custom CSS vars
├── mockData.js              # Mock data + env-based config
├── components/              # React components
│   ├── AuthPage.jsx         # Login screen
│   ├── FlowMonitor.jsx      # Message flow visualization
│   ├── LeftSidebar.jsx      # Topic subscriptions
│   ├── MessageComposer.jsx  # Message input
│   ├── MessageFeed.jsx      # Message list
│   ├── MessageModal.jsx     # Message detail
│   ├── MobileDrawer.jsx     # Mobile sidebar
│   └── RightSidebar.jsx     # Online users
├── utils/
│   └── topicUtils.js        # Topic sanitization & formatting
├── Dockerfile
├── nginx.conf
├── .env.example
└── vite.config.js
```

## Configuration

All settings come from Vite environment variables (`VITE_*` prefix).

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_DEFAULT_USERNAME` | `Daria` | Login page placeholder username |
| `VITE_SUBSCRIBED_TOPICS` | `engineering,release_ops,product-updates` | Comma-separated list of pre-subscribed topics |
| `VITE_ONLINE_USERS` | `Ava,Noah,Lena,Mateo,Daria` | Comma-separated list of mock online users |
| `VITE_MOCK_MESSAGE_COUNT` | `4` | Number of initial mock messages |

### Setting Values

**Local development:** Copy `.env.example` → `.env` and edit values.

```bash
cp .env.example .env
# edit .env
npm run dev
```

**Docker:** Pass as build args in `docker-compose.yml`:

```yaml
frontend:
  build:
    context: ./frontend
    args:
      VITE_DEFAULT_USERNAME: "Admin"
      VITE_SUBSCRIBED_TOPICS: "general,alerts"
```

## Production Build

```bash
npm run build
```

Output goes to `dist/`. The Docker image serves this directory via nginx with gzip compression and SPA routing support.

## Components

### AuthPage
Simple username/password login screen. Accepts any credentials.

### FlowMonitor
Visual pipeline showing message flow: `Producer → Single Kafka Topic → Consumer`. Updates in real-time as messages are sent.

### LeftSidebar
Topic management — join new topics, leave existing ones. Input is sanitized (lowercase, alphanumeric + hyphens/underscores only).

### MessageComposer
Topic checkboxes + message input. SEND MESSAGE is disabled until at least one topic is selected and text is entered.

### MessageFeed
Chronological message list. Each card shows sender, target topics, and message text. Click to expand.

### RightSidebar
Displays mock user presence (online/offline).
