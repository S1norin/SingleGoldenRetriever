# Frontend

Static frontend for `SingleGoldenRetriever`.

This UI is built with plain `HTML`, `CSS`, and `JavaScript`. It does not require React, Vite, or any build step.

## Files

- `index.html`: entry page
- `styles.css`: layout and visual styles
- `script.js`: state, rendering, and UI interactions

## Features

- Minimal messenger-style layout
- Topic subscription management
- Client-side message filtering by subscribed topics
- Message composer with topic selection
- Online users panel
- Authorization screen
- Live message flow visualization
- Recipient tracking from flow cards
- Message detail modal

## Layout

- Left: subscribed topics
- Center: message feed
- Center bottom: live flow
- Right top: online users
- Right bottom: producer

## Run

Open `index.html` in a browser.

If you want a local server instead of opening the file directly, you can run one from the `frontend` directory, for example:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Notes

- All data is currently mock data stored in `script.js`.
- Authentication is frontend-only and not connected to the backend.
- Recipient counts in `Live Flow` are derived from mock user topic subscriptions.

## Future Integration

To connect this UI to the backend later, replace the mock state in `script.js` with:

- real auth requests
- real topic subscribe/unsubscribe calls
- real message send events
- real presence data
- real Kafka-backed message stream updates
