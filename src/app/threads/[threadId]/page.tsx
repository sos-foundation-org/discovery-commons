import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  CONTRIBUTION_TYPE_CONFIG,
  VISIBILITY_LABELS,
  STAGE_LEVEL,
  STAGE_LEVELS,
  type ContributionType,
  type VisibilityLevel,
} from "@/lib/types";
import { formatDateTime, timeAgo } from "@/lib/utils";
import { truncateHash } from "@/lib/hash";
import { ContributionForm } from "@/components/contribution/contribution-form";
import { VisibilityUpgrade } from "@/components/thread/visibility-upgrade";
import { CommentSection } from "@/components/contribution/comment-section";
import { UnsealButton } from "@/components/contribution/unseal-button";
import { StageAdvance } from "@/components/thread/stage-advance";

const STAGE_COLORS: Record<string, string> = {
  question: "border-l-blue-500",
  data: "border-l-green-500",
  statistics: "border-l-purple-500",
  simulation: "border-l-cyan-500",
  interpretation: "border-l-amber-500",
  hypothesis: "border-l-yellow-500",
  insight: "border-l-orange-500",
};

export default async function ThreadDetailPage({
  params,
}: {
  params: { threadId: string };
}) {
  const session = await getSession();
  const thread = await prisma.thread
    .findUnique({
      where: { id: params.threadId },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            name: true,
            image: true,
            trustLevel: true,
          },
        },
        contributions: {
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: {
                id: true,
                displayName: true,
                name: true,
                image: true,
                trustLevel: true,
              },
            },
            sealedReg: {
              select: { id: true, registeredAt: true, status: true },
            },
            _count: { select: { comments: true } },
          },
        },
        _count: { select: { contributions: true } },
      },
    })
    .catch(() => null);

  if (!thread) notFound();

  // Visibility checks
  if (thread.visibility === "L0" && thread.creatorId !== session?.user?.id) {
    notFound();
  }
  if (thread.visibility === "L2" && !session?.user?.id) {
    redirect("/auth/signin");
  }

  const isOwner = thread.creatorId === session?.user?.id;

  // Filter contributions by visibility
  const contributions = thread.contributions.filter((c) => {
    if (c.authorId === session?.user?.id) return true;
    if (c.visibility === "L3") return true;
    if (c.visibility === "L2" && session?.user?.id) return true;
    if (c.visibility === "L1" && session?.user?.id) return true;
    return false;
  });

  // Stage progress (level-based — data and simulation are parallel at level 2)
  const currentLevel = STAGE_LEVEL[thread.currentStage] ?? 0;

  // Count contributions by stage type (for stage advance)
  const stageCounts: Record<string, number> = {};
  for (const c of thread.contributions) {
    stageCounts[c.type] = (stageCounts[c.type] || 0) + 1;
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Thread Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-3xl font-bold">{thread.title}</h1>
          <div className="flex gap-2 flex-shrink-0">
            <Badge variant="secondary">{thread.currentStage}</Badge>
            <Badge variant="outline">
              {VISIBILITY_LABELS[thread.visibility as VisibilityLevel]}
            </Badge>
          </div>
        </div>

        <div className="prose prose-sm max-w-none text-muted-foreground mb-4">
          {thread.description}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            Started by{" "}
            {thread.creator.displayName || thread.creator.name}
          </span>
          <span>{timeAgo(thread.createdAt)}</span>
          <div className="flex gap-1">
            {(thread.domainTags as string[]).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Stage Progress Bar */}
        <div className="mt-4 flex items-center gap-1 flex-wrap">
          {STAGE_LEVELS.map((level, li) => {
            const stages = Array.isArray(level) ? level : [level];
            const isParallel = stages.length > 1;
            const levelReached = li <= currentLevel;
            const levelPassed = li < currentLevel;

            return (
              <div key={li} className="flex items-center gap-1">
                {isParallel ? (
                  <div className="flex items-center gap-1">
                    <div className="flex flex-col gap-0.5">
                      {stages.map((stage) => {
                        const count = stageCounts[stage] || 0;
                        const filled = count > 0;
                        return (
                          <div
                            key={stage}
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              filled
                                ? "bg-primary text-primary-foreground"
                                : levelReached
                                  ? "bg-primary/20 text-primary/70 border border-dashed border-primary/40"
                                  : "bg-muted text-muted-foreground"
                            }`}
                            title={`${count} contribution${count !== 1 ? "s" : ""}`}
                          >
                            {stage}
                            {count > 0 && (
                              <span className="ml-1 opacity-75">({count})</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {(() => {
                      const both = stages.every(
                        (s) => (stageCounts[s] || 0) > 0
                      );
                      const some = stages.some(
                        (s) => (stageCounts[s] || 0) > 0
                      );
                      if (both)
                        return (
                          <span
                            className="text-green-600 dark:text-green-400 text-xs font-bold"
                            title="Full empirical support: both data and simulation"
                          >
                            ✓✓
                          </span>
                        );
                      if (some)
                        return (
                          <span
                            className="text-yellow-600 dark:text-yellow-400 text-xs"
                            title="Partial — add both data and simulation for full strength"
                          >
                            ✓
                          </span>
                        );
                      return null;
                    })()}
                  </div>
                ) : (
                  <div
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      levelReached
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                    title={`${stageCounts[stages[0]] || 0} contribution${
                      (stageCounts[stages[0]] || 0) !== 1 ? "s" : ""
                    }`}
                  >
                    {stages[0]}
                    {(stageCounts[stages[0]] || 0) > 0 && (
                      <span className="ml-1 opacity-75">
                        ({stageCounts[stages[0]]})
                      </span>
                    )}
                  </div>
                )}
                {li < STAGE_LEVELS.length - 1 && (
                  <div
                    className={`w-4 h-0.5 ${
                      levelPassed ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Visibility upgrade for owner */}
        {isOwner && thread.visibility !== "L3" && (
          <VisibilityUpgrade
            threadId={thread.id}
            currentLevel={thread.visibility as VisibilityLevel}
          />
        )}

        {/* Stage advance for owner */}
        {isOwner && (
          <StageAdvance
            threadId={thread.id}
            currentStage={thread.currentStage}
            stageCounts={stageCounts}
          />
        )}
      </div>

      {/* Contributions */}
      <div className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold">
          Contributions ({contributions.length})
        </h2>

        {contributions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No contributions yet. Be the first to contribute!
            </CardContent>
          </Card>
        ) : (
          contributions.map((contribution) => {
            const typeConfig =
              CONTRIBUTION_TYPE_CONFIG[
                contribution.type as ContributionType
              ] || CONTRIBUTION_TYPE_CONFIG.data;

            const isSealed =
              contribution.sealedReg?.status === "sealed";
            const isContribAuthor =
              contribution.authorId === session?.user?.id;
            const stageColor =
              STAGE_COLORS[contribution.type] || "border-l-gray-300";

            return (
              <Card
                key={contribution.id}
                className={`relative border-l-4 ${stageColor}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {isSealed && (
                        <span
                          className="text-amber-500"
                          title="Sealed contribution"
                        >
                          &#x1F512;
                        </span>
                      )}
                      <Badge
                        variant="outline"
                        className={typeConfig.color}
                      >
                        {typeConfig.label}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        by{" "}
                        {contribution.author.displayName ||
                          contribution.author.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(contribution.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {contribution.sealedReg && (
                        <Badge
                          variant={isSealed ? "secondary" : "default"}
                          className="text-xs"
                        >
                          {isSealed
                            ? `Sealed ${timeAgo(contribution.sealedReg.registeredAt)}`
                            : "Revealed"}
                        </Badge>
                      )}
                      {contribution._count.comments > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {contribution._count.comments} comment
                          {contribution._count.comments !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isSealed && !isContribAuthor ? (
                    <div className="p-4 rounded-md bg-muted/50 border border-dashed border-muted-foreground/30 text-center">
                      <p className="text-sm text-muted-foreground mb-1">
                        This contribution is sealed. Only the hash is visible
                        until the author reveals it.
                      </p>
                      <p className="text-xs font-mono text-muted-foreground">
                        SHA-256: {contribution.contentHash}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="prose prose-sm max-w-none mb-3">
                        {contribution.content}
                      </div>
                      {isSealed && isContribAuthor && (
                        <div className="mb-3 p-2 rounded bg-amber-50 dark:bg-amber-950 flex items-center justify-between">
                          <span className="text-xs text-amber-700 dark:text-amber-300">
                            This contribution is sealed. Others can only see the
                            hash.
                          </span>
                          <UnsealButton contributionId={contribution.id} />
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                    <span title={contribution.contentHash}>
                      SHA-256: {truncateHash(contribution.contentHash)}
                    </span>
                    <span>|</span>
                    <span>{formatDateTime(contribution.createdAt)}</span>
                  </div>

                  {/* Comments */}
                  <CommentSection contributionId={contribution.id} />
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add Contribution Form */}
      {session && (
        <ContributionForm
          threadId={thread.id}
          threadVisibility={thread.visibility as VisibilityLevel}
        />
      )}
    </div>
  );
}
