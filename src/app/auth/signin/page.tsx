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

export default function SignInPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<Record<string, any> | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        setError(d?.error || "Could not create account");
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
          ? "Account created but sign-in failed — try signing in."
          : "Incorrect email or password."
      );
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to Discovery Commons</CardTitle>
          <CardDescription>
            {mode === "signin"
              ? "Sign in to start sharing your discoveries"
              : "Create an account with your email"}
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
              Continue with {p.name}
            </Button>
          ))}

          {oauth.length > 0 && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>
          )}

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Display name"
              />
            )}
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "Password (min 8 chars)" : "Password"}
              required
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading
                ? "…"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                No account?{" "}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => {
                    setMode("signup");
                    setError("");
                  }}
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => {
                    setMode("signin");
                    setError("");
                  }}
                >
                  Sign in
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
              Dev quick login (local only)
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
