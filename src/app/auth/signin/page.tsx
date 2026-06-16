"use client";

import { signIn, getProviders } from "next-auth/react";
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
  const [providers, setProviders] = useState<Record<string, any> | null>(null);
  const [email, setEmail] = useState("dev@example.com");
  const [name, setName] = useState("Dev User");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getProviders()
      .then((p) => setProviders(p ?? {}))
      .catch(() => setProviders({}));
  }, []);

  const oauthProviders = providers
    ? Object.values(providers).filter((p: any) => p.type !== "credentials")
    : [];
  const hasCredentials = providers
    ? Object.values(providers).some((p: any) => p.type === "credentials")
    : false;

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await signIn("credentials", { email, name, callbackUrl: "/threads" });
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to Discovery Commons</CardTitle>
          <CardDescription>
            Sign in to start sharing your discoveries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!providers && (
            <div className="space-y-4">
              <div className="h-12 animate-pulse rounded bg-muted" />
              <div className="h-12 animate-pulse rounded bg-muted" />
            </div>
          )}

          {oauthProviders.map((provider: any) => (
            <Button
              key={provider.id}
              className="w-full"
              variant="outline"
              size="lg"
              onClick={() => signIn(provider.id, { callbackUrl: "/threads" })}
            >
              Continue with {provider.name}
            </Button>
          ))}

          {hasCredentials && (
            <>
              {oauthProviders.length > 0 && (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      or dev login
                    </span>
                  </div>
                </div>
              )}
              <form onSubmit={handleCredentialsSignIn} className="space-y-3">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                />
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Display name"
                />
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In (Dev)"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Development mode — no password required
                </p>
              </form>
            </>
          )}

          {providers && Object.keys(providers).length === 0 && (
            <p className="text-sm text-muted-foreground text-center">
              No auth providers configured. Set GOOGLE_CLIENT_ID/SECRET or
              GITHUB_CLIENT_ID/SECRET in your .env file.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
