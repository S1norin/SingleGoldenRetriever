# App — Kafka Consumer / Producer

Python backend for reading from and writing to a single Kafka topic. Uses the Confluent Kafka client library with Pydantic settings.

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| Python | 3.9+ | Runtime |
| confluent-kafka | — | Kafka client |
| pydantic-settings | — | Environment-based config |
| python-dotenv | — | `.env` file loading |

## Files

```
app/
├── config.py      # Pydantic Settings — reads .env / env vars
├── consumer.py    # Kafka consumer — subscribes to topic, prints messages
├── producer.py    # Kafka producer — demo script, sends sample messages
├── requirements.txt
└── Dockerfile
```

## Configuration

All settings via environment variables (or `.env` file). Loaded automatically by `config.py`.

| Variable | Default | Description |
|---|---|---|
| `KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` | Kafka broker address |
| `CHAT_TOPIC` | `user-messages` | Topic to subscribe to / produce to |
| `GROUP_ID` | `chat-consumer-group` | Consumer group ID |
| `LOG_LEVEL` | `INFO` | Logging level |

### Local `.env`

```bash
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
CHAT_TOPIC=user-messages
GROUP_ID=chat-consumer-group
LOG_LEVEL=INFO
```

## Usage

### Install

```bash
pip install -r requirements.txt
```

### Run Consumer

```bash
python consumer.py
```

Subscribes to the configured topic and prints received messages in the format:

```
[CHAT] Alice: Hello everyone!
```

### Run Producer (demo)

```bash
python producer.py
```

Sends 4 sample messages with 2-second intervals. Each message is a JSON object:

```json
{"user": "Alice", "text": "Hey everyone!"}
```

## Docker

```bash
docker compose up app
```

The container runs `python consumer.py` by default. The Dockerfile installs `librdkafka-dev` as a build dependency for the Confluent client.

## Message Format

Messages are JSON-encoded with the following structure:

```json
{
  "user": "Daria",
  "text": "Hello from Docker frontend!"
}
```

| Field | Type | Description |
|---|---|---|
| `user` | string | Username of the message author |
| `text` | string | Message content |

> **Note:** The `targetTopics` field is produced by the frontend and included in the JSON payload, but the Python consumer does not process it — it only extracts and prints `user` and `text`. Topic filtering is handled entirely on the frontend side.
