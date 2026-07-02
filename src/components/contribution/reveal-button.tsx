"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// Reveals a sealed contribution. The author picks the target visibility
// (Shared or Public); the server verifies the hash before revealing.
export function RevealButton({ contributionId }: { contributionId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReveal = async (visibility: "shared" | "public") => {
    setIsLoading(true);
    setError("");
    const res = await fetch(`/api/contributions/${contributionId}/reveal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility }),
    }).catch(() => null);

    if (res?.ok) {
      router.refresh();
      return;
    }
    const data = await res?.json().catch(() => null);
    setError(data?.error || "Failed to reveal");
    setIsLoading(false);
  };

  if (!confirming) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => setConfirming(true)}
        className="text-xs"
      >
        Reveal
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <span className="text-xs text-amber-700 dark:text-amber-300">
          Reveal to:
        </span>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => handleReveal("shared")}
          disabled={isLoading}
          className="text-xs"
        >
          Collaborators
        </Button>
        <Button
          size="sm"
          variant="default"
          onClick={() => handleReveal("public")}
          disabled={isLoading}
          className="text-xs"
        >
          Public
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setConfirming(false);
            setError("");
          }}
          className="text-xs"
        >
          Cancel
        </Button>
      </div>
      <span className="text-[11px] text-muted-foreground">
        {isLoading
          ? "Verifying hash…"
          : "Reveal is irreversible. The hash is re-checked before unlocking."}
      </span>
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </div>
  );
}
