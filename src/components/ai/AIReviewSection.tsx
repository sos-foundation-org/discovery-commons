"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AIReviewPanel } from "./AIReviewPanel";
import { AIRoleBadge } from "./AIRoleBadge";
import type { AIReviewResult } from "@/lib/ai/prompts/reviewer";
import { useI18n } from "@/components/language-provider";

// Client wrapper that runs the AI Reviewer on demand and renders the result.
export function AIReviewSection({ threadId }: { threadId: string }) {
  const [review, setReview] = useState<AIReviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t, te } = useI18n();

  async function runReview() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v2/threads/${threadId}/ai/review`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setReview(data.review);
      } else {
        setError(data.error || t("thread.ai.failed"));
      }
    } catch {
      setError(t("thread.ai.failed"));
    } finally {
      setLoading(false);
    }
  }

  if (review) {
    return (
      <div className="space-y-3">
        <AIReviewPanel review={review} />
        <Button variant="outline" size="sm" onClick={runReview} disabled={loading}>
          {loading ? t("thread.ai.rerunning") : t("thread.ai.rerun")}
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-start gap-3 py-5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{t("thread.ai.review")}</span>
          <AIRoleBadge role="reviewer" />
        </div>
        <p className="text-sm text-muted-foreground">
          {t("thread.ai.intro")}
        </p>
        <Button size="sm" onClick={runReview} disabled={loading}>
          {loading ? t("thread.ai.running") : t("thread.ai.run")}
        </Button>
        {error && <p className="text-sm text-red-600">{te(error)}</p>}
      </CardContent>
    </Card>
  );
}
