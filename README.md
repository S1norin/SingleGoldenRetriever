# SingleGoldenRetriever

A real-time messaging app that channels all messages through a **single Kafka topic** — no topic-per-channel overhead, just one unified stream with client-side filtering.

## Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Frontend    │────▶│   Kafka Broker   │────▶│   Consumer   │
│  (HTML/CSS/JS)│◀────│  (single topic)  │◀────│  (Python)    │
│  localhost    │     │  user-messages   │     │  chat-app    │
└──────────────┘     └──────────────────┘     └──────────────┘
```

### How it works

1. **Frontend** sends messages as JSON to the single `user-messages` Kafka topic, tagging each with target topics (channels).
2. **Consumer** (Python) reads messages from the topic and prints them to stdout — in a real deployment this would push to a WebSocket endpoint for live updates.
3. **Frontend** displays messages in a live feed, filtered by the user's subscribed topics.

> **Note:** The frontend does not produce directly to Kafka in this demo — it simulates message production and displays messages from mock data. A real implementation would use a backend API to bridge the frontend and Kafka.

## Features

- [x] Sending messages to multiple channels (topics)
- [x] Joining / leaving channels
- [x] Username + password login (password required but not validated — for demo purposes)
- [x] Online/offline status of users (mock presence)
- [x] Visual message flow monitor (producer → topic → consumer)
- [x] All via a simple web UI!

## Quick Start

### Prerequisites

- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)
- Python 3.9+ (for local backend development)

### One-liner (Docker)

```bash
docker compose up -d
```

This starts:
| Service | Port | Description |
|---|---|---|
| `kafka` | 9092 | Kafka broker |
| `app` | — | Python consumer |
| `frontend` | — | Vanilla HTML/CSS/JS (served by nginx) |

Open **http://localhost:8000** in your browser (local dev) or configure a port mapping in `docker-compose.yml`.

### Local Development

```bash
# 1. Start Kafka + consumer
docker compose up kafka

# 2. In another terminal, start the consumer
cd app && python consumer.py

# 3. In another terminal, start a local server for the frontend
cd frontend && python -m http.server 8000
```

The frontend dev server runs on **http://localhost:8000**.

## Configuration

All configuration lives in `.env` files or Docker build args.

### Root `.env` (backend)

| Variable | Default | Description |
|---|---|---|
| `KAFKA_BOOTSTRAP_SERVERS` | `kafka:29092` | Kafka broker address |
| `CHAT_TOPIC` | `user-messages` | Kafka topic name |
| `GROUP_ID` | `chat-consumer-group` | Consumer group ID |
| `LOG_LEVEL` | `INFO` | Logging level |

### Frontend (see `frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_DEFAULT_USERNAME` | `Maria` | Login placeholder |
| `VITE_SUBSCRIBED_TOPICS` | `engineering,release_ops,product-updates` | Pre-subscribed topics |
| `VITE_ONLINE_USERS` | `Ava,Noah,Lena,Mateo,Daria` | Mock online users |
| `VITE_MOCK_MESSAGE_COUNT` | `4` | Initial messages count |

## Project Structure

```
├── app/                    # Python backend
│   ├── consumer.py         # Kafka consumer (prints messages)
│   ├── producer.py         # Kafka producer (demo messages)
│   ├── config.py           # Pydantic settings
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/               # Vanilla HTML/CSS/JS
│   ├── index.html          # Entry point
│   ├── styles.css          # Design system (792 lines)
│   ├── script.js           # State + rendering (940 lines)
│   └── .env                # Frontend configuration
├── docker-compose.yml      # Orchestration
├── .env.example
└── README.md
```

## License

MIT
