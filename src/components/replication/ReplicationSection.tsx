"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ReplicationCard } from "./ReplicationCard";
import { REPLICATION_OUTCOMES, REPLICATION_OUTCOME_CONFIG } from "@/lib/types";

interface Replication {
  id: string;
  outcome: string;
  notes?: string | null;
  createdAt: string;
  replicationThread: { id: string; title: string };
}

// Lists replications of a thread and (for signed-in users) lets them register
// a new replication attempt by linking another thread.
export function ReplicationSection({
  threadId,
  canRegister,
}: {
  threadId: string;
  canRegister: boolean;
}) {
  const [replications, setReplications] = useState<Replication[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [replicationThreadId, setReplicationThreadId] = useState("");
  const [outcome, setOutcome] = useState<string>("replicated");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/v2/threads/${threadId}/replications`);
    if (res.ok) {
      const data = await res.json();
      setReplications(data.replications);
    }
  }, [threadId]);

  useEffect(() => {
    load();
  }, [load]);

  async function register() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/v2/threads/${threadId}/replications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        replicationThreadId: replicationThreadId.trim(),
        outcome,
        notes: notes.trim() || undefined,
      }),
    });
    if (res.ok) {
      setReplicationThreadId("");
      setNotes("");
      setShowForm(false);
      await load();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to register replication");
    }
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Replications ({replications.length})
        </h2>
        {canRegister && (
          <Button variant="outline" size="sm" onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Cancel" : "Register replication"}
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardContent className="space-y-3 py-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Replication thread ID (the independent attempt)
              </label>
              <Input
                value={replicationThreadId}
                onChange={(e) => setReplicationThreadId(e.target.value)}
                placeholder="thread id of the replication study"
                className="font-mono"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Outcome
              </label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                {REPLICATION_OUTCOMES.map((o) => (
                  <option key={o} value={o}>
                    {REPLICATION_OUTCOME_CONFIG[o].label}
                  </option>
                ))}
              </select>
            </div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional). Failed replications are equally valued — report honestly."
              rows={3}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button
              size="sm"
              onClick={register}
              disabled={busy || !replicationThreadId.trim()}
            >
              {busy ? "Registering…" : "Register"}
            </Button>
          </CardContent>
        </Card>
      )}

      {replications.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No replication attempts registered yet. Two or more successful
          independent replications earn this thread a verified badge.
        </p>
      ) : (
        <div className="space-y-2">
          {replications.map((r) => (
            <ReplicationCard key={r.id} replication={r} />
          ))}
        </div>
      )}
    </div>
  );
}
