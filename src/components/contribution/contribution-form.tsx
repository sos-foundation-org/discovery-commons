"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TypeIcon } from "@/components/contribution/type-icon";
import {
  CONTRIBUTION_TYPE_CONFIG,
  PRIMARY_CONTRIBUTION_TYPES,
  CONTRIBUTION_TYPES,
  THREAD_VISIBILITY,
  VISIBILITY_LABELS,
  METHOD_APPLIES_TO,
  METHOD_APPLIES_TO_CONFIG,
  ACCESS_MODES,
  ACCESS_MODE_LABELS,
  COLLAB_SEEKING_TYPES,
  COLLAB_SEEKING_LABELS,
  LEVELS,
  CONTENT_LICENSES,
  CONTENT_LICENSE_CONFIG,
  getDefaultLicense,
  type ContributionType,
  type VisibilityLevel,
  type MethodAppliesTo,
  type AccessMode,
  type CollabSeekingType,
  type ContentLicense,
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
  const [methodAppliesTo, setMethodAppliesTo] = useState<MethodAppliesTo[]>([]);
  const [dataUrl, setDataUrl] = useState("");
  const [showAdvancedTypes, setShowAdvancedTypes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  // Pricing & collaboration (Phase 2)
  const [accessMode, setAccessMode] = useState<AccessMode>("open");
  const [price, setPrice] = useState<number>(0);
  const [whyGated, setWhyGated] = useState("");
  const [collabSeekingType, setCollabSeekingType] = useState<CollabSeekingType>("either");
  const [collabMinLevel, setCollabMinLevel] = useState<number>(1);
  const [collabDescription, setCollabDescription] = useState("");
  const [license, setLicense] = useState<ContentLicense>("cc_by");
  const [showLicenseConfirm, setShowLicenseConfirm] = useState(false);
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
          ...(type === "methodology" && methodAppliesTo.length > 0
            ? { methodAppliesTo }
            : {}),
          ...(type === "data" && dataUrl.trim() ? { dataUrl: dataUrl.trim() } : {}),
          ...(visibility === "shared" && selectedCircleUserIds.length > 0
            ? { circleUserIds: selectedCircleUserIds }
            : {}),
          // License
          license,
          // Pricing metadata (Phase 2)
          ...(accessMode !== "open"
            ? {
                accessMode,
                ...(price > 0 ? { price } : {}),
                ...(whyGated.trim() ? { whyGated: whyGated.trim() } : {}),
                ...(accessMode.includes("collab")
                  ? {
                      collaborationGate: {
                        seekingType: collabSeekingType,
                        minLevel: collabMinLevel,
                        ...(collabDescription.trim()
                          ? { description: collabDescription.trim() }
                          : {}),
                      },
                    }
                  : {}),
              }
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
                    className="gap-1.5"
                    onClick={() => setType(t)}
                  >
                    <TypeIcon type={t} className="h-4 w-4" />
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

          {/* Method: which activities does it support? */}
          {type === "methodology" && (
            <div className="rounded-lg border p-3">
              <p className="text-sm font-medium mb-2">
                This method applies to…{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (pick all that fit)
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {METHOD_APPLIES_TO.map((a) => {
                  const cfg = METHOD_APPLIES_TO_CONFIG[a];
                  const active = methodAppliesTo.includes(a);
                  return (
                    <Badge
                      key={a}
                      variant={active ? "default" : "outline"}
                      className={`cursor-pointer ${active ? "" : cfg.color}`}
                      onClick={() =>
                        setMethodAppliesTo((prev) =>
                          prev.includes(a)
                            ? prev.filter((x) => x !== a)
                            : [...prev, a]
                        )
                      }
                    >
                      {cfg.label}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Data: link to the raw dataset (not uploaded — hosted elsewhere) */}
          {type === "data" && (
            <div className="rounded-lg border p-3">
              <label className="block text-sm font-medium mb-1">
                Raw data link{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <Input
                type="url"
                value={dataUrl}
                onChange={(e) => setDataUrl(e.target.value)}
                placeholder="https://zenodo.org/… · OSF · GitHub · a CSV URL"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Link to where the dataset lives so others (and code) can fetch it.
              </p>
            </div>
          )}

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
              {content.length}/10,000 &middot; Markdown supported &middot; embed an
              image with <code>![alt](url)</code>, a chart with a{" "}
              <code>```chart</code> block, or a video with <code>```embed</code>
            </p>
          </div>

          {/* Visibility */}
          <div className="flex items-center gap-2">
            <span className="text-sm">Visibility:</span>
            {THREAD_VISIBILITY.map((v) => (
              <Badge
                key={v}
                variant={visibility === v ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  setVisibility(v);
                  if (v !== "shared") setSelectedCircleUserIds([]);
                }}
              >
                {VISIBILITY_LABELS[v]}
              </Badge>
            ))}
          </div>

          {/* Circle member selection for shared visibility */}
          {visibility === "shared" && (
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

          {/* Access & Pricing — progressive disclosure */}
          <div className="rounded-lg border p-3 space-y-3">
            <label className="block text-sm font-medium">
              Access &amp; Pricing
            </label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { mode: "open" as AccessMode, label: "🌐 Free & Open" },
                  { mode: "priced" as AccessMode, label: "🔓 Priced" },
                  { mode: "collab_open" as AccessMode, label: "🤝 Collaboration" },
                  { mode: "priced_collab" as AccessMode, label: "🔓+🤝 Both" },
                ] as const
              ).map(({ mode, label }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setAccessMode(mode)}
                  className={`px-3 py-2 min-h-[44px] rounded-md text-sm border transition-colors ${
                    accessMode === mode
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:bg-accent"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Priced options */}
            {(accessMode === "priced" || accessMode === "priced_collab") && (
              <div className="space-y-2 pl-1">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Price:</label>
                  <Input
                    type="number"
                    min={1}
                    max={1000}
                    value={price || ""}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    placeholder="e.g. 50"
                    className="w-24 h-8 text-sm"
                  />
                  <span className="text-xs text-muted-foreground">DP</span>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Why gated? (helps buyers understand the value)
                  </label>
                  <Input
                    value={whyGated}
                    onChange={(e) => setWhyGated(e.target.value)}
                    placeholder="e.g. 3 years of field recordings + calibration pipeline"
                    className="h-8 text-sm mt-1"
                    maxLength={200}
                  />
                </div>
              </div>
            )}

            {/* Collaboration options */}
            {(accessMode === "collab_open" ||
              accessMode === "collab_gated" ||
              accessMode === "priced_collab") && (
              <div className="space-y-2 pl-1">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Type:</label>
                  {COLLAB_SEEKING_TYPES.map((t) => {
                    const cfg = COLLAB_SEEKING_LABELS[t];
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setCollabSeekingType(t)}
                        className={`px-2 py-1 rounded text-xs border transition-colors ${
                          collabSeekingType === t
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:bg-accent"
                        }`}
                      >
                        {cfg.icon} {cfg.label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Min level:</label>
                  <select
                    value={collabMinLevel}
                    onChange={(e) => setCollabMinLevel(Number(e.target.value))}
                    className="px-2 py-1 rounded border bg-background text-xs"
                  >
                    {LEVELS.map((l) => (
                      <option key={l.level} value={l.level}>
                        {l.icon} Lv.{l.level} {l.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    What are you looking for?
                  </label>
                  <Input
                    value={collabDescription}
                    onChange={(e) => setCollabDescription(e.target.value)}
                    placeholder="e.g. Statistician to validate density estimation model"
                    className="h-8 text-sm mt-1"
                    maxLength={300}
                  />
                </div>
                {accessMode !== "priced_collab" && !whyGated && (
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Why gated?
                    </label>
                    <Input
                      value={whyGated}
                      onChange={(e) => setWhyGated(e.target.value)}
                      placeholder="e.g. Unpublished methodology — seeking co-author"
                      className="h-8 text-sm mt-1"
                      maxLength={200}
                    />
                  </div>
                )}
              </div>
            )}

            {accessMode === "open" && (
              <p className="text-xs text-muted-foreground">
                Everyone can read the full content. You earn DP from likes,
                citations, and reviews.
              </p>
            )}
          </div>

          {/* License selector */}
          <div className="rounded-lg border p-3 space-y-2">
            <label className="block text-sm font-medium">
              License (Intellectual Property)
            </label>
            <select
              value={license}
              onChange={(e) => {
                const newLicense = e.target.value as ContentLicense;
                const cfg = CONTENT_LICENSE_CONFIG[newLicense];
                if (cfg.irrevocable) {
                  setShowLicenseConfirm(true);
                }
                setLicense(newLicense);
              }}
              className="w-full px-3 py-2 min-h-[44px] rounded-md border bg-background text-sm"
            >
              {CONTENT_LICENSES.map((l) => {
                const cfg = CONTENT_LICENSE_CONFIG[l];
                return (
                  <option key={l} value={l}>
                    {cfg.shortLabel}{cfg.irrevocable ? " (irrevocable)" : ""}
                  </option>
                );
              })}
            </select>
            <p className="text-xs text-muted-foreground">
              {CONTENT_LICENSE_CONFIG[license].description}
            </p>
            {CONTENT_LICENSE_CONFIG[license].url && (
              <a
                href={CONTENT_LICENSE_CONFIG[license].url!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Read the full license text &rarr;
              </a>
            )}
            {/* Irrevocable warning + confirmation */}
            {showLicenseConfirm && CONTENT_LICENSE_CONFIG[license].irrevocable && (
              <div className="rounded-md border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 p-3 text-sm space-y-2">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  &#x26A0; This license is irrevocable
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Once you publish under <strong>{CONTENT_LICENSE_CONFIG[license].shortLabel}</strong>,
                  you cannot later change to a more restrictive license.
                  Others who have accessed this content under this license
                  retain their rights permanently. You still own the work —
                  you just cannot revoke the permissions already granted.
                </p>
                <button
                  type="button"
                  onClick={() => setShowLicenseConfirm(false)}
                  className="px-3 py-1.5 min-h-[44px] rounded-md text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                >
                  I understand — proceed with {CONTENT_LICENSE_CONFIG[license].shortLabel}
                </button>
              </div>
            )}
          </div>

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
