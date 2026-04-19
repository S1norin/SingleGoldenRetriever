import React from "react";
import { formatTopicPreview } from "../utils/topicUtils";

function MessageCard({ message, onClick }) {
  const { visibleTopics, hiddenCount } = formatTopicPreview(message.targetTopics);
  const previewText =
    hiddenCount > 0
      ? `${visibleTopics.join(", ")}, +${hiddenCount} more`
      : visibleTopics.join(", ");

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full border border-[var(--border)] bg-[var(--panel)] p-4 text-left"
    >
      <p className="text-sm">
        <span className="font-semibold">User:</span> {message.sender}
      </p>
      <p className="mt-2 text-sm text-[var(--muted)]">
        <span className="font-semibold text-[var(--fg)]">To:</span> {previewText}
      </p>
      <p className="mt-3 text-sm leading-6">{message.text}</p>
    </button>
  );
}

export default function MessageFeed({ messages, currentUser, onSelectMessage }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <div className="flex h-full flex-col">
        <div className="border border-[var(--border)] p-4 text-sm text-[var(--muted)]">
          Filtered for {currentUser}
        </div>

        <div className="mt-4 flex-1 space-y-4">
          {messages.length === 0 ? (
            <div className="border border-[var(--border)] p-4 text-sm text-[var(--muted)]">
              No messages match the current subscription filter.
            </div>
          ) : (
            messages.map((message) => (
              <MessageCard
                key={message.id}
                message={message}
                onClick={() => onSelectMessage(message)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
