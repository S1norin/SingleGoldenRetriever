# Client — API Server + Kafka Client

FastAPI server that serves the frontend SPA and bridges the browser to Kafka. Handles message publishing, consumption, persistence, and dynamic topic subscription management.

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| Python | 3.9+ | Runtime |
| confluent-kafka | — | Kafka client (librdkafka bindings) |
| fastapi | — | REST API framework |
| uvicorn | — | ASGI server |
| pydantic | — | Request/response validation |

## Files

```
client/
├── main.py               # FastAPI server + Kafka producer/consumer
├── Dockerfile
├── requirements.txt
├── static/               # Vanilla HTML/CSS/JS frontend
│   ├── index.html        # Login screen + chat UI with 3-panel layout
│   ├── app.js            # Client-side logic (login, send, poll, subscribe/unsubscribe)
│   └── style.css         # Dark theme (Catppuccin-inspired)
└── data/                 # Local JSON persistence
    ├── messages.json
    └── heartbeat.json
```

## Configuration

All settings via environment variables (or `.env` file). Loaded via `os.getenv()` in `main.py`.

| Variable | Default | Description |
|---|---|---|
| `KAFKA_BOOTSTRAP_SERVERS` | `kafka:29092` | Kafka broker address |

### Local `.env`

```bash
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
```

## API Endpoints

### POST /api/send

Publishes a message to the `General` Kafka topic. The message is tagged and routed through the stream processor to tag-specific topics.

**Request body:**
```json
{
  "user": "Nikita",
  "text": "Hello everyone!",
  "tags": ["general", "backend"]
}
```

**Response:**
```json
{"status": "sent"}
```

### POST /api/heartbeat

Publishes a heartbeat to the `Heartbeat` Kafka topic for presence tracking.

**Request body:**
```json
{"user": "Nikita"}
```

**Response:**
```json
{"status": "alive"}
```

**Kafka message format (published to `Heartbeat` topic):**
```json
{"user": "Nikita", "timestamp": 1710000000.0}
```

| Field | Type | Description |
|---|---|---|
| `user` | string | Username from request |
| `timestamp` | float | Unix timestamp (seconds) when heartbeat was sent |

### POST /api/subscribe

Adds topics to the consumer's subscription list. Used when a user subscribes to new tags via the frontend.

**Request body:**
```json
{"tags": ["backend", "frontend"]}
```

**Response:**
```json
{"status": "subscribed", "topics": ["Heartbeat", "tag_6261636b656e64", "tag_66726f6e74656e64"]}
```

### POST /api/unsubscribe

Removes topics from the consumer's subscription list. Used when a user unsubscribes from tags via the frontend.

**Request body:**
```json
{"tags": ["backend"]}
```

**Response:**
```json
{"status": "unsubscribed", "topics": ["Heartbeat", "tag_66726f6e74656e64"]}
```

### GET /api/messages

Retrieves persisted messages, optionally filtered by user and tags. Messages are returned in reverse chronological order (newest first).

**Query params:**
- `user` — filter by username
- `tags` — comma-separated list of tags to filter by

**Response:** Array of message objects.

**Filtering rules:**
1. **Authorship** — Users always see their own messages
2. **Public broadcast** — Messages tagged with `general` are visible to everyone
3. **Shared tags** — Users see messages from tags they share with the author

### GET /api/online

Returns online/offline status of all users based on heartbeat timestamps (60-second window).

**Response:**
```json
[
  {"user": "Nikita", "status": "online", "last_seen": 1710000000.0}
]
```

## Message Format

Messages are JSON-encoded with the following structure:

```json
{
  "user": "Nikita",
  "text": "Hello from Docker!",
  "tags": ["general", "backend"],
  "time_of_send": "2024-01-15T10:30:00.000000",
  "message_flow": [
    "Producer sent to general",
    "Stream_Processor_Processed",
    "Consumer received message from topic tag_6261636b656e64"
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `user` | string | Username of the message author |
| `text` | string | Message content |
| `tags` | array | Channel tags for this message |
| `time_of_send` | string | ISO 8601 timestamp (UTC) |
| `message_flow` | array | Traces the message through the system (producer → stream processor → consumer) |

### Message Flow

1. **Producer sent to general** — Frontend sends message to `POST /api/send`, which publishes to Kafka `General` topic
2. **Stream_Processor_Processed** — Stream processor consumes from `General` and fans out to tag-specific topics (e.g., `tag_6261636b656e64` for "backend")
3. **Consumer received message from topic tag_\<hex\>** — Client consumer receives from subscribed tag topics and persists to `messages.json`

### Topic Naming

Tags are hex-encoded for safe Kafka topic names. This supports Cyrillic and other Unicode characters:

- `general` → `tag_67656e6572616c`
- `backend` → `tag_6261636b656e64`
- `Олег` → `tag_d09ed0bbd0b5d0b3`

## Frontend

The frontend is a vanilla HTML/CSS/JS single-page application with three panels:

- **Left sidebar** — Shows subscribed tags with `×` remove buttons, plus a subscribe form (`+` button)
- **Center** — Message feed (newest first) with composer (custom tags input, message input, send button)
- **Right sidebar** — Active users list with online/offline status

### Polling Intervals

| Data | Interval | Endpoint |
|---|---|---|
| Messages | 2s | `GET /api/messages` |
| Online users | 5s | `GET /api/online` |
| Heartbeat | 5s | `POST /api/heartbeat` |

## Docker

```bash
docker compose up client
```

The container runs `uvicorn main:app --host 0.0.0.0 --port 8000` by default. The Dockerfile installs `librdkafka-dev` as a build dependency for the Confluent client.

## How It Works

The client service runs three components simultaneously:

1. **FastAPI server** — handles REST API requests and serves the static frontend SPA
2. **Kafka producer** — publishes messages to `General` and `Heartbeat` topics
3. **Kafka consumer** — runs as a daemon thread, subscribes to tag-specific topics, and persists messages to local JSON files

### Dynamic Subscription

The consumer subscribes to topics dynamically based on user tags:
- On login, the frontend calls `POST /api/subscribe` with the user's tags
- The consumer updates its subscription and starts receiving messages for those tags
- Users can add/remove tags via the frontend, which triggers `POST /api/subscribe` or `POST /api/unsubscribe`
- The `general` tag is always preserved (cannot be unsubscribed)

### Thread Safety

- The consumer uses a file lock (`threading.Lock()`) for thread-safe reads/writes to `messages.json` and `heartbeat.json`
- The consumer re-subscribes to topics when `subscription_changed` flag is set (via subscribe/unsubscribe API)
- Duplicate messages are prevented by checking `time_of_send` + `user` before appending to the messages file
