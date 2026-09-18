"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrcidBadge } from "@/components/profile/OrcidBadge";
import { useI18n } from "@/components/language-provider";

interface OrcidStatus {
  linked: boolean;
  orcidId: string | null;
  verified: boolean;
}

export default function OrcidPage() {
  const [status, setStatus] = useState<OrcidStatus | null>(null);
  const [orcidInput, setOrcidInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { t, te } = useI18n();
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/v2/auth/orcid/verify");
    if (res.ok) setStatus(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function link() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/v2/auth/orcid/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orcidId: orcidInput.trim() }),
    });
    if (res.ok) {
      setOrcidInput("");
      await load();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || t("account.orcid.linkFailed"));
    }
    setBusy(false);
  }

  async function unlink() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/v2/auth/orcid/unlink", { method: "DELETE" });
    if (res.ok) await load();
    setBusy(false);
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">ORCID</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        {t("account.orcid.intro")}
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("account.orcid.linkage")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status?.linked && status.orcidId ? (
            <>
              <div className="flex items-center gap-3">
                <OrcidBadge orcidId={status.orcidId} verified={status.verified} />
                {!status.verified && (
                  <span className="text-xs text-muted-foreground">
                    {t("account.orcid.selfAsserted")}
                  </span>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={unlink} disabled={busy}>
                {t("account.orcid.unlink")}
              </Button>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={orcidInput}
                  onChange={(e) => setOrcidInput(e.target.value)}
                  placeholder="0000-0000-0000-0000"
                  className="max-w-xs font-mono"
                />
                <Button onClick={link} disabled={busy || !orcidInput.trim()}>
                  {t("account.orcid.link")}
                </Button>
              </div>
              {error && <p className="text-sm text-red-600">{te(error)}</p>}
              <p className="text-xs text-muted-foreground">
                {t("account.orcid.hint")}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
