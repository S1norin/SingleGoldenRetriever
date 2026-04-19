import React from "react";

export default function MobileDrawer({ open, title, children, onClose }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex lg:hidden">
      <button
        type="button"
        className="flex-1 bg-black/60"
        onClick={onClose}
        aria-label="Close drawer overlay"
      />
      <div className="relative w-[min(88vw,360px)] border-l border-[var(--border)] bg-[var(--bg)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="border border-[var(--border)] px-3 py-2 text-sm"
            aria-label="Close drawer"
          >
            Close
          </button>
        </div>
        <div className="h-[calc(100vh-65px)] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
