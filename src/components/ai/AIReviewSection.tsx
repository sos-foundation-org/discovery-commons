"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AIReviewPanel } from "./AIReviewPanel";
import { AIRoleBadge } from "./AIRoleBadge";
import type { AIReviewResult } from "@/lib/ai/prompts/reviewer";

// Client wrapper that runs the AI Reviewer on demand and renders the result.
export function AIReviewSection({ threadId }: { threadId: string }) {
  const [review, setReview] = useState<AIReviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setError(data.error || "Failed to run AI review");
      }
    } catch {
      setError("Failed to run AI review");
    } finally {
      setLoading(false);
    }
  }

  if (review) {
    return (
      <div className="space-y-3">
        <AIReviewPanel review={review} />
        <Button variant="outline" size="sm" onClick={runReview} disabled={loading}>
          {loading ? "Re-running…" : "Re-run AI Review"}
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-start gap-3 py-5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">AI Review</span>
          <AIRoleBadge role="reviewer" />
        </div>
        <p className="text-sm text-muted-foreground">
          Run automated statistical, consistency, and bias checks over this
          thread. Advisory only — supplements, does not replace, human review.
        </p>
        <Button size="sm" onClick={runReview} disabled={loading}>
          {loading ? "Running…" : "Run AI Review"}
        </Button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}
