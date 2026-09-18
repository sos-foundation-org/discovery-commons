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
import { useI18n } from "@/components/language-provider";
import {
  PRIMARY_CONTRIBUTION_TYPES,
  CONTRIBUTION_TYPES,
  THREAD_VISIBILITY,
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

/**
 * Render a translated string whose `{name}` placeholders become inline
 * elements (<code> by default) — keeps markup out of the dictionaries while
 * letting each language order the sentence its own way.
 */
function withCode(
  text: string,
  values: Record<string, string>,
  Tag: "code" | "strong" = "code"
) {
  return text.split(/(\{\w+\})/g).map((part, i) => {
    const m = part.match(/^\{(\w+)\}$/);
    return m && m[1] in values ? <Tag key={i}>{values[m[1]]}</Tag> : part;
  });
}

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
  const { t, te } = useI18n();
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

  const toggleMethod = (a: MethodAppliesTo) =>
    setMethodAppliesTo((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );

  const chooseVisibility = (v: VisibilityLevel) => {
    setVisibility(v);
    if (v !== "shared") setSelectedCircleUserIds([]);
  };

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
    (ct) => !PRIMARY_CONTRIBUTION_TYPES.includes(ct)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("form.addTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm" role="alert">
              {te(error)}
            </div>
          )}

          {/* Type selection */}
          <div>
            <p id="contrib-type-label" className="block text-sm font-medium mb-2">
              {t("form.kind")}
            </p>
            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="contrib-type-label">
              {PRIMARY_CONTRIBUTION_TYPES.map((ct) => {
                return (
                  <Button
                    key={ct}
                    type="button"
                    variant={type === ct ? "default" : "outline"}
                    size="sm"
                    className="gap-1.5"
                    aria-pressed={type === ct}
                    onClick={() => setType(ct)}
                  >
                    <TypeIcon type={ct} className="h-4 w-4" />
                    {t(`type.${ct}`)}
                  </Button>
                );
              })}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedTypes(!showAdvancedTypes)}
              >
                {showAdvancedTypes ? t("form.less") : t("form.moreTypes")}
              </Button>
            </div>
            {showAdvancedTypes && (
              <div className="flex flex-wrap gap-2 mt-2">
                {advancedTypes.map((ct) => {
                  return (
                    <Button
                      key={ct}
                      type="button"
                      variant={type === ct ? "default" : "outline"}
                      size="sm"
                      aria-pressed={type === ct}
                      onClick={() => setType(ct)}
                    >
                      {t(`type.${ct}`)}
                    </Button>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {t(`typeDesc.${type}`)}
            </p>
          </div>

          {/* Method: which activities does it support? */}
          {type === "methodology" && (
            <div className="rounded-lg border p-3">
              <p id="method-applies-label" className="text-sm font-medium mb-2">
                {t("form.methodApplies")}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  {t("form.pickAll")}
                </span>
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-labelledby="method-applies-label">
                {METHOD_APPLIES_TO.map((a) => {
                  const cfg = METHOD_APPLIES_TO_CONFIG[a];
                  const active = methodAppliesTo.includes(a);
                  return (
                    <Badge
                      key={a}
                      variant={active ? "default" : "outline"}
                      className={`cursor-pointer ${active ? "" : cfg.color}`}
                      role="button"
                      tabIndex={0}
                      aria-pressed={active}
                      onClick={() => toggleMethod(a)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleMethod(a);
                        }
                      }}
                    >
                      {t(`method.${a}`)}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Data: link to the raw dataset (not uploaded — hosted elsewhere) */}
          {type === "data" && (
            <div className="rounded-lg border p-3">
              <label htmlFor="contrib-data-url" className="block text-sm font-medium mb-1">
                {t("form.dataLink")}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  {t("common.optional")}
                </span>
              </label>
              <Input
                id="contrib-data-url"
                type="url"
                value={dataUrl}
                onChange={(e) => setDataUrl(e.target.value)}
                placeholder="https://zenodo.org/… · OSF · GitHub · a CSV URL"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t("form.dataLinkHint")}
              </p>
            </div>
          )}

          {/* Content */}
          <div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("form.contentPlaceholder", { type: t(`type.${type}`).toLowerCase() })}
              aria-label={t("form.contentLabel")}
              rows={5}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {content.length}/10,000 &middot;{" "}
              {withCode(t("form.contentHint"), {
                img: "![alt](url)",
                chart: "```chart",
                embed: "```embed",
              })}
            </p>
          </div>

          {/* Visibility */}
          <div className="flex items-center gap-2" role="group" aria-labelledby="contrib-visibility-label">
            <span id="contrib-visibility-label" className="text-sm">{t("form.visibility")}</span>
            {THREAD_VISIBILITY.map((v) => (
              <Badge
                key={v}
                variant={visibility === v ? "default" : "outline"}
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                aria-pressed={visibility === v}
                onClick={() => chooseVisibility(v)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    chooseVisibility(v);
                  }
                }}
              >
                {t(`vis.${v}`)}
              </Badge>
            ))}
          </div>

          {/* Circle member selection for shared visibility */}
          {visibility === "shared" && (
            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {t("form.circleWho")}
                </span>
                {circleMembers.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                      onClick={selectAllCircle}
                    >
                      {t("form.selectAll")}
                    </button>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                      onClick={deselectAllCircle}
                    >
                      {t("form.deselectAll")}
                    </button>
                  </div>
                )}
              </div>
              {circleLoading ? (
                <p className="text-sm text-muted-foreground">{t("form.loadingCircle")}</p>
              ) : circleMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("form.noCircle")}{" "}
                  <Link href="/settings" className="underline hover:text-foreground">
                    {t("form.addInSettings")}
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
                      {t("form.noneSelected")}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Access & Pricing — progressive disclosure */}
          <div className="rounded-lg border p-3 space-y-3">
            <p id="contrib-access-label" className="block text-sm font-medium">
              {t("form.accessTitle")}
            </p>
            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="contrib-access-label">
              {(
                [
                  { mode: "open" as AccessMode, label: `🌐 ${t("form.freeOpen")}` },
                  { mode: "priced" as AccessMode, label: `🔓 ${t("form.priced")}` },
                  { mode: "collab_open" as AccessMode, label: `🤝 ${t("form.collaboration")}` },
                  { mode: "priced_collab" as AccessMode, label: `🔓+🤝 ${t("form.both")}` },
                ] as const
              ).map(({ mode, label }) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={accessMode === mode}
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
                  <label htmlFor="contrib-price" className="text-xs text-muted-foreground">{t("form.price")}</label>
                  <Input
                    id="contrib-price"
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
                  <label htmlFor="contrib-why-gated" className="text-xs text-muted-foreground">
                    {t("form.whyGatedLong")}
                  </label>
                  <Input
                    id="contrib-why-gated"
                    value={whyGated}
                    onChange={(e) => setWhyGated(e.target.value)}
                    placeholder={t("form.whyGatedPlaceholder")}
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
                <div className="flex items-center gap-2" role="group" aria-labelledby="contrib-collab-type-label">
                  <span id="contrib-collab-type-label" className="text-xs text-muted-foreground">{t("form.collabType")}</span>
                  {COLLAB_SEEKING_TYPES.map((st) => {
                    const cfg = COLLAB_SEEKING_LABELS[st];
                    return (
                      <button
                        key={st}
                        type="button"
                        aria-pressed={collabSeekingType === st}
                        onClick={() => setCollabSeekingType(st)}
                        className={`px-2 py-1 rounded text-xs border transition-colors ${
                          collabSeekingType === st
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:bg-accent"
                        }`}
                      >
                        {cfg.icon} {t(`collab.${st}`)}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="contrib-min-level" className="text-xs text-muted-foreground">{t("form.minLevel")}</label>
                  <select
                    id="contrib-min-level"
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
                  <label htmlFor="contrib-collab-desc" className="text-xs text-muted-foreground">
                    {t("form.lookingFor")}
                  </label>
                  <Input
                    id="contrib-collab-desc"
                    value={collabDescription}
                    onChange={(e) => setCollabDescription(e.target.value)}
                    placeholder={t("form.lookingForPlaceholder")}
                    className="h-8 text-sm mt-1"
                    maxLength={300}
                  />
                </div>
                {accessMode !== "priced_collab" && !whyGated && (
                  <div>
                    <label htmlFor="contrib-why-gated-collab" className="text-xs text-muted-foreground">
                      {t("form.whyGated")}
                    </label>
                    <Input
                      id="contrib-why-gated-collab"
                      value={whyGated}
                      onChange={(e) => setWhyGated(e.target.value)}
                      placeholder={t("form.whyGatedCollabPlaceholder")}
                      className="h-8 text-sm mt-1"
                      maxLength={200}
                    />
                  </div>
                )}
              </div>
            )}

            {accessMode === "open" && (
              <p className="text-xs text-muted-foreground">
                {t("form.openHint")}
              </p>
            )}
          </div>

          {/* License selector */}
          <div className="rounded-lg border p-3 space-y-2">
            <label htmlFor="contrib-license" className="block text-sm font-medium">
              {t("form.licenseTitle")}
            </label>
            <select
              id="contrib-license"
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
                    {cfg.shortLabel}{cfg.irrevocable ? ` ${t("form.irrevocable")}` : ""}
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
                {t("form.readLicense")}
              </a>
            )}
            {/* Irrevocable warning + confirmation */}
            {showLicenseConfirm && CONTENT_LICENSE_CONFIG[license].irrevocable && (
              <div className="rounded-md border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 p-3 text-sm space-y-2">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  &#x26A0; {t("form.irrevocableTitle")}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  {withCode(
                    t("form.irrevocableBody"),
                    { license: CONTENT_LICENSE_CONFIG[license].shortLabel },
                    "strong"
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => setShowLicenseConfirm(false)}
                  className="px-3 py-1.5 min-h-[44px] rounded-md text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                >
                  {t("form.irrevocableConfirm", {
                    license: CONTENT_LICENSE_CONFIG[license].shortLabel,
                  })}
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
                {t("form.seal")}
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("form.sealDesc")}
              </p>
            </div>
          </label>

          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              {t("form.hashNote")}
            </p>
            <Button
              type="submit"
              disabled={isSubmitting || content.length < 10}
            >
              {isSubmitting
                ? t("form.submitting")
                : sealed
                  ? t("form.sealSubmit")
                  : t("form.submit")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
