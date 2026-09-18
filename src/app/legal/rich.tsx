"use client";

import { Fragment, type ReactNode } from "react";
import { useT } from "@/components/language-provider";

/**
 * Render a translated string whose `{name}` placeholders are replaced by
 * React nodes (links, <strong>, <code>), so each language can order the
 * sentence naturally while markup stays out of the dictionary.
 */
export function rich(s: string, parts: Record<string, ReactNode>): ReactNode {
  return s.split(/(\{\w+\})/).map((seg, i) => {
    const m = /^\{(\w+)\}$/.exec(seg);
    if (m && m[1] in parts) return <Fragment key={i}>{parts[m[1]]}</Fragment>;
    return seg;
  });
}

/** "Effective date" line plus, in Chinese locales only, the reference-translation notice. */
export function LegalHeader() {
  const t = useT();
  const notice = t("legal.zhNotice");
  return (
    <>
      <p className="text-muted-foreground">{t("legal.effectiveDate")}</p>
      {notice && <p className="text-xs text-muted-foreground">{notice}</p>}
    </>
  );
}
