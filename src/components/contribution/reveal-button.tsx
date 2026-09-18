"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/language-provider";

// Reveals a sealed contribution. The author picks the target visibility
// (Shared or Public); the server verifies the hash before revealing.
export function RevealButton({ contributionId }: { contributionId: string }) {
  const router = useRouter();
  const { t, te } = useI18n();
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
        {t("reveal.button")}
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <span className="text-xs text-amber-700 dark:text-amber-300">
          {t("reveal.to")}
        </span>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => handleReveal("shared")}
          disabled={isLoading}
          className="text-xs"
        >
          {t("reveal.collaborators")}
        </Button>
        <Button
          size="sm"
          variant="default"
          onClick={() => handleReveal("public")}
          disabled={isLoading}
          title={t("reveal.publicTitle")}
          className="text-xs"
        >
          {t("vis.public")}
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
          {t("common.cancel")}
        </Button>
      </div>
      <span className="text-xs text-muted-foreground">
        {isLoading ? t("reveal.verifying") : t("reveal.note")}
      </span>
      {error && <span className="text-xs text-red-600" role="alert">{te(error)}</span>}
    </div>
  );
}
