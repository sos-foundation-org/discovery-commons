"use client";

import { useT } from "@/components/language-provider";

/**
 * Inline translated text — use in server components where hooks aren't available.
 * Usage: <T k="home.title" /> renders the translated string for the current locale.
 */
export function T({ k }: { k: string }) {
  const t = useT();
  return <>{t(k)}</>;
}
