import React, { useState } from "react";
import { sanitizeTopicInput } from "../utils/topicUtils";

export default function LeftSidebar({
  subscribedTopics,
  onJoinTopic,
  onRemoveTopic,
  onDraftChange = () => {},
  joinError,
  compact = false,
}) {
  const [draftTopic, setDraftTopic] = useState("");
  const sanitizedPreview = sanitizeTopicInput(draftTopic);

  const handleSubmit = (event) => {
    event.preventDefault();
    const didJoin = onJoinTopic(draftTopic);

    if (didJoin) {
      setDraftTopic("");
    }
  };

  return (
    <div className="flex min-h-0 w-full flex-col">
      <div className="border-b border-[var(--border)] p-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.08em]">
          Subscribed Topics
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={draftTopic}
              onChange={(event) => {
                setDraftTopic(event.target.value);
                onDraftChange();
              }}
              placeholder="Enter topic name..."
              className="min-w-0 flex-1 border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--fg)] outline-none placeholder:text-[var(--muted)]"
            />
            <button
              type="submit"
              className="border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)]"
            >
              Join
            </button>
          </div>

          <div className="border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-xs text-[var(--muted)]">
            Sanitized: {sanitizedPreview || "topicname"}
          </div>

          {joinError ? <p className="text-sm text-[var(--danger)]">{joinError}</p> : null}
        </form>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-4">
        <div className="mb-3 text-sm text-[var(--muted)]">{subscribedTopics.length} active</div>

        <div className="min-h-0 flex-1 overflow-y-auto border border-[var(--border)]">
          {subscribedTopics.length === 0 ? (
            <div className="p-4 text-sm text-[var(--muted)]">
              No subscriptions yet.
            </div>
          ) : (
            subscribedTopics.map((topic) => (
              <div
                key={topic}
                className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 last:border-b-0"
              >
                <span className="min-w-0 truncate text-sm">{topic}</span>
                <button
                  type="button"
                  onClick={() => onRemoveTopic(topic)}
                  className="ml-3 text-sm text-[var(--muted)] hover:text-[var(--fg)]"
                  aria-label={`Unsubscribe from ${topic}`}
                >
                  [x]
                </button>
              </div>
            ))
          )}
        </div>

        {compact ? null : (
          <p className="mt-3 text-xs text-[var(--muted)]">Global feed filter.</p>
        )}
      </div>
    </div>
  );
}
