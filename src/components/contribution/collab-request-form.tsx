"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COLLAB_SEEKING_TYPES, COLLAB_SEEKING_LABELS, type CollabSeekingType } from "@/lib/types";

/**
 * Shopee-style collaboration proposal form — one-line message + type quick-select.
 * Rendered inside the GatedContent component when user clicks "Propose Collaboration".
 */
export function CollabRequestForm({
  contributionId,
  onSuccess,
  onCancel,
}: {
  contributionId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [seekingType, setSeekingType] = useState<CollabSeekingType>("either");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/contributions/${contributionId}/collab`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, seekingType }),
      });
      if (res.ok) {
        onSuccess?.();
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to send request");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border bg-muted/30 p-3">
      <p className="text-sm font-medium">Propose Collaboration</p>

      {/* Seeking type quick-select */}
      <div className="flex gap-2">
        {COLLAB_SEEKING_TYPES.map((t) => {
          const cfg = COLLAB_SEEKING_LABELS[t];
          return (
            <button
              key={t}
              type="button"
              onClick={() => setSeekingType(t)}
              className={`px-3 py-2 min-h-[44px] rounded text-sm border transition-colors ${
                seekingType === t
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:bg-accent"
              }`}
            >
              {cfg.icon} {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Message */}
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Brief intro + what you can contribute (optional)"
        maxLength={500}
        className="text-sm"
      />
      <p className="text-xs text-muted-foreground">
        Your profile (level, disciplines, contributions) is automatically attached.
      </p>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? "Sending..." : "Send Request"}
        </Button>
        {onCancel && (
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
