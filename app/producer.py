import json
import time
from confluent_kafka import Producer
from config import settings


def delivery_report(err, msg):
    """Called once for each message produced to indicate delivery result."""
    if err is not None:
        print(f"Message delivery failed: {err}")
    else:
        print(f"Message delivered to {msg.topic()} [{msg.partition()}]")


def main():
    # Producer configuration
    conf = {
        "bootstrap.servers": settings.kafka_bootstrap_servers,
    }

    # Create Producer instance
    producer = Producer(conf)

    print(f"Starting Producer. Sending messages to topic: {settings.kafka_topic}")
    print(f"Broker: {settings.kafka_bootstrap_servers}")

    try:
        # Simulate chat messages
        messages = [
            {"user": "Alice", "text": "Hey everyone!"},
            {"user": "Bob", "text": "Hello Alice!"},
            {"user": "Charlie", "text": "How is the Kafka setup going?"},
            {"user": "Alice", "text": "It's going great, thanks!"},
        ]

        for msg_data in messages:
            # Convert dict to JSON string
            payload = json.dumps(msg_data)

            # Produce message
            producer.produce(
                settings.kafka_topic, payload.encode("utf-8"), callback=delivery_report
            )

            # Serve delivery callbacks from previous calls
            producer.poll(0)

            print(f"Sent: {payload}")
            time.sleep(2)  # Wait a bit between messages

    except KeyboardInterrupt:
        print("Producer stopped by user.")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        # Wait for any outstanding messages to be delivered
        print("Flushing producer...")
        producer.flush()


if __name__ == "__main__":
    main()
