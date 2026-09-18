"use client";

import { useI18n } from "@/components/language-provider";
import { formatDateL, formatDateTimeL, tagLabel, timeAgoL } from "@/lib/i18n";

// Locale-aware dates, usable from server components (like <T>).
// Replace timeAgo()/formatDate()/formatDateTime() from lib/utils in rendered UI.

export function TimeAgo({ date }: { date: Date | string }) {
  const { locale } = useI18n();
  return <>{timeAgoL(date, locale)}</>;
}

/** Domain tag, translated when it's a known tag (custom tags as typed). */
export function TagLabel({ tag }: { tag: string }) {
  const { locale } = useI18n();
  return <>{tagLabel(tag, locale)}</>;
}

export function LocalDate({
  date,
  withTime = false,
}: {
  date: Date | string;
  withTime?: boolean;
}) {
  const { locale } = useI18n();
  return <>{withTime ? formatDateTimeL(date, locale) : formatDateL(date, locale)}</>;
}
