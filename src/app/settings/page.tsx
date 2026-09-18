"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { timeAgoL } from "@/lib/i18n";
import { AvatarPicker } from "@/components/profile/avatar-picker";
import { useI18n } from "@/components/language-provider";
import { IdLabel } from "@/components/profile/account-i18n";

interface CircleMember {
  id: string;
  addedAt: string;
  note: string | null;
  trustedUser: {
    id: string;
    email: string;
    displayName: string | null;
    name: string | null;
    trustLevel: string;
  };
}

export default function SettingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");
  const { t, te, locale } = useI18n();
  const [success, setSuccess] = useState("");

  const fetchCircle = useCallback(async () => {
    const res = await fetch("/api/trusted-circle").catch(() => null);
    if (res?.ok) setMembers(await res.json());
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
    if (status === "authenticated") fetchCircle();
  }, [status, router, fetchCircle]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsAdding(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/trusted-circle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), note: note.trim() || undefined }),
    }).catch(() => null);

    if (res?.ok) {
      setEmail("");
      setNote("");
      setSuccess("account.settings.added");
      fetchCircle();
    } else {
      const data = await res?.json().catch(() => ({}));
      setError(data?.error || t("account.settings.addFailed"));
    }
    setIsAdding(false);
  };

  const handleRemove = async (id: string) => {
    const res = await fetch(`/api/trusted-circle?id=${id}`, {
      method: "DELETE",
    }).catch(() => null);
    if (res?.ok) {
      setMembers((prev) => prev.filter((m) => m.id !== id));
    }
  };

  if (status === "loading") {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="h-8 w-48 animate-pulse rounded bg-muted mb-6" />
        <div className="h-64 animate-pulse rounded bg-muted mb-6" />
        <div className="h-48 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{t("nav.settings")}</h1>
      <p className="text-muted-foreground mb-8">
        {t("account.settings.intro")}
      </p>

      <AvatarPicker />

      {/* Add member */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">{t("account.settings.addTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-3">
            {error && (
              <p className="text-sm text-destructive p-2 rounded bg-destructive/10">
                {te(error)}
              </p>
            )}
            {success && (
              <p className="text-sm text-green-700 dark:text-green-400 p-2 rounded bg-green-50 dark:bg-green-950">
                {t(success)}
              </p>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("account.settings.emailLabel")}
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t("account.settings.emailHint")}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("account.settings.noteLabel")}
              </label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("account.settings.notePh")}
              />
            </div>
            <Button type="submit" disabled={isAdding || !email.trim()}>
              {isAdding ? t("account.settings.adding") : t("account.settings.addBtn")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Circle members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t("account.settings.circleTitle", { n: members.length })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("account.settings.empty")}
            </p>
          ) : (
            <div className="space-y-3">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {m.trustedUser.displayName || m.trustedUser.name || m.trustedUser.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {m.trustedUser.email}
                    </p>
                    {m.note && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {m.note}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {t("account.settings.addedAgo", { time: timeAgoL(m.addedAt, locale) })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      <IdLabel
                        id={m.trustedUser.trustLevel}
                        k={`trust.${m.trustedUser.trustLevel}`}
                      />
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-destructive hover:text-destructive"
                      onClick={() => handleRemove(m.id)}
                    >
                      {t("common.remove")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
