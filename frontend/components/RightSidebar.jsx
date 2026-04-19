import React from "react";

export default function RightSidebar({ onlineUsers, compact = false }) {
  return (
    <div className="flex min-h-0 w-full flex-col p-4">
      <div className="border border-[var(--border)] p-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.08em]">
          Online Now
        </h2>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto border border-[var(--border)]">
        {onlineUsers.map((user) => {
          const isOnline = user.status === "online";

          return (
            <div
              key={user.id}
              className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3 last:border-b-0"
            >
              <span className="text-sm">
                <span
                  className={isOnline ? "text-[var(--success)]" : "text-[var(--muted)]"}
                >
                  o
                </span>{" "}
                {user.username}
              </span>
              <span className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
                {user.status}
              </span>
            </div>
          );
        })}
      </div>

      {compact ? null : (
        <p className="mt-3 text-xs text-[var(--muted)]">Presence service.</p>
      )}
    </div>
  );
}
