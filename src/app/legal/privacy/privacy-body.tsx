"use client";

import Link from "next/link";
import { useT } from "@/components/language-provider";
import { LegalHeader, rich } from "../rich";

export function PrivacyBody() {
  const t = useT();
  return (
    <>
      <h1>{t("legal.privacy.title")}</h1>
      <LegalHeader />
      <p className="text-muted-foreground">{t("legal.privacy.intro")}</p>

      <h2>{t("legal.privacy.collect.h")}</h2>
      <ul>
        <li>
          {rich(t("legal.privacy.collect.account"), {
            label: <strong>{t("legal.privacy.collect.account.label")}</strong>,
            openid: <code>openid</code>,
            email: <code>email</code>,
            profile: <code>profile</code>,
          })}
        </li>
        <li>
          {rich(t("legal.privacy.collect.content"), {
            label: <strong>{t("legal.privacy.collect.content.label")}</strong>,
          })}
        </li>
        <li>
          {rich(t("legal.privacy.collect.integrity"), {
            label: <strong>{t("legal.privacy.collect.integrity.label")}</strong>,
          })}
        </li>
      </ul>

      <h2>{t("legal.privacy.use.h")}</h2>
      <ul>
        <li>{t("legal.privacy.use.operate")}</li>
        <li>
          {rich(t("legal.privacy.use.visibility"), {
            link: <Link href="/about">{t("legal.privacy.use.visibilityLink")}</Link>,
          })}
        </li>
      </ul>
      <p>
        {rich(t("legal.privacy.use.noSell"), {
          not: <strong>{t("legal.privacy.use.not")}</strong>,
        })}
      </p>

      <h2>{t("legal.privacy.where.h")}</h2>
      <p>{t("legal.privacy.where.p")}</p>

      <h2>{t("legal.privacy.choices.h")}</h2>
      <ul>
        <li>{t("legal.privacy.choices.visibility")}</li>
        <li>{t("legal.privacy.choices.deletion")}</li>
      </ul>

      <h2>{t("legal.privacy.contact.h")}</h2>
      <p>{t("legal.privacy.contact.p")}</p>

      <p className="text-xs text-muted-foreground">
        {rich(t("legal.privacy.footer"), {
          link: <Link href="/legal/terms">{t("legal.link.terms")}</Link>,
        })}
      </p>
    </>
  );
}
