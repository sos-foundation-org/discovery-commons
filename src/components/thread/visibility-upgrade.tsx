"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { VISIBILITY_LABELS, VISIBILITY_LEVELS, type VisibilityLevel } from "@/lib/types";

export function VisibilityUpgrade({
  threadId,
  currentLevel,
}: {
  threadId: string;
  currentLevel: VisibilityLevel;
}) {
  const router = useRouter();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const currentIndex = VISIBILITY_LEVELS.indexOf(currentLevel);
  const nextLevel = VISIBILITY_LEVELS[currentIndex + 1];

  if (!nextLevel) return null;

  const handleUpgrade = async () => {
    if (
      !confirm(
        `Upgrade visibility to ${VISIBILITY_LABELS[nextLevel]}? This cannot be undone.`
      )
    )
      return;

    setIsUpgrading(true);
    try {
      const res = await fetch(`/api/threads/${threadId}/visibility`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: nextLevel }),
      });
      if (res.ok) router.refresh();
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="mt-3 flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleUpgrade}
        disabled={isUpgrading}
      >
        {isUpgrading
          ? "Upgrading..."
          : `Upgrade to ${VISIBILITY_LABELS[nextLevel]}`}
      </Button>
      <span className="text-xs text-muted-foreground">
        Cannot be reversed
      </span>
    </div>
  );
}
