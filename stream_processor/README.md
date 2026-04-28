# Stream Processor — Kafka Message Fan-Out Service

Stateless Kafka consumer that reads messages from the `General` topic and fans them out to tag-specific topics. Enables client-side channel filtering by routing messages to `tag_<hex>` topics.

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| Python | 3.10 | Runtime |
| confluent-kafka | — | Kafka client (librdkafka bindings) |

## Files

```
stream_processor/
├── Dockerfile          # Python 3.10-slim, installs librdkafka build deps
├── processor.py        # Kafka consumer → producer fan-out
└── requirements.txt    # confluent-kafka
```

## Purpose

The stream processor is the heart of the distributed messaging architecture. It enables efficient client-side filtering by:

1. **Consuming** all messages from a single `General` topic
2. **Routing** each message to tag-specific topics (e.g., `tag_backend`, `tag_frontend`)
3. **Appending** to the `message_flow` trace for debugging

This allows clients to subscribe only to tags they care about, rather than receiving all messages.

## How It Works

### 1. Consume

The processor consumes from the `General` topic:

```python
consumer = Consumer({
    "bootstrap.servers": KAFKA_BROKER,
    "group.id": "stream-processor-group",
    "auto.offset.reset": "earliest",
    "log_level": 3
})
consumer.subscribe(["General"])
```

### 2. Parse & Trace

Each message is parsed as JSON, and `"Stream_Processor_Processed"` is appended to the `message_flow` array:

```python
data = json.loads(msg.value().decode("utf-8"))
if "message_flow" not in data:
    data["message_flow"] = []
data["message_flow"].append("Stream_Processor_Processed")
```

### 3. Fan-Out

The message is routed to tag-specific topics using hex-encoded names:

```python
tags = data.get("tags", ["general"])
for tag in tags:
    topic_name = safe_topic(tag)
    producer.produce(topic_name, json.dumps(data).encode("utf-8"))
producer.flush()
```

### 4. Flush

`producer.flush()` ensures all messages are immediately delivered to Kafka.

## Topic Naming

Tags are hex-encoded for safe Kafka topic names. This supports Cyrillic and other Unicode characters:

```python
def safe_topic(tag: str) -> str:
    return "tag_" + binascii.hexlify(tag.encode("utf-8")).decode("utf-8")
```

| Tag | Topic |
|---|---|
| `general` | `tag_67656e6572616c` |
| `backend` | `tag_6261636b656e64` |
| `frontend` | `tag_66726f6e74656e64` |
| `Олег` | `tag_d09ed0bbd0b5d0b3` |
| `ACLMT` | `tag_41434c4d54` |

## Message Flow Trace

The processor appends to the `message_flow` array, creating a debug trace:

```json
{
  "user": "Nikita",
  "text": "Hello!",
  "tags": ["general", "backend"],
  "time_of_send": "2024-01-15T10:30:00.000000",
  "message_flow": [
    "Producer sent to general",
    "Stream_Processor_Processed",
    "Consumer received message from topic tag_6261636b656e64"
  ]
}
```

The trace shows:
1. **Producer sent to general** — Client service published to `General` topic
2. **Stream_Processor_Processed** — Stream processor routed to tag topics
3. **Consumer received from topic tag_\<hex\>** — Client consumer received from subscribed topic

## Docker

```bash
docker compose up stream-processor
```

The container:
1. Installs `gcc` and `libc6-dev` for `confluent-kafka` build dependencies
2. Installs Python dependencies from `requirements.txt`
3. Runs `python processor.py`

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` | Kafka broker address |

## Dependencies

```
confluent-kafka    # Kafka client (librdkafka bindings)
```

## Configuration

### Consumer Settings

```python
consumer = Consumer({
    "bootstrap.servers": KAFKA_BROKER,
    "group.id": "stream-processor-group",
    "auto.offset.reset": "earliest",
    "log_level": 3
})
```

| Setting | Value | Purpose |
|---|---|---|
| `group.id` | `stream-processor-group` | Single consumer group |
| `auto.offset.reset` | `earliest` | Process all messages from beginning |
| `log_level` | `3` | ERROR only (reduces Kafka log spam) |

### Producer Settings

```python
producer = Producer({
    "bootstrap.servers": KAFKA_BROKER,
    "log_level": 3
})
```

| Setting | Value | Purpose |
|---|---|---|
| `log_level` | `3` | ERROR only |

## Message Format

### Input (from `General` topic)

```json
{
  "user": "Nikita",
  "text": "Hello!",
  "tags": ["general", "backend"],
  "time_of_send": "2024-01-15T10:30:00.000000",
  "message_flow": ["Producer sent to general"]
}
```

### Output (to `tag_<hex>` topics)

```json
{
  "user": "Nikita",
  "text": "Hello!",
  "tags": ["general", "backend"],
  "time_of_send": "2024-01-15T10:30:00.000000",
  "message_flow": [
    "Producer sent to general",
    "Stream_Processor_Processed"
  ]
}
```

The same payload is sent to each tag-specific topic.

## Design Decisions

1. **Single consumer group** — Only one stream processor instance runs at a time
2. **Hex-encoded topics** — Supports Cyrillic and Unicode tags safely
3. **Silent error handling** — Bad messages are dropped without logging
4. **Immediate flush** — `producer.flush()` ensures no messages are lost
5. **Stateless** — No persistence, only routing

## Limitations

1. **No retry logic** — Failed messages are silently dropped
2. **No monitoring** — No metrics or health checks
3. **Single instance** — Cannot scale horizontally (single consumer group)
4. **No schema validation** — Malformed JSON is silently ignored
5. **No dead letter queue** — Failed messages have nowhere to go

## Error Handling

```python
try:
    # Process message
except Exception as e:
    pass # Silently ignore bad data to keep logs clean
```

Bad messages are silently ignored to keep logs clean. This is acceptable for a distributed system where message loss is tolerable.

## Scaling

Currently the stream processor runs as a single instance. To scale horizontally:

1. **Multiple instances** — Run multiple processors with the same `group.id` (Kafka will partition messages)
2. **Load balancing** — Each processor handles a subset of messages
3. **Fault tolerance** — If one instance fails, others continue processing

However, with the current architecture (single `General` topic), a single instance is sufficient for most use cases.
