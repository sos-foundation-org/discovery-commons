"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Public hash-lookup form. Anyone can paste a SHA-256 hash to verify a
// contribution's existence + timestamp. No login required.
export default function VerifyIndexPage() {
  const router = useRouter();
  const [hash, setHash] = useState("");
  const trimmed = hash.trim().toLowerCase();
  const valid = /^[a-f0-9]{64}$/.test(trimmed);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-1">Verify a Hash</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Paste a SHA-256 hash to confirm a contribution existed on Discovery
        Commons and when.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">SHA-256 hash</CardTitle>
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
              placeholder="64 hex characters"
              value={hash}
              onChange={(e) => setHash(e.target.value)}
              className="font-mono"
            />
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={!valid}>
                Verify
              </Button>
              {hash && !valid && (
                <span className="text-xs text-red-600">
                  Must be 64 hex characters.
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
