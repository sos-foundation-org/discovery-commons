"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LEVELS } from "@/lib/types";

interface LevelInfo {
  level: number;
  name: string;
  nameZh: string;
  icon: string;
  minRep: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  reason: string;
  balanceAfter: number;
  createdAt: string;
}

interface PointsData {
  balance: number;
  frozenBalance: number;
  lifetimeEarned: number;
  reputation: number;
  level: LevelInfo;
  progress: number;
  nextLevel: LevelInfo | null;
  transactions: Transaction[];
}

const REASON_LABELS: Record<string, string> = {
  contribution_publish: "Published contribution",
  like_received: "Received a like",
  endorsement_received: "Received endorsement",
  review_received: "Received review",
  comment_posted: "Posted a comment",
  thread_created: "Created a thread",
  daily_login: "Daily login",
  welcome_bonus: "Welcome bonus",
  content_purchase: "Purchased content",
  collab_deposit: "Collaboration deposit",
  collab_deposit_refund: "Deposit refunded",
  platform_fee: "Platform fee",
  citation_received: "Your work was cited",
};

function timeAgo(date: string): string {
  const seconds = Math.floor(
    (new Date().getTime() - new Date(date).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function PointsPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<PointsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPoints = useCallback(async () => {
    const res = await fetch("/api/points").catch(() => null);
    if (res?.ok) {
      setData(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (session) fetchPoints();
    else setLoading(false);
  }, [session, fetchPoints]);

  if (!session) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Discovery Points</h1>
        <p className="text-muted-foreground">Sign in to view your points.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8 animate-pulse">
        <div className="h-8 w-1/3 rounded bg-muted mb-6" />
        <div className="h-40 rounded bg-muted mb-4" />
        <div className="h-60 rounded bg-muted" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-muted-foreground">Could not load points data.</p>
      </div>
    );
  }

  const progressPct = Math.round(data.progress * 100);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Discovery Points</h1>

      {/* Level card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{data.level.icon}</span>
            <div>
              <h2 className="text-xl font-bold">
                {data.level.name}{" "}
                <span className="text-muted-foreground font-normal text-base">
                  (Lv.{data.level.level})
                </span>
              </h2>
              <p className="text-sm text-muted-foreground">
                Reputation: {data.reputation.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          {data.nextLevel && (
            <div className="mb-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>
                  {data.level.icon} {data.level.name}
                </span>
                <span>
                  {data.nextLevel.icon} {data.nextLevel.name}
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {progressPct}% &mdash; {(data.nextLevel.minRep - data.reputation).toLocaleString()} reputation to next level
              </p>
            </div>
          )}

          {/* Balance row */}
          <div className="flex gap-6 mt-4 pt-4 border-t">
            <div>
              <div className="text-2xl font-bold">{data.balance.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Balance (DP)</div>
            </div>
            {data.frozenBalance > 0 && (
              <div>
                <div className="text-2xl font-bold text-amber-600">
                  {data.frozenBalance.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Frozen</div>
              </div>
            )}
            <div>
              <div className="text-2xl font-bold text-muted-foreground">
                {data.lifetimeEarned.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Lifetime earned</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Level guide */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Terra Incognita — Level Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {LEVELS.map((l) => (
              <div
                key={l.level}
                className={`flex items-center gap-2 rounded-lg p-2 text-sm ${
                  l.level === data.level.level
                    ? "bg-primary/10 border border-primary/30 font-medium"
                    : "bg-muted/50"
                }`}
              >
                <span className="text-lg">{l.icon}</span>
                <div>
                  <div className="text-xs font-medium">
                    Lv.{l.level} {l.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {l.minRep.toLocaleString()} rep
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent transactions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {data.transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No transactions yet. Start contributing to earn DP!
            </p>
          ) : (
            <div className="space-y-2">
              {data.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="text-sm">
                      {REASON_LABELS[tx.reason] || tx.reason}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {timeAgo(tx.createdAt)}
                    </p>
                  </div>
                  <Badge
                    variant={tx.amount >= 0 ? "default" : "secondary"}
                    className={tx.amount >= 0 ? "bg-green-600" : ""}
                  >
                    {tx.amount >= 0 ? "+" : ""}
                    {tx.amount} DP
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
