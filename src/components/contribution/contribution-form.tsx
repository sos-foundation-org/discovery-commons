"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CONTRIBUTION_TYPE_CONFIG,
  PRIMARY_CONTRIBUTION_TYPES,
  CONTRIBUTION_TYPES,
  VISIBILITY_LABELS,
  type ContributionType,
  type VisibilityLevel,
} from "@/lib/types";

interface CircleMember {
  id: string;
  trustedUser: {
    id: string;
    displayName: string | null;
    name: string | null;
    email: string;
  };
}

export function ContributionForm({
  threadId,
  threadVisibility,
}: {
  threadId: string;
  threadVisibility: VisibilityLevel;
}) {
  const router = useRouter();
  const [type, setType] = useState<ContributionType>("question");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<VisibilityLevel>(threadVisibility);
  const [sealed, setSealed] = useState(false);
  const [showAdvancedTypes, setShowAdvancedTypes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [circleMembers, setCircleMembers] = useState<CircleMember[]>([]);
  const [circleLoading, setCircleLoading] = useState(false);
  const [selectedCircleUserIds, setSelectedCircleUserIds] = useState<string[]>([]);

  const fetchCircle = useCallback(async () => {
    setCircleLoading(true);
    try {
      const res = await fetch("/api/trusted-circle");
      if (res.ok) {
        const data: CircleMember[] = await res.json();
        setCircleMembers(data);
      }
    } catch {
      // Silently fail — circle selection is optional
    } finally {
      setCircleLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCircle();
  }, [fetchCircle]);

  const toggleCircleUser = useCallback((userId: string) => {
    setSelectedCircleUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }, []);

  const selectAllCircle = useCallback(() => {
    setSelectedCircleUserIds(circleMembers.map((m) => m.trustedUser.id));
  }, [circleMembers]);

  const deselectAllCircle = useCallback(() => {
    setSelectedCircleUserIds([]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          type,
          content,
          visibility,
          sealed,
          ...(visibility === "L1" && selectedCircleUserIds.length > 0
            ? { circleUserIds: selectedCircleUserIds }
            : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add contribution");
        return;
      }

      setContent("");
      setSealed(false);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const advancedTypes = CONTRIBUTION_TYPES.filter(
    (t) => !PRIMARY_CONTRIBUTION_TYPES.includes(t)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Add a Contribution</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Type selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              What kind of contribution?
            </label>
            <div className="flex flex-wrap gap-2">
              {PRIMARY_CONTRIBUTION_TYPES.map((t) => {
                const config = CONTRIBUTION_TYPE_CONFIG[t];
                return (
                  <Button
                    key={t}
                    type="button"
                    variant={type === t ? "default" : "outline"}
                    size="sm"
                    onClick={() => setType(t)}
                  >
                    {config.label}
                  </Button>
                );
              })}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedTypes(!showAdvancedTypes)}
              >
                {showAdvancedTypes ? "Less" : "More types..."}
              </Button>
            </div>
            {showAdvancedTypes && (
              <div className="flex flex-wrap gap-2 mt-2">
                {advancedTypes.map((t) => {
                  const config = CONTRIBUTION_TYPE_CONFIG[t];
                  return (
                    <Button
                      key={t}
                      type="button"
                      variant={type === t ? "default" : "outline"}
                      size="sm"
                      onClick={() => setType(t)}
                    >
                      {config.label}
                    </Button>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {CONTRIBUTION_TYPE_CONFIG[type].description}
            </p>
          </div>

          {/* Content */}
          <div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Share your ${CONTRIBUTION_TYPE_CONFIG[type].label.toLowerCase()}...`}
              rows={5}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {content.length}/10,000 &middot; Markdown supported
            </p>
          </div>

          {/* Visibility */}
          <div className="flex items-center gap-2">
            <span className="text-sm">Visibility:</span>
            {(["L0", "L1", "L2", "L3"] as VisibilityLevel[]).map((v) => (
              <Badge
                key={v}
                variant={visibility === v ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  setVisibility(v);
                  if (v !== "L1") setSelectedCircleUserIds([]);
                }}
              >
                {VISIBILITY_LABELS[v]}
              </Badge>
            ))}
          </div>

          {/* Circle member selection for L1 */}
          {visibility === "L1" && (
            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Who in your circle can see this?
                </span>
                {circleMembers.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                      onClick={selectAllCircle}
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                      onClick={deselectAllCircle}
                    >
                      Deselect all
                    </button>
                  </div>
                )}
              </div>
              {circleLoading ? (
                <p className="text-sm text-muted-foreground">Loading circle members...</p>
              ) : circleMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  You have no trusted circle members yet.{" "}
                  <Link href="/settings" className="underline hover:text-foreground">
                    Add people in Settings
                  </Link>
                </p>
              ) : (
                <div className="space-y-1">
                  {circleMembers.map((member) => (
                    <label
                      key={member.id}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedCircleUserIds.includes(member.trustedUser.id)}
                        onChange={() => toggleCircleUser(member.trustedUser.id)}
                      />
                      <span className="text-sm">
                        {member.trustedUser.displayName || member.trustedUser.name || member.trustedUser.email}
                      </span>
                    </label>
                  ))}
                  {selectedCircleUserIds.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      No members selected — your full circle will have access.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Seal checkbox */}
          <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
            <input
              type="checkbox"
              checked={sealed}
              onChange={(e) => setSealed(e.target.checked)}
              className="mt-0.5 rounded"
            />
            <div>
              <span className="text-sm font-medium">
                Seal this contribution
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Others will only see the SHA-256 hash until you choose to reveal the content.
                Proves you had the idea at this timestamp without sharing it yet.
              </p>
            </div>
          </label>

          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              A SHA-256 hash will be generated automatically for priority proof.
            </p>
            <Button
              type="submit"
              disabled={isSubmitting || content.length < 10}
            >
              {isSubmitting
                ? "Submitting..."
                : sealed
                  ? "Seal & Submit"
                  : "Submit Contribution"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
