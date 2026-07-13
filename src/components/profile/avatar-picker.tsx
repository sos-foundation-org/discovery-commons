"use client";

import { useEffect, useState } from "react";
import { AvatarBadge } from "@/components/ui/avatar-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
        <CardTitle>Avatar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <AvatarBadge name={name} seed={me?.id} image={me?.image} size="lg" />
          <p className="text-sm text-muted-foreground">
            Your current avatar. Pick a colored initial or one of the icons
            below. {saving && <span>Saving…</span>}
          </p>
        </div>

        <p className="text-xs font-medium mb-2">Colored initial</p>
        <button
          type="button"
          onClick={() => choose(null)}
          className={`rounded-full p-0.5 mb-4 ${
            !me?.image ? "ring-2 ring-ring" : "opacity-80 hover:opacity-100"
          }`}
          title="Use a colored initial"
        >
          <AvatarBadge name={name} seed={me?.id} size="md" />
        </button>

        <p className="text-xs font-medium mb-2">Pick an icon</p>
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
                alt="avatar option"
                className="h-10 w-10 rounded-full object-cover bg-muted"
                loading="lazy"
              />
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Icons load from <code>/avatars/01–36.png</code>. Until those files are
          added they&rsquo;ll appear blank — the colored initial always works.
        </p>
      </CardContent>
    </Card>
  );
}
