import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

USERS_FILE = "users.txt"

# Auto-create the file with defaults if it doesn't exist to prevent 500 errors
if not os.path.exists(USERS_FILE):
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        f.write("Nikita:general,Олег,ACLMT,backend\n")
        f.write("Alice:general,frontend\n")
        f.write("Bob:general,Олег\n")


def load_users():
    users_db = {}
    try:
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                # Skip empty lines or malformed lines without a colon
                if not line or ":" not in line:
                    continue

                user, tags_str = line.split(":", 1)
                # Split tags by comma, clean whitespace, and ignore empties
                tags = [t.strip() for t in tags_str.split(",") if t.strip()]
                users_db[user.strip()] = tags
        return users_db
    except Exception as e:
        print(f"Error reading {USERS_FILE}: {e}")
        return None


@app.get("/auth")
def authenticate(user: str):
    users_db = load_users()

    if users_db is None:
        raise HTTPException(
            status_code=500, detail="Database error: Cannot read users.txt"
        )

    if user in users_db:
        return {"user": user, "tags": users_db[user]}
    else:
        raise HTTPException(
            status_code=401, detail="User is not registered in the system."
        )


def save_users(users_db):
    tmp_file = USERS_FILE + ".tmp"
    with open(tmp_file, "w", encoding="utf-8") as f:
        for u, tags in users_db.items():
            f.write(f"{u}:{','.join(tags)}\n")
    os.replace(tmp_file, USERS_FILE)


@app.put("/auth/subscribe")
def add_subscription(user: str = Query(...), tag: str = Query(...)):
    users_db = load_users()
    if users_db is None:
        raise HTTPException(
            status_code=500, detail="Database error: Cannot read users.txt"
        )
    if user not in users_db:
        raise HTTPException(status_code=404, detail=f"User '{user}' not found.")
    if tag in users_db[user]:
        raise HTTPException(status_code=400, detail=f"Tag '{tag}' already subscribed.")
    users_db[user].append(tag)
    save_users(users_db)
    return {"user": user, "tags": users_db[user]}


@app.put("/auth/unsubscribe")
def remove_subscription(user: str = Query(...), tag: str = Query(...)):
    users_db = load_users()
    if users_db is None:
        raise HTTPException(
            status_code=500, detail="Database error: Cannot read users.txt"
        )
    if user not in users_db:
        raise HTTPException(status_code=404, detail=f"User '{user}' not found.")
    if tag not in users_db[user]:
        raise HTTPException(
            status_code=400, detail=f"Tag '{tag}' not found in subscriptions."
        )
    users_db[user].remove(tag)
    save_users(users_db)
    return {"user": user, "tags": users_db[user]}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
