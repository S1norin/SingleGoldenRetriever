import os
import json
import time
from confluent_kafka import Consumer, KafkaError, KafkaException
from dotenv import load_dotenv

load_dotenv()

# Configuration
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
CHAT_TOPIC = os.getenv("CHAT_TOPIC", "user-messages")
GROUP_ID = "chat-consumer-group"


def main():
    # Consumer configuration
    conf = {
        "bootstrap.servers": KAFKA_BOOTSTRAP_SERVERS,
        "group.id": GROUP_ID,
        "auto.offset.reset": "earliest",
    }

    # Create Consumer instance
    consumer = Consumer(conf)

    try:
        # Subscribe to topic
        print(f"Subscribing to topic: {CHAT_TOPIC}")
        consumer.subscribe([CHAT_TOPIC])

        print("Waiting for messages... (Ctrl+C to stop)")

        while True:
            msg = consumer.poll(timeout=1.0)

            if msg is None:
                continue

            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    # End of partition event
                    print(f"Reached end of partition {msg.partition()}")
                elif msg.error().code() == KafkaError.UNKNOWN_TOPIC_OR_PART:
                    print(f"Topic {CHAT_TOPIC} not found yet, retrying in 5s...")
                    time.sleep(5)
                else:
                    # If it's a real error that might be transient, log and continue
                    # instead of raising KafkaException which crashes the loop
                    print(f"Consumer error: {msg.error()}")
                    time.sleep(1)
                continue
            else:
                # Successful message receipt
                try:
                    data = json.loads(msg.value().decode("utf-8"))
                    user = data.get("user", "Unknown")
                    text = data.get("text", "")
                    print(f"[CHAT] {user}: {text}")
                except json.JSONDecodeError:
                    print(f"Received non-JSON message: {msg.value().decode('utf-8')}")

    except KeyboardInterrupt:
        print("Consumer stopped by user.")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        # Close down consumer to commit final offsets.
        print("Closing consumer...")
        consumer.close()


if __name__ == "__main__":
    main()
