"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContributionContent } from "./contribution-content";
import type {
  AccessMode,
  CollabSeekingType,
  CollaborationGate,
} from "@/lib/types";
import {
  COLLAB_SEEKING_LABELS,
  LEVELS,
} from "@/lib/types";
import { CollabRequestForm } from "./collab-request-form";
import { useI18n } from "@/components/language-provider";

interface GatedContentProps {
  contributionId: string;
  content: string;
  accessMode: AccessMode;
  price?: number;
  outlineBreak?: number;
  whyGated?: string;
  collaborationGate?: CollaborationGate;
  // Pre-resolved access state (from server)
  hasAccess: boolean;
  hasPurchased: boolean;
  isAuthor: boolean;
  // Content stats for the locked section
  detailStats?: string; // e.g. "4 paragraphs · 2 figures · 1 dataset link"
  /** Server-computed counts for the locked section; formatted per locale. */
  detailCounts?: { paragraphs: number; chars: number };
}

/**
 * Renders contribution content with outline/details split.
 * If the user has access (purchased, collaborator, or author), shows full content.
 * Otherwise shows outline + locked details section with action buttons.
 */
export function GatedContent({
  contributionId,
  content,
  accessMode,
  price,
  outlineBreak,
  whyGated,
  collaborationGate,
  hasAccess,
  hasPurchased,
  isAuthor,
  detailStats,
  detailCounts,
}: GatedContentProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [showCollabForm, setShowCollabForm] = useState(false);
  const [error, setError] = useState("");
  const { t, te, locale } = useI18n();

  // If open or user has access, show everything
  if (accessMode === "open" || hasAccess) {
    return <ContributionContent content={content} className="mb-3" />;
  }

  // Split content into outline and details
  const breakPoint = outlineBreak ?? findNaturalBreak(content);
  const outline = content.slice(0, breakPoint);
  const hasDetails = content.length > breakPoint;

  // Count details stats if not provided
  const stats = detailCounts
    ? `${t(
        detailCounts.paragraphs !== 1
          ? "contribution.paragraphMany"
          : "contribution.paragraphOne",
        { n: detailCounts.paragraphs }
      )} · ${t("contribution.charCount", { n: detailCounts.chars })}`
    : detailStats ?? estimateDetailStats(content.slice(breakPoint), t);

  const handlePurchase = async () => {
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    setPurchasing(true);
    setError("");
    try {
      const res = await fetch(`/api/contributions/${contributionId}/purchase`, {
        method: "POST",
      });
      if (res.ok) {
        setPurchaseSuccess(true);
        setTimeout(() => router.refresh(), 1500);
      } else {
        const data = await res.json();
        setError(data.error || t("contribution.purchaseFailed"));
      }
    } catch {
      setError(t("contribution.somethingWrong"));
    } finally {
      setPurchasing(false);
    }
  };

  const showPriced = accessMode === "priced" || accessMode === "priced_collab";
  const showCollab =
    accessMode === "collab_open" ||
    accessMode === "collab_gated" ||
    accessMode === "priced_collab";

  const gate = collaborationGate;
  const seekingLabel = gate?.seekingType
    ? COLLAB_SEEKING_LABELS[gate.seekingType]
    : null;
  const minLevelInfo = gate?.minLevel
    ? LEVELS.find((l) => l.level === gate.minLevel)
    : null;

  return (
    <div className="space-y-3 mb-3">
      {/* Outline — always visible */}
      <ContributionContent content={outline} />

      {/* Locked details section */}
      {hasDetails && (
        <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-4">
          {/* Lock icon + stats */}
          <div className="flex items-start gap-2 mb-3">
            <span className="text-lg">&#x1F512;</span>
            <div>
              <p className="text-sm font-medium">{t("gated.locked")}</p>
              {stats && (
                <p className="text-xs text-muted-foreground">{stats}</p>
              )}
            </div>
          </div>

          {/* Why gated explanation */}
          {whyGated && (
            <div className="mb-3 flex items-start gap-2 text-xs text-muted-foreground">
              <span>&#x1F4A1;</span>
              <span>{whyGated}</span>
            </div>
          )}

          {purchaseSuccess && (
            <div className="mb-3 rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3 text-sm text-green-800 dark:text-green-200">
              &#x2705; {t("gated.unlocked")}
            </div>
          )}

          {error && (
            <p className="text-xs text-destructive mb-3">{te(error)}</p>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {showPriced && price && (
              <Button
                size="sm"
                onClick={handlePurchase}
                disabled={purchasing || !session}
                title={
                  session
                    ? t("contribution.unlockFullTitle", { n: price })
                    : t("contribution.signInToPurchase")
                }
              >
                {purchasing
                  ? t("contribution.unlocking")
                  : `🔓 ${t("contribution.unlockFor", { n: price })}`}
              </Button>
            )}

            {showCollab && !showCollabForm && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (!session) {
                    router.push("/auth/signin");
                    return;
                  }
                  setShowCollabForm(true);
                }}
              >
                &#x1F4DD; {t("gated.propose")}
              </Button>
            )}
          </div>

          {/* Inline collab request form */}
          {showCollabForm && (
            <div className="mt-3">
              <CollabRequestForm
                contributionId={contributionId}
                onSuccess={() => setShowCollabForm(false)}
                onCancel={() => setShowCollabForm(false)}
              />
            </div>
          )}

          {/* Collaboration details */}
          {showCollab && gate && !showCollabForm && (
            <div
              id={`collab-${contributionId}`}
              className="mt-3 pt-3 border-t border-dashed border-muted-foreground/20 space-y-1.5"
            >
              {seekingLabel && (
                <p className="text-xs">
                  {seekingLabel.icon}{" "}
                  {t("contribution.seekingCollab").split(/(\{type\})/).map((part, i) =>
                    part === "{type}" ? (
                      <span key={i} className="font-medium">
                        {t(`collab.${gate.seekingType}`).toLowerCase()}
                      </span>
                    ) : (
                      part
                    )
                  )}
                </p>
              )}
              {minLevelInfo && (
                <p className="text-xs text-muted-foreground">
                  {t("form.minLevel")} {minLevelInfo.icon}{" "}
                  {t(`level.${minLevelInfo.level}`)} (Lv.
                  {minLevelInfo.level})
                </p>
              )}
              {gate.requiredDisciplines &&
                gate.requiredDisciplines.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {gate.requiredDisciplines.map((d) => (
                      <Badge
                        key={d}
                        variant="outline"
                        className="text-xs"
                      >
                        {locale !== "en" && t(`disc.${d}`) !== `disc.${d}`
                          ? t(`disc.${d}`)
                          : d}
                      </Badge>
                    ))}
                  </div>
                )}
              {gate.description && (
                <p className="text-xs text-muted-foreground italic">
                  &ldquo;{gate.description}&rdquo;
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Find a natural break point: end of first paragraph or 280 chars. */
function findNaturalBreak(content: string): number {
  const firstParagraph = content.indexOf("\n\n");
  if (firstParagraph > 0 && firstParagraph < 600) return firstParagraph;
  // Fall back to 280 chars at a word boundary
  if (content.length <= 280) return content.length;
  const boundary = content.lastIndexOf(" ", 280);
  return boundary > 100 ? boundary : 280;
}

/** Rough estimate of what's behind the lock. */
function estimateDetailStats(
  details: string,
  t: (key: string, vars?: Record<string, string | number>) => string
): string {
  if (!details.trim()) return "";
  const paragraphs = details.split(/\n\n+/).filter((p) => p.trim()).length;
  const images = (details.match(/!\[/g) || []).length;
  const codeBlocks = (details.match(/```/g) || []).length / 2;
  const parts: string[] = [];
  if (paragraphs > 0)
    parts.push(
      t(paragraphs !== 1 ? "contribution.paragraphMany" : "contribution.paragraphOne", {
        n: paragraphs,
      })
    );
  if (images > 0)
    parts.push(
      t(images !== 1 ? "contribution.imageMany" : "contribution.imageOne", { n: images })
    );
  if (codeBlocks > 0)
    parts.push(
      t(codeBlocks !== 1 ? "contribution.codeBlockMany" : "contribution.codeBlockOne", {
        n: Math.floor(codeBlocks),
      })
    );
  return parts.join(" · ");
}
