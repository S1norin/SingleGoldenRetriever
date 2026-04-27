# Client — API Server + Kafka Client

FastAPI server that serves the frontend SPA and bridges the browser to Kafka. Handles message publishing, consumption, and persistence.

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| Python | 3.9 | Runtime |
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
│   ├── index.html
│   ├── app.js
│   └── style.css
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

Publishes a message to the `General` Kafka topic.

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

### POST /api/subscribe

Updates the consumer's topic subscription to listen for tag-specific messages.

**Request body:**
```json
{"tags": ["backend", "frontend"]}
```

**Response:**
```json
{"status": "subscribed", "topics": ["Heartbeat", "tag_6261636b656e64", "tag_66726f6e74656e64"]}
```

### GET /api/messages

Retrieves persisted messages, optionally filtered by user and tags.

**Query params:**
- `user` — filter by username
- `tags` — comma-separated list of tags to filter by

**Response:** Array of message objects.

### GET /api/online

Returns online/offline status of all users based on heartbeat timestamps.

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
  "message_flow": ["Producer_Sent", "Kafka_General_Received", "Consumer_Saved_Local_From_Tag"]
}
```

| Field | Type | Description |
|---|---|---|
| `user` | string | Username of the message author |
| `text` | string | Message content |
| `tags` | array | Channel tags for this message |
| `time_of_send` | string | ISO 8601 timestamp (UTC) |
| `message_flow` | array | Traces the message through the system |

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

The consumer uses a file lock for thread-safe reads/writes to `messages.json` and `heartbeat.json`.
