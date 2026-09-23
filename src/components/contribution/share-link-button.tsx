"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/language-provider";

// Author control: create/copy/revoke an "unlisted" link that lets anyone with
// it view a not-public contribution (like a YouTube unlisted link).
export function ShareLinkButton({
  contributionId,
  initialPath,
}: {
  contributionId: string;
  initialPath: string | null;
}) {
  const [path, setPath] = useState<string | null>(initialPath);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const { t } = useI18n();

  const fullUrl =
    path && typeof window !== "undefined" ? window.location.origin + path : path;

  const create = async () => {
    setBusy(true);
    setError("");
    const res = await fetch(
      `/api/contributions/${contributionId}/share-link`,
      { method: "POST" }
    ).catch(() => null);
    if (res?.ok) {
      const d = await res.json();
      setPath(d.path);
      if (d.path) copy(window.location.origin + d.path);
    } else {
      setError(t("contribution.createLinkFailed") ?? "Failed to create link");
    }
    setBusy(false);
  };

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* blocked */
    }
  };

  const revoke = async () => {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/contributions/${contributionId}/share-link`, {
      method: "DELETE",
    }).catch(() => null);
    if (res?.ok) {
      setPath(null);
    } else {
      setError(t("contribution.revokeFailed") ?? "Failed to revoke link");
    }
    setBusy(false);
  };

  if (!path) {
    return (
      <div className="flex flex-col items-start gap-1">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs"
          onClick={create}
          disabled={busy}
        >
          <Link2 className="h-3.5 w-3.5" />
          {busy ? "…" : t("contribution.createPrivateLink")}
        </Button>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="max-w-[16rem] truncate rounded bg-muted px-2 py-1 text-xs">
        {fullUrl}
      </code>
      <button
        type="button"
        onClick={() => fullUrl && copy(fullUrl)}
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Link2 className="h-3.5 w-3.5" />}
        {copied ? t("contribution.copied") : t("contribution.copy")}
      </button>
      <button
        type="button"
        onClick={revoke}
        disabled={busy}
        className="text-xs text-muted-foreground underline hover:text-red-600"
      >
        {t("contribution.revoke")}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
