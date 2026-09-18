"use client";

import { useT } from "@/components/language-provider";
import type { TranslateVars } from "@/lib/i18n";

/**
 * Inline translated text — use in server components where hooks aren't available.
 * Usage: <T k="home.title" /> renders the translated string for the current locale.
 * Placeholders: <T k="threads.countMany" vars={{ n: 3 }} />
 */
export function T({ k, vars }: { k: string; vars?: TranslateVars }) {
  const t = useT();
  return <>{t(k, vars)}</>;
}
