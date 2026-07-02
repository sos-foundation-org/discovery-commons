"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Collaborator {
  id: string;
  role: string;
  user: {
    id: string;
    displayName: string | null;
    name: string | null;
    email: string;
    image: string | null;
  };
}

const ROLES = ["viewer", "contributor", "admin"] as const;

export function CollaboratorManager({ threadId }: { threadId: string }) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("contributor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/threads/${threadId}/collaborators`).catch(
      () => null
    );
    if (res?.ok) setCollaborators(await res.json());
  }, [threadId]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    if (!email) return;
    setLoading(true);
    setError("");
    const res = await fetch(`/api/threads/${threadId}/collaborators`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    }).catch(() => null);
    if (res?.ok) {
      setEmail("");
      await load();
    } else {
      const data = await res?.json().catch(() => null);
      setError(data?.error || "Failed to add collaborator");
    }
    setLoading(false);
  };

  const remove = async (userId: string) => {
    setLoading(true);
    await fetch(
      `/api/threads/${threadId}/collaborators?userId=${encodeURIComponent(userId)}`,
      { method: "DELETE" }
    ).catch(() => null);
    await load();
    setLoading(false);
  };

  return (
    <div className="mt-3 rounded-lg border p-3">
      <p className="text-sm font-medium mb-2">
        Collaborators{" "}
        <span className="text-muted-foreground font-normal">
          — can see this thread&rsquo;s Shared contributions
        </span>
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Input
          type="email"
          placeholder="collaborator@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}
          className="h-9 rounded-md border bg-background px-2 text-sm"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <Button size="sm" onClick={add} disabled={loading || !email}>
          {loading ? "…" : "Add"}
        </Button>
      </div>
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

      {collaborators.length === 0 ? (
        <p className="text-xs text-muted-foreground">No collaborators yet.</p>
      ) : (
        <ul className="space-y-1">
          {collaborators.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between text-sm py-1"
            >
              <span>
                {c.user.displayName || c.user.name || c.user.email}{" "}
                <span className="text-xs text-muted-foreground">
                  ({c.role})
                </span>
              </span>
              <button
                type="button"
                onClick={() => remove(c.user.id)}
                className="text-xs text-muted-foreground hover:text-red-600 underline"
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
