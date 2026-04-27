import json
import os
import time
import threading
import binascii
from datetime import datetime
from fastapi import FastAPI, Query
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from confluent_kafka import Producer, Consumer
from pydantic import BaseModel

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

KAFKA_BROKER = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:29092")

DATA_DIR = "/app/data"
os.makedirs(DATA_DIR, exist_ok=True)
MESSAGES_FILE = os.path.join(DATA_DIR, "messages.json")
HEARTBEAT_FILE = os.path.join(DATA_DIR, "heartbeat.json")

# Prevent Race Conditions!
file_lock = threading.Lock()

with file_lock:
    for f in [MESSAGES_FILE, HEARTBEAT_FILE]:
        if not os.path.exists(f) or os.path.getsize(f) == 0:
            with open(f, "w") as file:
                json.dump([], file)

class MessagePayload(BaseModel):
    user: str
    text: str
    tags: list

class HeartbeatPayload(BaseModel):
    user: str

class SubscribePayload(BaseModel):
    tags: list

def safe_topic(tag: str) -> str:
    return "tag_" + binascii.hexlify(tag.encode("utf-8")).decode("utf-8")

active_topics = ["Heartbeat"]
subscription_changed = False

producer = Producer({
    "bootstrap.servers": KAFKA_BROKER,
    "log_level": 3
})

@app.post("/api/send")
def send_message(payload: MessagePayload):
    msg_data = {
        "user": payload.user,
        "text": payload.text,
        "tags": payload.tags,
        "time_of_send": datetime.utcnow().isoformat(),
        "message_flow": ["Producer sent to general"] 
    }
    producer.produce("General", json.dumps(msg_data).encode("utf-8"))
    producer.flush()
    return {"status": "sent"}

@app.post("/api/heartbeat")
def send_heartbeat(payload: HeartbeatPayload):
    hb_data = {"user": payload.user, "timestamp": time.time()}
    producer.produce("Heartbeat", json.dumps(hb_data).encode("utf-8"))
    producer.flush()
    return {"status": "alive"}
    
@app.post("/api/subscribe")
def update_subscription(payload: SubscribePayload):
    global active_topics, subscription_changed
    # Add new tags to the global listening pool (for shared backends)
    new_topics = [safe_topic(t) for t in payload.tags]
    active_topics = list(set(active_topics + new_topics))
    subscription_changed = True
    return {"status": "subscribed", "topics": active_topics}

@app.get("/api/messages")
def get_messages(user: str = "", tags: str = ""):
    with file_lock:
        try:
            with open(MESSAGES_FILE, "r") as f:
                msgs = json.load(f)
        except json.JSONDecodeError:
            msgs = []

    # If the frontend passes a user and tags, filter the messages!
    if user and tags:
        # The tags this specific user is allowed to see
        user_tags = set([t.strip() for t in tags.split(",")])
        filtered_msgs = []
        
        for m in msgs:
            # The tags attached to the message
            msg_tags = set(m.get("tags", []))
            
            # Rule 1: Did I write this message? (Always see your own messages)
            is_author = (m.get("user") == user)
            
            # Rule 2: Is it a public broadcast? (Tagged 'general' or has no tags)
            is_public = "general" in msg_tags or len(msg_tags) == 0
            
            # Rule 3: Do we share a specific tag? (e.g. we both have 'frontend')
            shares_tag = bool(user_tags & msg_tags)
            
            # If any of these are true, the user is allowed to see it!
            if is_author or is_public or shares_tag:
                filtered_msgs.append(m)
                
        return filtered_msgs
    
    return msgs

@app.get("/api/online")
def get_online_users():
    with file_lock:
        try:
            with open(HEARTBEAT_FILE, "r") as f:
                heartbeats = json.load(f)
        except json.JSONDecodeError:
            heartbeats = []
    
    current_time = time.time()
    users_status = []
    for hb in heartbeats:
        is_online = (current_time - hb["timestamp"]) < 60
        users_status.append({
            "user": hb["user"],
            "status": "online" if is_online else "offline",
            "last_seen": hb["timestamp"]
        })
    return users_status

def consumer_worker():
    global active_topics, subscription_changed
    
    consumer = Consumer({
        "bootstrap.servers": KAFKA_BROKER,
        "group.id": "client-local-writer",
        "auto.offset.reset": "earliest",
        "log_level": 3
    })
    
    consumer.subscribe(active_topics) 

    while True:
        if subscription_changed:
            consumer.subscribe(active_topics)
            subscription_changed = False

        msg = consumer.poll(1.0)
        if msg is None or msg.error(): continue
        
        topic = msg.topic()
        if topic.startswith("__"): continue

        try:
            data = json.loads(msg.value().decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            continue

        if topic == "Heartbeat":
            with file_lock:
                try:
                    with open(HEARTBEAT_FILE, "r") as f: hbs = json.load(f)
                except json.JSONDecodeError:
                    hbs = []
                
                hbs = [h for h in hbs if h["user"] != data.get("user")]
                hbs.append(data)
                
                with open(HEARTBEAT_FILE, "w") as f: json.dump(hbs, f)

        elif topic != "General":
            if "message_flow" not in data: data["message_flow"] = []
            data["message_flow"].append(f"Consumer_Saved_Local_From_Tag")
            
            with file_lock:
                try:
                    with open(MESSAGES_FILE, "r") as f: msgs = json.load(f)
                except json.JSONDecodeError:
                    msgs = []

                if not any(m.get("time_of_send") == data.get("time_of_send") and m.get("user") == data.get("user") for m in msgs):
                    msgs.append(data)
                    with open(MESSAGES_FILE, "w") as f: json.dump(msgs, f)

threading.Thread(target=consumer_worker, daemon=True).start()
app.mount("/", StaticFiles(directory="static", html=True), name="static")
