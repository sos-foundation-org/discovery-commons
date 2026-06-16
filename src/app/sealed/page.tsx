"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/utils";

export default function SealedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [seals, setSeals] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [isSealing, setIsSealing] = useState(false);
  const [error, setError] = useState("");
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
      <h1 className="text-3xl font-bold mb-2">Seal Your Ideas</h1>
      <p className="text-muted-foreground mb-8">
        Prove you had an idea at a specific time &mdash; without revealing it.
        The content never leaves your browser; only the hash is stored.
      </p>

      {/* Seal Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Create a New Seal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Optional title (only you can see this)"
          />

          <Textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Type your idea here. The content stays in your browser — only the hash is sent to the server."
            rows={5}
          />

          {generatedHash && (
            <div className="p-3 rounded-md bg-muted">
              <p className="text-xs font-medium mb-1">
                SHA-256 Hash (computed locally):
              </p>
              <p className="text-xs font-mono break-all">{generatedHash}</p>
            </div>
          )}

          <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-md text-sm">
            <strong>Important:</strong> This is digital evidence, not legal
            notarization.{" "}
            Save your original text somewhere safe &mdash; you&apos;ll need the exact
            text to reveal later.
          </div>

          <Button
            onClick={handleSeal}
            disabled={isSealing || !generatedHash}
            className="w-full"
          >
            {isSealing ? "Sealing..." : "Seal Now — Share Later"}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Seals */}
      <h2 className="text-xl font-semibold mb-4">
        Your Sealed Ideas ({seals.length})
      </h2>
      <div className="space-y-3">
        {seals.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No sealed ideas yet. Create one above!
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
                      Sealed: {formatDateTime(seal.registeredAt)}
                    </p>
                    {seal.revealedAt && (
                      <p className="text-xs text-muted-foreground">
                        Revealed: {formatDateTime(seal.revealedAt)}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={
                      seal.status === "sealed" ? "secondary" : "default"
                    }
                  >
                    {seal.status}
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
