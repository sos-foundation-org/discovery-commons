import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIRoleBadge } from "./AIRoleBadge";
import { AIConfidenceBar } from "./AIConfidenceBar";
import type { AIReviewResult } from "@/lib/ai/prompts/reviewer";

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

const CATEGORY_LABELS: Record<string, string> = {
  statistical_consistency: "Statistical consistency",
  data_format: "Data format",
  method_clarity: "Method clarity",
  logical_consistency: "Logical consistency",
  bias_detection: "Bias detection",
};

// Displays AI Reviewer results. Advisory only — always shown with a disclaimer.
export function AIReviewPanel({ review }: { review: AIReviewResult }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            AI Review
            <AIRoleBadge role="reviewer" />
          </CardTitle>
          <span
            className={`text-sm font-semibold ${ASSESSMENT_STYLES[review.overallAssessment] || ""}`}
          >
            {review.overallAssessment.replace("_", " ")}
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
                  {CATEGORY_LABELS[check.category] || check.category}
                </span>
                <span
                  className={`text-xs font-semibold uppercase ${STATUS_STYLES[check.status] || ""}`}
                >
                  {check.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{check.details}</p>
              {check.suggestion && (
                <p className="mt-1 text-xs text-muted-foreground">
                  <span className="font-medium">Suggestion: </span>
                  {check.suggestion}
                </p>
              )}
            </div>
          ))}
        </div>

        <p className="border-t pt-3 text-xs italic text-muted-foreground">
          AI review is advisory and supplements — does not replace — human expert
          review.
        </p>
      </CardContent>
    </Card>
  );
}
