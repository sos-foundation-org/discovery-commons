"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// Seals a not-yet-public contribution (private|shared → sealed): content becomes
// hidden while the SHA-256 hash + timestamp stay public. Irreversible content lock.
export function SealButton({ contributionId }: { contributionId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSeal = async () => {
    setIsLoading(true);
    setError("");
    const res = await fetch(`/api/contributions/${contributionId}/seal`, {
      method: "POST",
    }).catch(() => null);

    if (res?.ok) {
      router.refresh();
      return;
    }
    const data = await res?.json().catch(() => null);
    setError(data?.error || "Failed to seal");
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
        Seal
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-amber-700 dark:text-amber-300">
        Hide content, keep hash public. Content can no longer be edited.
      </span>
      <Button
        size="sm"
        variant="default"
        onClick={handleSeal}
        disabled={isLoading}
        className="text-xs"
      >
        {isLoading ? "Sealing…" : "Confirm Seal"}
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
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </div>
  );
}
