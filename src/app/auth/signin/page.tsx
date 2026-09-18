"use client";

import { signIn, getProviders } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useI18n } from "@/components/language-provider";

export default function SignInPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<Record<string, any> | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { t, te } = useI18n();

  useEffect(() => {
    getProviders()
      .then((p) => setProviders(p ?? {}))
      .catch(() => setProviders({}));
  }, []);

  const oauth = providers
    ? Object.values(providers).filter((p: any) => p.type === "oauth")
    : [];
  const hasDev = providers ? "dev" in providers : false;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (mode === "signup") {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      }).catch(() => null);
      if (!res?.ok) {
        const d = await res?.json().catch(() => null);
        setError(d?.error || t("account.signin.createFailed"));
        setLoading(false);
        return;
      }
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.ok) {
      router.push("/threads");
      router.refresh();
    } else {
      setError(
        mode === "signup"
          ? t("account.signin.createdButFailed")
          : t("account.signin.incorrect")
      );
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("auth.welcome")}</CardTitle>
          <CardDescription>
            {mode === "signin"
              ? t("auth.signInDesc")
              : t("auth.signUpDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!providers && (
            <div className="space-y-3">
              <div className="h-11 animate-pulse rounded bg-muted" />
              <div className="h-11 animate-pulse rounded bg-muted" />
            </div>
          )}

          {oauth.map((p: any) => (
            <Button
              key={p.id}
              className="w-full"
              variant="outline"
              size="lg"
              onClick={() => signIn(p.id, { callbackUrl: "/threads" })}
            >
              {t("account.signin.continueWith", { provider: p.name })}
            </Button>
          ))}

          {oauth.length > 0 && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">{t("auth.or")}</span>
              </div>
            </div>
          )}

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("account.signin.displayName")}
              />
            )}
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("account.signin.email")}
              required
            />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? t("account.signin.passwordMin") : t("account.signin.password")}
              required
            />
            {error && <p className="text-sm text-red-600">{te(error)}</p>}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading
                ? "…"
                : mode === "signin"
                  ? t("auth.signIn")
                  : t("auth.createAccount")}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                {t("auth.noAccount")}{" "}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => {
                    setMode("signup");
                    setError("");
                  }}
                >
                  {t("auth.createOne")}
                </button>
              </>
            ) : (
              <>
                {t("auth.hasAccount")}{" "}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => {
                    setMode("signin");
                    setError("");
                  }}
                >
                  {t("auth.signIn")}
                </button>
              </>
            )}
          </p>

          {hasDev && (
            <button
              type="button"
              onClick={() =>
                signIn("dev", {
                  email: email || "dev@example.com",
                  name: name || "Dev User",
                  callbackUrl: "/threads",
                })
              }
              className="w-full text-center text-xs text-muted-foreground underline"
            >
              {t("account.signin.devLogin")}
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
