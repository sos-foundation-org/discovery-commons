"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIRoleBadge } from "./AIRoleBadge";
import { AIConfidenceBar } from "./AIConfidenceBar";
import type { AIReviewResult } from "@/lib/ai/prompts/reviewer";
import { useI18n } from "@/components/language-provider";

const ASSESSMENT_STYLES: Record<string, string> = {
  pass: "text-green-600",
  concerns: "text-amber-600",
  issues_found: "text-red-600",
};

const STATUS_STYLES: Record<string, string> = {
  pass: "text-green-600",
  warning: "text-amber-600",
  issue: "text-red-600",
};

// Fixed enums from the reviewer schema → dictionary keys (thread.ai.*).
const CATEGORIES = [
  "statistical_consistency",
  "data_format",
  "method_clarity",
  "logical_consistency",
  "bias_detection",
];
const ASSESSMENTS = ["pass", "concerns", "issues_found"];
const STATUSES = ["pass", "warning", "issue"];

// Displays AI Reviewer results. Advisory only — always shown with a disclaimer.
export function AIReviewPanel({ review }: { review: AIReviewResult }) {
  const { t } = useI18n();
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            {t("thread.ai.review")}
            <AIRoleBadge role="reviewer" />
          </CardTitle>
          <span
            className={`text-sm font-semibold ${ASSESSMENT_STYLES[review.overallAssessment] || ""}`}
          >
            {ASSESSMENTS.includes(review.overallAssessment)
              ? t(`thread.ai.assessment.${review.overallAssessment}`)
              : review.overallAssessment.replace("_", " ")}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <AIConfidenceBar score={review.confidenceScore} />

        <p className="text-sm text-muted-foreground">{review.summary}</p>

        <div className="space-y-2">
          {review.checks.map((check, i) => (
            <div key={i} className="rounded-md border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {CATEGORIES.includes(check.category)
                    ? t(`thread.ai.cat.${check.category}`)
                    : check.category}
                </span>
                <span
                  className={`text-xs font-semibold uppercase ${STATUS_STYLES[check.status] || ""}`}
                >
                  {STATUSES.includes(check.status)
                    ? t(`thread.ai.status.${check.status}`)
                    : check.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{check.details}</p>
              {check.suggestion && (
                <p className="mt-1 text-xs text-muted-foreground">
                  <span className="font-medium">{t("thread.ai.suggestion")}</span>
                  {check.suggestion}
                </p>
              )}
            </div>
          ))}
        </div>

        <p className="border-t pt-3 text-xs italic text-muted-foreground">
          {t("thread.ai.disclaimer")}
        </p>
      </CardContent>
    </Card>
  );
}
