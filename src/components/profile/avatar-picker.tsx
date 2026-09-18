"use client";

import { useEffect, useState } from "react";
import { AvatarBadge } from "@/components/ui/avatar-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/components/language-provider";
import { TRich } from "@/components/profile/account-i18n";

// 36 selectable icons expected at /public/avatars/01.png … 36.png.
const ICON_COUNT = 36;
const ICONS = Array.from(
  { length: ICON_COUNT },
  (_, i) => `/avatars/${String(i + 1).padStart(2, "0")}.png`
);

export function AvatarPicker() {
  const [me, setMe] = useState<{
    id: string;
    image: string | null;
    displayName: string | null;
    name: string | null;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setMe)
      .catch(() => {});
  }, []);

  const choose = async (image: string | null) => {
    setSaving(true);
    setMe((prev) => (prev ? { ...prev, image } : prev));
    await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image }),
    }).catch(() => {});
    setSaving(false);
  };

  const name = me?.displayName || me?.name;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t("account.avatar.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <AvatarBadge name={name} seed={me?.id} image={me?.image} size="lg" />
          <p className="text-sm text-muted-foreground">
            {t("account.avatar.current")}{" "}
            {saving && <span>{t("account.avatar.saving")}</span>}
          </p>
        </div>

        <p className="text-xs font-medium mb-2">{t("account.avatar.coloredInitial")}</p>
        <button
          type="button"
          onClick={() => choose(null)}
          className={`rounded-full p-0.5 mb-4 ${
            !me?.image ? "ring-2 ring-ring" : "opacity-80 hover:opacity-100"
          }`}
          title={t("account.avatar.useInitial")}
        >
          <AvatarBadge name={name} seed={me?.id} size="md" />
        </button>

        <p className="text-xs font-medium mb-2">{t("account.avatar.pickIcon")}</p>
        <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
          {ICONS.map((src) => (
            <button
              key={src}
              type="button"
              onClick={() => choose(src)}
              className={`rounded-full p-0.5 transition ${
                me?.image === src
                  ? "ring-2 ring-ring"
                  : "opacity-80 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={t("account.avatar.optionAlt")}
                className="h-10 w-10 rounded-full object-cover bg-muted"
                loading="lazy"
              />
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          <TRich
            k="account.avatar.iconsNote"
            nodes={{ code: <code>/avatars/01–36.png</code> }}
          />
        </p>
      </CardContent>
    </Card>
  );
}
