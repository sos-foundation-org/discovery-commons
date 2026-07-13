"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";

export function LikeButton({
  contributionId,
  initialCount,
  initialLiked,
}: {
  contributionId: string;
  initialCount: number;
  initialLiked: boolean;
}) {
  const { data: session } = useSession();
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(initialLiked);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (!session || busy) return;
    setBusy(true);
    // optimistic
    setLiked((p) => !p);
    setCount((c) => c + (liked ? -1 : 1));
    const res = await fetch(`/api/contributions/${contributionId}/like`, {
      method: "POST",
    }).catch(() => null);
    if (res?.ok) {
      const d = await res.json();
      setLiked(d.liked);
      setCount(d.count);
    } else {
      // revert
      setLiked((p) => !p);
      setCount((c) => c + (liked ? 1 : -1));
    }
    setBusy(false);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!session}
      title={session ? (liked ? "Unlike" : "Like") : "Sign in to like"}
      className={`inline-flex items-center gap-1 text-xs transition-colors ${
        liked ? "text-rose-600" : "text-muted-foreground hover:text-foreground"
      } ${!session ? "cursor-default" : ""}`}
    >
      <Heart className={`h-4 w-4 ${liked ? "fill-rose-600" : ""}`} />
      {count > 0 && <span>{count}</span>}
    </button>
  );
}
