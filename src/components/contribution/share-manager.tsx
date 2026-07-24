"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Share {
  id: string;
  user: {
    id: string;
    displayName: string | null;
    name: string | null;
    email: string;
  };
}

// Author-only control to share a "shared" contribution with specific users
// (beyond the thread's collaborators). Collapsed until opened.
export function ShareManager({ contributionId }: { contributionId: string }) {
  const [open, setOpen] = useState(false);
  const [shares, setShares] = useState<Share[]>([]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(
      `/api/contributions/${contributionId}/share`
    ).catch(() => null);
    if (res?.ok) setShares(await res.json());
  }, [contributionId]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const add = async () => {
    if (!email.trim()) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/contributions/${contributionId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    }).catch(() => null);
    if (res?.ok) {
      setEmail("");
      await load();
    } else {
      const d = await res?.json().catch(() => null);
      setError(d?.error || "Failed to share");
    }
    setBusy(false);
  };

  const remove = async (userId: string) => {
    await fetch(
      `/api/contributions/${contributionId}/share?userId=${encodeURIComponent(userId)}`,
      { method: "DELETE" }
    ).catch(() => null);
    await load();
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-muted-foreground underline hover:text-foreground"
      >
        Share with specific people
      </button>
    );
  }

  return (
    <div className="rounded-lg border p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium">Shared with</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Close
        </button>
      </div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="person@email.com"
          className="h-8 max-w-xs text-sm"
        />
        <Button size="sm" onClick={add} disabled={busy || !email}>
          {busy ? "…" : "Share"}
        </Button>
      </div>
      {/* Web Prototype §3B.7: sharing does not establish credit priority. */}
      <p className="mb-2 text-[11px] text-muted-foreground">
        Sharing with collaborators does not create a credit timestamp. To protect
        priority, seal first, then share.
      </p>
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      {shares.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Only thread collaborators can see this so far.
        </p>
      ) : (
        <ul className="space-y-1">
          {shares.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between text-sm"
            >
              <span>{s.user.displayName || s.user.name || s.user.email}</span>
              <button
                type="button"
                onClick={() => remove(s.user.id)}
                className="text-xs text-muted-foreground underline hover:text-red-600"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
