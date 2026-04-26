import json
import time
from confluent_kafka import Consumer, Producer
import os
import binascii

KAFKA_BROKER = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")

# Safely encode any string (including Cyrillic) into a valid Kafka topic name
def safe_topic(tag: str) -> str:
    return "tag_" + binascii.hexlify(tag.encode("utf-8")).decode("utf-8")

def main():
    consumer = Consumer({
        "bootstrap.servers": KAFKA_BROKER,
        "group.id": "stream-processor-group",
        "auto.offset.reset": "earliest",
        "log_level": 3  # 3 = ERROR ONLY (stops Kafka log spam)
    })
    
    producer = Producer({
        "bootstrap.servers": KAFKA_BROKER,
        "log_level": 3
    })
    
    consumer.subscribe(["General"])
    print("Stream Processor started. Listening to 'General'...")

    while True:
        msg = consumer.poll(1.0)
        if msg is None: continue
        if msg.error(): continue

        try:
            data = json.loads(msg.value().decode("utf-8"))
            
            if "message_flow" not in data:
                data["message_flow"] = []
            data["message_flow"].append("Stream_Processor_Processed")

            tags = data.get("tags", ["general"])
            payload = json.dumps(data).encode("utf-8")

            # Route to safely encoded topics
            for tag in tags:
                topic_name = safe_topic(tag)
                producer.produce(topic_name, payload)
            
            producer.flush() # Force immediate routing!

        except Exception as e:
            pass # Silently ignore bad data to keep logs clean

if __name__ == "__main__":
    main()