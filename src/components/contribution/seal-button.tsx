"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/language-provider";

// Seals a not-yet-public contribution (private|shared → sealed): content becomes
// hidden while the SHA-256 hash + timestamp stay public. Irreversible content lock.
export function SealButton({ contributionId }: { contributionId: string }) {
  const router = useRouter();
  const { t, te } = useI18n();
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
          title={t("seal.subtitle")}
          className="text-xs"
        >
          {t("seal.button")}
        </Button>
        {/* Subtitle disambiguates Seal (proof of existence) from Publish
            (credit priority) — Web Prototype §3B.7. */}
        <span className="text-xs text-muted-foreground">
          {t("seal.subtitle")}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <span className="text-xs text-amber-700 dark:text-amber-300">
          {t("seal.warning")}
        </span>
        <Button
          size="sm"
          variant="default"
          onClick={handleSeal}
          disabled={isLoading}
          className="text-xs"
        >
          {isLoading ? t("seal.sealing") : t("seal.confirm")}
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
        {t("seal.note")}
      </span>
      {error && <span className="text-xs text-red-600" role="alert">{te(error)}</span>}
    </div>
  );
}
