"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/components/language-provider";

// Public hash-lookup form. Anyone can paste a SHA-256 hash to verify a
// contribution's existence + timestamp. No login required.
export default function VerifyIndexPage() {
  const router = useRouter();
  const [hash, setHash] = useState("");
  const { t } = useI18n();
  const trimmed = hash.trim().toLowerCase();
  const valid = /^[a-f0-9]{64}$/.test(trimmed);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-1">{t("account.verify.title")}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {t("account.verify.intro")}
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("account.verify.hashLabel")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (valid) router.push(`/verify/${trimmed}`);
            }}
          >
            <Input
              placeholder={t("account.verify.placeholder")}
              value={hash}
              onChange={(e) => setHash(e.target.value)}
              className="font-mono"
            />
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={!valid}>
                {t("account.verify.button")}
              </Button>
              {hash && !valid && (
                <span className="text-xs text-red-600">
                  {t("account.verify.invalid")}
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
