"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";

// Copies a link to the clipboard. `path` is resolved against the current origin.
export function CopyLinkButton({
  path,
  label = "Copy link",
}: {
  path: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const url =
      typeof window !== "undefined" ? window.location.origin + path : path;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      title={label}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-green-600" /> Copied
        </>
      ) : (
        <>
          <Link2 className="h-3.5 w-3.5" /> {label}
        </>
      )}
    </button>
  );
}
