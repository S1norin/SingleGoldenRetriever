import React, { useState } from "react";

export default function MessageComposer({
  availableTopics,
  selectedTopics,
  onToggleTopic,
  onSend,
}) {
  const [draftMessage, setDraftMessage] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    const didSend = onSend(draftMessage);
    if (didSend) {
      setDraftMessage("");
    }
  };

  return (
    <div className="border-t border-[var(--border)] p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.08em]">Producer</p>

        <div className="flex flex-wrap gap-x-4 gap-y-2 border border-[var(--border)] p-3">
          {availableTopics.length === 0 ? (
            <span className="text-sm text-[var(--muted)]">
              Join a topic to enable sending.
            </span>
          ) : null}

          {availableTopics.map((topic) => (
            <label key={topic} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedTopics.includes(topic)}
                onChange={() => onToggleTopic(topic)}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              <span>{topic}</span>
            </label>
          ))}
        </div>

        <textarea
          value={draftMessage}
          onChange={(event) => setDraftMessage(event.target.value)}
          rows={4}
          placeholder="Write a message..."
          className="w-full border border-[var(--border)] bg-[var(--panel)] px-3 py-3 text-sm text-[var(--fg)] outline-none placeholder:text-[var(--muted)]"
        />

        <button
          type="submit"
          disabled={!draftMessage.trim() || selectedTopics.length === 0}
          className="w-full border border-[var(--accent)] bg-[var(--accent)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--accent-contrast)] disabled:cursor-not-allowed disabled:border-[var(--border)] disabled:bg-[var(--panel)] disabled:text-[var(--muted)]"
        >
          Send Message
        </button>
      </form>
    </div>
  );
}
