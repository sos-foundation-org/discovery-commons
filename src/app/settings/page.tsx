"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/utils";
import { AvatarPicker } from "@/components/profile/avatar-picker";

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
      setSuccess("User added to your trusted circle!");
      fetchCircle();
    } else {
      const data = await res?.json().catch(() => ({}));
      setError(data?.error || "Failed to add user");
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
      <h1 className="text-3xl font-bold mb-2">Settings</h1>
      <p className="text-muted-foreground mb-8">
        Manage your avatar and your trusted circle for Shared visibility.
      </p>

      <AvatarPicker />

      {/* Add member */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Add to Trusted Circle</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-3">
            {error && (
              <p className="text-sm text-destructive p-2 rounded bg-destructive/10">
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-green-700 dark:text-green-400 p-2 rounded bg-green-50 dark:bg-green-950">
                {success}
              </p>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">
                Email address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                The user must already have an account on Discovery Commons.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Note (optional)
              </label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., collaborator on bird acoustics project"
              />
            </div>
            <Button type="submit" disabled={isAdding || !email.trim()}>
              {isAdding ? "Adding..." : "Add to Circle"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Circle members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Your Trusted Circle ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Your trusted circle is empty. Add collaborators above to share
              Shared-visibility content with them.
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
                      Added {timeAgo(m.addedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {m.trustedUser.trustLevel}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-destructive hover:text-destructive"
                      onClick={() => handleRemove(m.id)}
                    >
                      Remove
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
