"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function UnsealButton({ contributionId }: { contributionId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleUnseal = async () => {
    setIsLoading(true);
    const res = await fetch(`/api/contributions/${contributionId}/unseal`, {
      method: "POST",
    }).catch(() => null);

    if (res?.ok) {
      router.refresh();
    }
    setIsLoading(false);
    setConfirming(false);
  };

  if (!confirming) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => setConfirming(true)}
        className="text-xs"
      >
        Unseal
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-amber-700 dark:text-amber-300">
        This cannot be undone.
      </span>
      <Button
        size="sm"
        variant="destructive"
        onClick={handleUnseal}
        disabled={isLoading}
        className="text-xs"
      >
        {isLoading ? "Unsealing..." : "Confirm Unseal"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setConfirming(false)}
        className="text-xs"
      >
        Cancel
      </Button>
    </div>
  );
}
