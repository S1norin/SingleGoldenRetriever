import React from "react";

const stageOrder = ["producer", "topic", "consumer"];

export default function FlowMonitor({ flowItems, currentUser }) {
  return (
    <div className="border-b border-[var(--border)] p-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.08em]">
          Live Flow
        </h2>
        <span className="text-xs text-[var(--muted)]">{flowItems.length} tracked</span>
      </div>

      <div className="mt-4 space-y-3">
        {flowItems.length === 0 ? (
          <div className="border border-[var(--border)] p-4 text-sm text-[var(--muted)]">
            Send a message to start the flow monitor.
          </div>
        ) : (
          flowItems.map((flow) => (
            <div key={flow.id} className="border border-[var(--border)] p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm">
                    <span className="font-semibold">{flow.sender}</span> to{" "}
                    {flow.targetTopics.join(", ")}
                  </p>
                  <p className="mt-1 truncate text-xs text-[var(--muted)]">
                    {flow.text}
                  </p>
                </div>
                <span className="shrink-0 text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
                  {flow.statusLabel}
                </span>
              </div>

              <div className="mt-4 flex flex-col gap-2 text-sm xl:flex-row xl:items-center">
                <StageBox
                  label={flow.sender}
                  status={flow.stages.producer}
                  active={flow.activeStage === "producer"}
                />
                <Arrow />
                <StageBox
                  label="Single Kafka Topic"
                  status={flow.stages.topic}
                  active={flow.activeStage === "topic"}
                />
                <Arrow />
                <StageBox
                  label={currentUser}
                  status={flow.stages.consumer}
                  active={flow.activeStage === "consumer"}
                />
              </div>

              <div className="mt-3 flex gap-2">
                {stageOrder.map((stage) => (
                  <div
                    key={stage}
                    className={`h-1 flex-1 ${
                      flow.stages[stage] === "done"
                        ? "bg-[var(--accent)]"
                        : flow.stages[stage] === "active"
                          ? "bg-[var(--accent-dim)]"
                          : "bg-[var(--panel-soft)]"
                    }`}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StageBox({ label, status, active }) {
  const statusText =
    status === "done" ? "done" : status === "active" ? "active" : "waiting";

  return (
    <div
      className={`min-w-0 flex-1 border px-3 py-2 ${
        active
          ? "border-[var(--accent)] bg-[var(--panel-soft)]"
          : "border-[var(--border)] bg-[var(--panel)]"
      }`}
    >
      <p className="truncate text-sm">{label}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
        {statusText}
      </p>
    </div>
  );
}

function Arrow() {
  return <span className="text-[var(--muted)]">-&gt;</span>;
}
