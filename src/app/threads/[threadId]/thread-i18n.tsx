"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useI18n } from "@/components/language-provider";
import { formatDateTimeL, timeAgoL, type TranslateVars } from "@/lib/i18n";

// Tiny client helpers for the thread page: elements whose translated text lives
// in an attribute (title), or that combine a translated string with a
// locale-formatted date. Markup/classes match the original server markup.

export function TitledDiv({
  titleKey,
  vars,
  className,
  children,
}: {
  titleKey: string;
  vars?: TranslateVars;
  className?: string;
  children?: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className={className} title={t(titleKey, vars)}>
      {children}
    </div>
  );
}

export function TitledSpan({
  titleKey,
  vars,
  className,
  children,
}: {
  titleKey: string;
  vars?: TranslateVars;
  className?: string;
  children?: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <span className={className} title={t(titleKey, vars)}>
      {children}
    </span>
  );
}

/** "Sealed 5m ago" */
export function SealedAgo({ date }: { date: Date | string | null }) {
  const { t, locale } = useI18n();
  if (!date) return <>{t("vis.sealed")}</>;
  return <>{t("thread.sealedAgo", { time: timeAgoL(date, locale) })}</>;
}

/** "✓ Proof of existence recorded[: <date time>]" */
export function ProofRecorded({ date }: { date: Date | string | null }) {
  const { t, locale } = useI18n();
  if (!date) return <>{t("thread.proofRecorded")}</>;
  return (
    <>{t("thread.proofRecordedAt", { date: formatDateTimeL(date, locale) })}</>
  );
}

export function VerifyHashLink({
  hash,
  className,
  children,
}: {
  hash: string;
  className?: string;
  children?: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <Link
      href={`/verify/${hash}`}
      title={t("thread.verifyHash", { hash })}
      className={className}
    >
      {children}
    </Link>
  );
}

export function LicenseBadge({
  licenseKey,
  url,
}: {
  licenseKey: string;
  url?: string | null;
}) {
  const { t } = useI18n();
  const label = t(`license.${licenseKey}`);
  const short = t(`licenseShort.${licenseKey}`);
  return url ? (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-foreground hover:underline"
      title={label}
    >
      {short}
    </a>
  ) : (
    <span title={label}>{short}</span>
  );
}
