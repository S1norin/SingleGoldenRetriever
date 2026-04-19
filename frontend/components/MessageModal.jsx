import React, { useEffect } from "react";

export default function MessageModal({ message, currentUser, onClose }) {
  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [message, onClose]);

  if (!message) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl border border-[var(--border-strong)] bg-[var(--panel-strong)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
              Detail View
            </p>
            <h2 className="mt-1 text-base font-semibold">
              Message from {message.sender}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="border border-[var(--border)] px-3 py-2 text-sm"
          >
            Close
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div className="border border-[var(--border)] p-4 text-sm leading-6">
            {message.text}
          </div>

          <div className="border border-[var(--border)] p-4">
            <p className="text-sm font-semibold">All Topics</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {message.targetTopics.join(", ")}
            </p>
          </div>

          <div className="border border-[var(--border)] p-4">
            <p className="text-sm font-semibold">Message Flow</p>
            <div className="mt-3 flex flex-col gap-2 text-sm lg:flex-row lg:items-center">
              <FlowBox label={`${message.sender} / producer`} />
              <span className="text-[var(--muted)]">-&gt;</span>
              <FlowBox label="Single Kafka Topic" />
              <span className="text-[var(--muted)]">-&gt;</span>
              <FlowBox label={`${currentUser} / consumer`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlowBox({ label }) {
  return <div className="border border-[var(--border)] px-3 py-2">{label}</div>;
}
