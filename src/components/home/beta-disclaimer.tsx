"use client";

import { useState } from "react";
import { useT } from "@/components/language-provider";

/**
 * Beta notice shown as a full-screen overlay on the home page, mirroring the
 * ECI Ontology site's prototype disclaimer. Shown on every visit to `/` until
 * dismissed (no persistence, same as the ECI site).
 */
export function BetaDisclaimer() {
  const t = useT();
  const [open, setOpen] = useState(true);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 px-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="beta-disclaimer-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-8 text-card-foreground">
        <h2 id="beta-disclaimer-title" className="mb-4 text-2xl font-light">
          {t("disclaimer.title")}
        </h2>
        <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
          {t("disclaimer.body")}
        </p>
        <button
          type="button"
          autoFocus
          onClick={() => setOpen(false)}
          className="w-full rounded-full border border-primary bg-primary/10 py-3 text-sm font-medium tracking-wide text-primary transition-all hover:scale-[1.02] hover:opacity-90"
        >
          {t("disclaimer.button")}
        </button>
      </div>
    </div>
  );
}
