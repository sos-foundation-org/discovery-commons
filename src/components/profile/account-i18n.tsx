"use client";

import { Fragment, type ReactNode } from "react";
import { useI18n } from "@/components/language-provider";
import type { TranslateVars } from "@/lib/i18n";
import { rawIdLabel, creditTypeLabel } from "@/lib/i18n-dicts/account-notifications";

// Small client helpers so the account-area server pages can render translated
// text where a plain <T> isn't enough.

/**
 * Translated string with React nodes spliced into `{placeholders}`, so each
 * language can order the sentence naturally. Usage:
 * <TRich k="account.profile.joinedOn" nodes={{ date: <LocalDate date={d} /> }} />
 */
export function TRich({
  k,
  vars,
  nodes,
}: {
  k: string;
  vars?: TranslateVars;
  nodes: Record<string, ReactNode>;
}) {
  const { t } = useI18n();
  const parts = t(k, vars).split(/\{(\w+)\}/);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <Fragment key={i}>{p in nodes ? nodes[p] : `{${p}}`}</Fragment>
        ) : (
          p
        )
      )}
    </>
  );
}

/** Raw enum id shown verbatim in English; translated via `k` elsewhere. */
export function IdLabel({ id, k }: { id: string; k: string }) {
  const { locale } = useI18n();
  return <>{rawIdLabel(id, k, locale)}</>;
}

/** Credit (v1) type id: raw in English, translated elsewhere. */
export function CreditTypeLabel({ id }: { id: string }) {
  const { locale } = useI18n();
  return <>{creditTypeLabel(id, locale)}</>;
}

/** Level chip on the own-profile header (needs a translated `title`). */
export function LevelChip({
  level,
  icon,
  reputation,
}: {
  level: number;
  icon: string;
  reputation: number;
}) {
  const { t } = useI18n();
  const name = t(`level.${level}`);
  return (
    <span
      className="text-sm font-medium text-muted-foreground bg-muted rounded-full px-2.5 py-0.5"
      title={t("account.profile.levelTitle", { level: name, rep: reputation })}
    >
      {icon} {name} (Lv.{level})
    </span>
  );
}
