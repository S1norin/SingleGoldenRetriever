# SingleGoldenRetriever

A real-time messaging app that channels all messages through a **single Kafka topic** (`General`) — no topic-per-channel overhead. A stream processor fans messages out to tag-specific topics, enabling client-side channel filtering.

## Architecture

```
┌──────────┐     POST /api/send      ┌──────────────┐
│  Browser  │ ──────────────────────▶ │   Client     │
│ (HTML/JS) │ ◀────────────────────── │ (FastAPI +   │
│ localhost │  GET /api/messages      │  Kafka)      │
└──────────┘                          └──────┬───────┘
                                             │ produce to "General"
                                             ▼
                                      ┌──────────────┐
                                      │  Kafka       │
                                      │  "General"   │
                                      └──────┬───────┘
                                             │
                              ┌──────────────┼──────────────┐
                              ▼              ▼              ▼
                      ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
                      │ Stream       │ │ Client       │ │ (other       │
                      │ Processor    │ │ Consumer     │ │ consumers)   │
                      │              │ │ (main.py)    │ │              │
                      └──────┬───────┘ └──────┬───────┘ └──────────────┘
                             │                 │
                             │ produces to     │ subscribes to
                             │ tag_<hex>       │ tag_<hex> topics
                             ▼                 │
                      ┌──────────────┐         │
                      │ Kafka        │◀────────┘
                      │ tag_<hex>    │
                      └──────────────┘
```

### How it works

1. **Browser** sends messages as JSON via `POST /api/send` to the **Client** service, tagging each message with channel tags.
2. **Client** publishes messages to the `General` Kafka topic and serves the static frontend SPA.
3. **Stream Processor** consumes from `General`, then fans each message out to tag-specific topics (e.g., `tag_6261636b656e64` for "backend") using hex-encoded topic names.
4. **Client consumer** subscribes to the user's tag topics, persists messages to local JSON files, and serves them via `GET /api/messages`.
5. **Auth Server** validates usernames against a static `users.txt` file and returns user tags for channel subscriptions.

> **Note:** The frontend polls REST endpoints for new messages and online status. In a production system, WebSocket push would replace polling.

## Features

- [x] Sending messages to multiple channels (topics) via tags
- [x] Joining / leaving channels (dynamic topic subscription)
- [x] Username authentication (no password — for demo purposes)
- [x] Online/offline status of users (heartbeat-based presence)
- [x] Visual message flow tracking (producer → topic → consumer)
- [x] All via a simple web UI!

## Quick Start

### Prerequisites

- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)

### One-liner (Docker)

```bash
docker compose up -d
```

This starts:

| Service | Port | Description |
|---|---|---|
| `kafka` | 9092 | Kafka broker |
| `auth-server` | 8001 | Authentication microservice |
| `client` | 8080 | API server + frontend + Kafka consumer/producer |
| `stream-processor` | — | Message router (headless) |

Open **http://localhost:8080** in your browser.

### Local Development

```bash
# 1. Start Kafka + all services
docker compose up -d

# 2. (Optional) Run individual services locally:
#    cd client && python -m uvicorn main:app --host 0.0.0.0 --port 8000
#    cd auth_server && python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

## Configuration

All configuration lives in `.env` files or Docker Compose defaults.

### Root `.env` (backend + Docker)

| Variable | Default | Description |
|---|---|---|
| `KAFKA_BOOTSTRAP_SERVERS` | `kafka:29092` | Kafka broker address. Use `kafka:29092` inside Docker, `localhost:9092` locally |
| `KAFKA_EXTERNAL_PORT` | `9092` | External port for Kafka broker (host:container mapping) |
| `AUTH_SERVER_EXTERNAL_PORT` | `8001` | External port for auth-server service |
| `CLIENT_EXTERNAL_PORT` | `8080` | External port for client service |

## Project Structure

```
├── auth_server/              # Authentication microservice
│   ├── main.py               # FastAPI user registry
│   ├── users.txt             # Static user→tags mapping
│   ├── Dockerfile
│   └── requirements.txt
├── client/                   # API server + frontend + Kafka client
│   ├── main.py               # FastAPI + Kafka producer/consumer
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── static/               # Vanilla HTML/CSS/JS frontend
│   │   ├── index.html        # Auth screen + chat UI
│   │   ├── app.js            # Client-side logic (login, send, poll)
│   │   └── style.css         # Dark theme (Catppuccin-inspired)
│   └── data/                 # Local JSON state (mounted as volume)
│       ├── messages.json
│       └── heartbeat.json
├── stream_processor/         # Kafka message fan-out service
│   ├── processor.py          # General → tag_<hex> router
│   ├── Dockerfile
│   └── requirements.txt
├── docker-compose.yml        # Orchestration (4 services)
├── .env.example
└── README.md
```

## License

MIT
