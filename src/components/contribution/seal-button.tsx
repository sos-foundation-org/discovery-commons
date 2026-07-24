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
      <div className="flex flex-col items-end">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setConfirming(true)}
          title="Record proof of existence"
          className="text-xs"
        >
          Seal
        </Button>
        {/* Subtitle disambiguates Seal (proof of existence) from Publish
            (credit priority) — Web Prototype §3B.7. */}
        <span className="text-[10px] text-muted-foreground">
          Record proof of existence
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
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
      </div>
      <span className="text-[11px] text-muted-foreground">
        Note: recording proof of existence is not the same as establishing credit
        priority. To get a credit timestamp, publish later.
      </span>
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </div>
  );
}
