import React, { useState } from "react";

export default function AuthPage({ defaultUsername, onLogin }) {
  const [username, setUsername] = useState(defaultUsername);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password.trim()) {
      setError("Enter username and password.");
      return;
    }

    setError("");
    onLogin({
      username: trimmedUsername,
      password,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-md border border-[var(--border)] bg-[var(--panel)]">
        <div className="border-b border-[var(--border)] px-4 py-4">
          <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">
            SingleGoldenRetriever
          </p>
          <h1 className="mt-1 text-base font-semibold">Authorization</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <label className="block">
            <span className="mb-2 block text-sm">Username</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none"
            />
          </label>

          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

          <button
            type="submit"
            className="w-full border border-[var(--accent)] bg-[var(--accent)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--accent-contrast)]"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
