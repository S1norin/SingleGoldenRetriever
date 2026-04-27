# Auth Server — User Authentication & Tag Management

Lightweight FastAPI service that manages user authentication and tag subscriptions for the messaging system. Reads/writes user data from a static `users.txt` file.

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| Python | 3.9+ | Runtime |
| fastapi | — | REST API framework |
| uvicorn | — | ASGI server |
| pydantic | — | Request/response validation |

## Files

```
auth_server/
├── main.py               # FastAPI server + user management
├── Dockerfile
├── requirements.txt
└── users.txt             # Static user→tags registry
```

## Configuration

| Variable | Default | Description |
|---|---|---|
| — | — | No environment variables required |

The server reads `users.txt` from the working directory on every request.

## API Endpoints

### GET /auth

Authenticates a user and returns their tags.

**Query params:**
- `user` — username (required)

**Success response (200):**
```json
{"user": "Nikita", "tags": ["general", "backend"]}
```

**Error response (401):**
```json
{"detail": "User is not registered in the system."}
```

### PUT /auth/subscribe

Subscribes a user to a new tag. Persists the change to `users.txt`.

**Query params:**
- `user` — username (required)
- `tag` — tag name to subscribe to (required)

**Success response (200):**
```json
{"user": "Nikita", "tags": ["general", "backend", "newtag"]}
```

**Error responses:**
- `400` — Tag already subscribed: `{"detail": "Tag 'backend' already subscribed."}`
- `404` — User not found: `{"detail": "User 'Unknown' not found."}`
- `500` — Database error: `{"detail": "Database error: Cannot read users.txt"}`

### PUT /auth/unsubscribe

Unsubscribes a user from a tag. Persists the change to `users.txt`. The `general` tag is protected and cannot be removed.

**Query params:**
- `user` — username (required)
- `tag` — tag name to unsubscribe from (required)

**Success response (200):**
```json
{"user": "Nikita", "tags": ["general", "backend"]}
```

**Error responses:**
- `400` — Tag not found: `{"detail": "Tag 'frontend' not found in subscriptions."}`
- `400` — Cannot remove `general`: `{"detail": "Cannot unsubscribe from 'general' tag."}`
- `404` — User not found: `{"detail": "User 'Unknown' not found."}`
- `500` — Database error: `{"detail": "Database error: Cannot read users.txt"}`

## Data Model

### users.txt Format

```
Nikita:general,Олег,ACLMT,backend
Alice:general,frontend
Bob:general,Олег
```

Each line is `username:comma,separated,tags`.

### Field Rules

- **username** — Alphanumeric, no colons (colons are the delimiter)
- **tags** — Comma-separated, trimmed, case-sensitive
- **general** — Special tag: always preserved, cannot be unsubscribed
- **Cyrillic support** — Tags can contain Unicode characters (e.g., `Олег`)

### Default Users

If `users.txt` doesn't exist on startup, it's auto-created with:

```
Nikita:general,Олег,ACLMT,backend
Alice:general,frontend
Bob:general,Олег
```

## Implementation Details

### Read-Modify-Write Cycle

All subscription changes follow an atomic read-modify-write pattern:

1. **Read** — Load `users.txt` into memory (`load_users()`)
2. **Modify** — Add or remove the tag in memory
3. **Write** — Save back to `users.txt` (`save_users()`)

### Concurrency Safety

A `threading.Lock()` protects the read-modify-write cycle:

```python
users_lock = threading.Lock()

@app.put("/auth/subscribe")
def add_subscription(user: str = Query(...), tag: str = Query(...)):
    with users_lock:
        users_db = load_users()
        ...
        save_users(users_db)
```

This prevents lost updates when multiple requests arrive simultaneously.

### Write Strategy

The file is written in-place (not `os.replace`) to work with Docker volume mounts:

```python
def save_users(users_db):
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        for u, tags in users_db.items():
            f.write(f"{u}:{','.join(tags)}\n")
```

### Tag Validation

- Tags are split by comma and trimmed
- Empty tags are ignored
- Tags with colons are safe (split uses `maxsplit=1`)
- No validation on tag length or special characters

## Docker

```bash
docker compose up auth-server
```

The container runs `uvicorn main:app --host 0.0.0.0 --port 8000` by default. The `users.txt` file is mounted as a volume for persistence.

## Security Notes

- **No authentication** — Any client can subscribe/unsubscribe without credentials
- **No rate limiting** — Unlimited requests allowed
- **No input sanitization** — Tags can contain any characters
- **File-based storage** — Not suitable for high-concurrency or distributed deployments

For production use, consider:
- Adding JWT/token-based authentication
- Implementing rate limiting
- Using a proper database (PostgreSQL, SQLite)
- Adding input validation and sanitization
