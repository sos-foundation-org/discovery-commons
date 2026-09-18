"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { STAGE_ORDER, STAGE_LEVEL } from "@/lib/types";
import { useI18n } from "@/components/language-provider";

export function StageAdvance({
  threadId,
  currentStage,
  stageCounts,
}: {
  threadId: string;
  currentStage: string;
  stageCounts: Record<string, number>;
}) {
  const router = useRouter();
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [error, setError] = useState("");
  const { t, te } = useI18n();

  const currentLevel = STAGE_LEVEL[currentStage] ?? -1;
  const maxLevel = Math.max(...Object.values(STAGE_LEVEL));
  if (currentLevel >= maxLevel) return null;

  // Find stages at the next level (may be multiple for parallel stages like data/simulation)
  const nextLevelStages = STAGE_ORDER.filter(
    (s) => STAGE_LEVEL[s] === currentLevel + 1
  );
  const readyStages = nextLevelStages.filter(
    (s) => (stageCounts[s] || 0) > 0
  );
  const nextStage = readyStages[0] || nextLevelStages[0];
  const hasContribForNext = readyStages.length > 0;
  const stageLabel = t(`thread.stage.${nextStage}`);

  const handleAdvance = async () => {
    setIsAdvancing(true);
    setError("");

    const res = await fetch(`/api/threads/${threadId}/advance-stage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: nextStage }),
    }).catch(() => null);

    if (res?.ok) {
      router.refresh();
    } else {
      const data = await res?.json().catch(() => ({}));
      setError(data?.error || t("thread.advanceFailed"));
    }
    setIsAdvancing(false);
  };

  return (
    <div className="mt-3 p-3 rounded-lg border bg-muted/30">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{t("thread.advanceTitle")}</p>
          <p className="text-xs text-muted-foreground">
            {hasContribForNext
              ? t(
                  stageCounts[nextStage] !== 1
                    ? "thread.readyAdvanceMany"
                    : "thread.readyAdvanceOne",
                  { stage: stageLabel, n: stageCounts[nextStage] }
                )
              : t("thread.needContribution", { stage: stageLabel })}
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleAdvance}
          disabled={isAdvancing || !hasContribForNext}
        >
          {isAdvancing ? t("thread.advancing") : t("thread.advanceTo", { stage: stageLabel })}
        </Button>
      </div>
      {error && (
        <p className="text-xs text-destructive mt-2">{te(error)}</p>
      )}
    </div>
  );
}
