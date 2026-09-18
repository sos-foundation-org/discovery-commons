"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/language-provider";
import { formatDateTimeL } from "@/lib/i18n";
import { TRich, IdLabel } from "@/components/profile/account-i18n";

export default function SealedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [seals, setSeals] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [isSealing, setIsSealing] = useState(false);
  const [error, setError] = useState("");
  const { t, te, locale } = useI18n();
  const [generatedHash, setGeneratedHash] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
    if (status === "authenticated") fetchSeals();
  }, [status, router]);

  const fetchSeals = async () => {
    const res = await fetch("/api/sealed");
    if (res.ok) setSeals(await res.json());
  };

  const generateClientHash = async (text: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const handleContentChange = async (text: string) => {
    setContent(text);
    if (text.length > 0) {
      const hash = await generateClientHash(text);
      setGeneratedHash(hash);
    } else {
      setGeneratedHash("");
    }
  };

  const handleSeal = async () => {
    if (!generatedHash) return;
    setIsSealing(true);
    setError("");

    try {
      const res = await fetch("/api/sealed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentHash: generatedHash, title: title || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to seal");
        return;
      }

      setContent("");
      setTitle("");
      setGeneratedHash("");
      fetchSeals();
    } catch {
      setError("Something went wrong.");
    } finally {
      setIsSealing(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="h-8 w-64 animate-pulse rounded bg-muted mb-6" />
        <div className="h-48 animate-pulse rounded bg-muted mb-6" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{t("account.sealed.title")}</h1>
      <p className="text-muted-foreground mb-8">
        {t("account.sealed.intro")}
      </p>

      {/* Seal Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">{t("account.sealed.create")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {te(error)}
            </div>
          )}

          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("account.sealed.titlePh")}
          />

          <Textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder={t("account.sealed.contentPh")}
            rows={5}
          />

          {generatedHash && (
            <div className="p-3 rounded-md bg-muted">
              <p className="text-xs font-medium mb-1">
                {t("account.sealed.hashLabel")}
              </p>
              <p className="text-xs font-mono break-all">{generatedHash}</p>
            </div>
          )}

          <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-md text-sm">
            <TRich
              k="account.sealed.importantNote"
              nodes={{ strong: <strong>{t("account.sealed.important")}</strong> }}
            />
          </div>

          <Button
            onClick={handleSeal}
            disabled={isSealing || !generatedHash}
            className="w-full"
          >
            {isSealing ? t("account.sealed.sealing") : t("account.sealed.sealNow")}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Seals */}
      <h2 className="text-xl font-semibold mb-4">
        {t("account.sealed.yours", { n: seals.length })}
      </h2>
      <div className="space-y-3">
        {seals.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {t("account.sealed.none")}
          </p>
        ) : (
          seals.map((seal) => (
            <Card key={seal.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div>
                    {seal.title && (
                      <p className="font-medium text-sm mb-1">{seal.title}</p>
                    )}
                    <p className="text-xs font-mono text-muted-foreground break-all">
                      {seal.contentHash}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("account.sealed.sealedAt", {
                        date: formatDateTimeL(seal.registeredAt, locale),
                      })}
                    </p>
                    {seal.revealedAt && (
                      <p className="text-xs text-muted-foreground">
                        {t("account.sealed.revealedAt", {
                          date: formatDateTimeL(seal.revealedAt, locale),
                        })}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={
                      seal.status === "sealed" ? "secondary" : "default"
                    }
                  >
                    <IdLabel id={seal.status} k={`account.sealStatus.${seal.status}`} />
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
