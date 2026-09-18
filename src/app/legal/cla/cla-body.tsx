"use client";

import Link from "next/link";
import { useT } from "@/components/language-provider";
import { LegalHeader, rich } from "../rich";

// License list: display name (untranslated CC codes, or a dictionary key) + description key.
const LICENSE_TYPES: { name: string; nameKey?: string; descKey: string }[] = [
  { name: "CC BY 4.0", descKey: "legal.cla.types.ccBy" },
  { name: "CC BY-SA 4.0", descKey: "legal.cla.types.ccBySa" },
  { name: "CC BY-NC 4.0", descKey: "legal.cla.types.ccByNc" },
  { name: "CC BY-NC-SA 4.0", descKey: "legal.cla.types.ccByNcSa" },
  { name: "CC BY-ND 4.0", descKey: "legal.cla.types.ccByNd" },
  { name: "CC BY-NC-ND 4.0", descKey: "legal.cla.types.ccByNcNd" },
  { name: "", nameKey: "legal.cla.arr", descKey: "legal.cla.types.arr" },
  { name: "", nameKey: "legal.cla.dcLicense", descKey: "legal.cla.types.dc" },
];

export function ClaBody() {
  const t = useT();
  const strong = (k: string) => <strong>{t(k)}</strong>;
  return (
    <>
      <h1>{t("legal.cla.title")}</h1>
      <LegalHeader />
      <p className="text-muted-foreground">{t("legal.cla.intro")}</p>

      <h2>{t("legal.cla.ip.h")}</h2>

      <h3>{t("legal.cla.ownership.h")}</h3>
      <p>{rich(t("legal.cla.ownership.p"), { not: strong("legal.cla.not") })}</p>

      <h3>{t("legal.cla.does.h")}</h3>
      <p>{t("legal.cla.does.p")}</p>
      <ul>
        <li>
          {rich(t("legal.cla.does.store"), { label: strong("legal.cla.does.store.label") })}
        </li>
        <li>
          {rich(t("legal.cla.does.generate"), {
            label: strong("legal.cla.does.generate.label"),
          })}
        </li>
        <li>
          {rich(t("legal.cla.does.exercise"), {
            label: strong("legal.cla.does.exercise.label"),
          })}
        </li>
      </ul>
      <p>{rich(t("legal.cla.noSell"), { not: strong("legal.cla.not") })}</p>

      <h2>{t("legal.cla.research.h")}</h2>
      <ul>
        <li>
          {rich(t("legal.cla.research.keep"), {
            label: strong("legal.cla.research.keep.label"),
          })}
        </li>
        <li>
          {rich(t("legal.cla.research.license"), {
            license: strong("legal.cla.research.licenseWord"),
          })}
        </li>
      </ul>

      <h3>{t("legal.cla.defaults.h")}</h3>
      <table>
        <thead>
          <tr>
            <th>{t("legal.cla.table.mode")}</th>
            <th>{t("legal.cla.table.default")}</th>
            <th>{t("legal.cla.table.change")}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{t("legal.cla.row.open.mode")}</td>
            <td>
              <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">
                CC BY 4.0
              </a>
            </td>
            <td>{t("legal.cla.row.open.change")}</td>
          </tr>
          <tr>
            <td>{t("legal.cla.row.priced.mode")}</td>
            <td>{t("legal.cla.arr")}</td>
            <td>{t("legal.cla.row.priced.change")}</td>
          </tr>
          <tr>
            <td>{t("legal.cla.row.collab.mode")}</td>
            <td>{t("legal.cla.dcLicense")}</td>
            <td>{t("legal.cla.row.collab.change")}</td>
          </tr>
          <tr>
            <td>{t("legal.cla.row.private.mode")}</td>
            <td>{t("legal.cla.row.private.default")}</td>
            <td>{t("legal.cla.row.private.change")}</td>
          </tr>
        </tbody>
      </table>

      <h3>{t("legal.cla.irrev.h")}</h3>
      <p>
        {rich(t("legal.cla.irrev.p1"), {
          irrevocable: strong("legal.cla.irrev.irrevocable"),
        })}
      </p>
      <p>{rich(t("legal.cla.irrev.p2"), { can: strong("legal.cla.irrev.can") })}</p>

      <h3>{t("legal.cla.types.h")}</h3>
      <ul>
        {LICENSE_TYPES.map((l) => (
          <li key={l.descKey}>
            <strong>{l.nameKey ? t(l.nameKey) : l.name}</strong> — {t(l.descKey)}
          </li>
        ))}
      </ul>

      <h2>{t("legal.cla.attr.h")}</h2>
      <p>{t("legal.cla.attr.p")}</p>

      <h2>{t("legal.cla.code.h")}</h2>
      <p>{rich(t("legal.cla.code.p"), { agpl: <strong>AGPL-3.0</strong> })}</p>

      <p className="text-xs text-muted-foreground">
        {rich(t("legal.cla.footer"), {
          terms: <Link href="/legal/terms">{t("legal.link.terms")}</Link>,
          privacy: <Link href="/legal/privacy">{t("legal.link.privacy")}</Link>,
        })}
      </p>
    </>
  );
}
