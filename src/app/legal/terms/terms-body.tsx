"use client";

import Link from "next/link";
import { useT } from "@/components/language-provider";
import { LegalHeader, rich } from "../rich";

export function TermsBody() {
  const t = useT();
  return (
    <>
      <h1>{t("legal.terms.title")}</h1>
      <LegalHeader />
      <p className="text-muted-foreground">{t("legal.terms.intro")}</p>

      <h2>{t("legal.terms.alpha.h")}</h2>
      <p>
        {rich(t("legal.terms.alpha.p"), {
          asIs: <strong>{t("legal.terms.alpha.asIs")}</strong>,
        })}
      </p>

      <h2>{t("legal.terms.content.h")}</h2>
      <p>
        {rich(t("legal.terms.content.p"), {
          link: <Link href="/legal/cla">{t("legal.link.cla")}</Link>,
        })}
      </p>

      <h2>{t("legal.terms.hash.h")}</h2>
      <p>
        {rich(t("legal.terms.hash.p"), {
          evidence: <strong>{t("legal.terms.hash.evidence")}</strong>,
          not: <strong>{t("legal.terms.hash.not")}</strong>,
        })}
      </p>

      <h2>{t("legal.terms.use.h")}</h2>
      <p>
        {rich(t("legal.terms.use.p"), {
          link: <Link href="/about">{t("legal.link.about")}</Link>,
        })}
      </p>

      <h2>{t("legal.terms.liability.h")}</h2>
      <p>{t("legal.terms.liability.p")}</p>

      <h2>{t("legal.terms.law.h")}</h2>
      <p>{t("legal.terms.law.p")}</p>

      <p className="text-xs text-muted-foreground">
        {rich(t("legal.terms.seeAlso"), {
          link: <Link href="/legal/privacy">{t("legal.link.privacy")}</Link>,
        })}
      </p>
    </>
  );
}
