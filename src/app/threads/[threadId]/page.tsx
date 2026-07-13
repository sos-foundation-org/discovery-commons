import Link from "next/link";
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
  METHOD_APPLIES_TO_CONFIG,
  type ContributionType,
  type VisibilityLevel,
  type MethodAppliesTo,
} from "@/lib/types";
import { formatDateTime, timeAgo } from "@/lib/utils";
import { truncateHash } from "@/lib/hash";
import { ContributionForm } from "@/components/contribution/contribution-form";
import { VisibilityUpgrade } from "@/components/thread/visibility-upgrade";
import { CollaboratorManager } from "@/components/thread/collaborator-manager";
import { DisciplineBadge } from "@/components/thread/discipline-badge";
import { AvatarBadge } from "@/components/ui/avatar-badge";
import { ContributionContent } from "@/components/contribution/contribution-content";
import { TypeIcon } from "@/components/contribution/type-icon";
import { CommentSection } from "@/components/contribution/comment-section";
import { RevealButton } from "@/components/contribution/reveal-button";
import { SealButton } from "@/components/contribution/seal-button";
import { StageAdvance } from "@/components/thread/stage-advance";
import { VerificationBadge } from "@/components/thread/VerificationBadge";
import { CreditDistribution } from "@/components/credit/CreditDistribution";
import { AIReviewSection } from "@/components/ai/AIReviewSection";
import { ReplicationSection } from "@/components/replication/ReplicationSection";
import { summarizeCredits } from "@/lib/credits";
import { evaluateContributionAccess } from "@/lib/access-control";

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
            sharedWith: { select: { userId: true } },
            _count: { select: { comments: true } },
          },
        },
        collaborators: { select: { userId: true } },
        _count: { select: { contributions: true } },
      },
    })
    .catch(() => null);

  if (!thread) notFound();

  const userId = session?.user?.id ?? null;
  const collaboratorIds = thread.collaborators.map((c) => c.userId);
  const isOwner = thread.creatorId === userId;
  const isCollaborator = userId !== null && collaboratorIds.includes(userId);

  // Thread-level visibility gate.
  if (thread.visibility === "private" && !isOwner && !isCollaborator) {
    notFound();
  }
  if (thread.visibility === "shared" && !isOwner && !isCollaborator) {
    if (!userId) redirect("/auth/signin");
    notFound();
  }

  // Thread-level nine-dimension credit distribution.
  const threadCredits = await prisma.creditV2.findMany({
    where: { threadId: thread.id },
    select: { creditType: true, weight: true },
  });
  const creditSummary = summarizeCredits(threadCredits);

  // Filter contributions by visibility
  // Resolve per-contribution access via the canonical helper. canView decides
  // whether the card is shown at all; canViewContent decides whether the body
  // is revealed or masked (sealed → hash only for non-authors).
  const visibleContributions = thread.contributions
    .map((c) => ({
      c,
      access: evaluateContributionAccess(
        {
          authorId: c.authorId,
          visibility: c.visibility,
          sharedWith: c.sharedWith.map((s) => s.userId),
          thread: {
            creatorId: thread.creatorId,
            visibility: thread.visibility,
            collaboratorIds,
          },
        },
        userId
      ),
    }))
    .filter((x) => x.access.canView);

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
          <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
            <DisciplineBadge discipline={thread.discipline} />
            <VerificationBadge badge={thread.verificationBadge} />
            <Badge variant="secondary">{thread.currentStage}</Badge>
            <Badge variant="outline">
              {VISIBILITY_LABELS[thread.visibility as VisibilityLevel]}
            </Badge>
          </div>
        </div>

        <div className="max-w-none text-[15px] leading-relaxed text-muted-foreground mb-4 whitespace-pre-wrap">
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
        {isOwner && thread.visibility !== "public" && (
          <VisibilityUpgrade
            threadId={thread.id}
            currentLevel={thread.visibility as VisibilityLevel}
          />
        )}

        {isOwner && <CollaboratorManager threadId={thread.id} />}

        {/* Stage advance for owner */}
        {isOwner && (
          <StageAdvance
            threadId={thread.id}
            currentStage={thread.currentStage}
            stageCounts={stageCounts}
          />
        )}
      </div>

      {/* Credit distribution + AI review */}
      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <h2 className="text-base font-semibold">
              Credit Distribution{" "}
              <span className="text-sm font-normal text-muted-foreground">
                ({creditSummary.total.toFixed(2)} total)
              </span>
            </h2>
          </CardHeader>
          <CardContent>
            <CreditDistribution
              byDimension={creditSummary.byDimension}
              showEmpty={false}
            />
          </CardContent>
        </Card>
        {session && <AIReviewSection threadId={thread.id} />}
      </div>

      {/* Replications */}
      <div className="mb-8">
        <ReplicationSection threadId={thread.id} canRegister={Boolean(session)} />
      </div>

      {/* Contributions */}
      <div className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold">
          Contributions ({visibleContributions.length})
        </h2>

        {visibleContributions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No contributions yet. Be the first to contribute!
            </CardContent>
          </Card>
        ) : (
          visibleContributions.map(({ c: contribution, access }) => {
            const typeConfig =
              CONTRIBUTION_TYPE_CONFIG[
                contribution.type as ContributionType
              ] || CONTRIBUTION_TYPE_CONFIG.data;

            const isSealed =
              contribution.visibility === "sealed" ||
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
                  <div className="flex items-start gap-3">
                    <AvatarBadge
                      name={
                        contribution.author.displayName ||
                        contribution.author.name
                      }
                      seed={contribution.authorId}
                      image={contribution.author.image}
                      size="md"
                      className="mt-0.5 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
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
                            className={`gap-1 ${typeConfig.color}`}
                          >
                            <TypeIcon type={contribution.type} className="h-3.5 w-3.5" />
                            {typeConfig.label}
                          </Badge>
                          {contribution.type === "methodology" &&
                            (
                              (contribution.metadata as {
                                methodAppliesTo?: string[];
                              } | null)?.methodAppliesTo ?? []
                            ).map((a) => {
                              const cfg =
                                METHOD_APPLIES_TO_CONFIG[a as MethodAppliesTo];
                              return cfg ? (
                                <Badge
                                  key={a}
                                  variant="secondary"
                                  className={`text-[10px] ${cfg.color}`}
                                >
                                  → {cfg.label}
                                </Badge>
                              ) : null;
                            })}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {isSealed ? (
                            <Badge variant="secondary" className="text-xs">
                              Sealed
                              {contribution.sealedAt
                                ? ` ${timeAgo(contribution.sealedAt)}`
                                : contribution.sealedReg
                                  ? ` ${timeAgo(contribution.sealedReg.registeredAt)}`
                                  : ""}
                            </Badge>
                          ) : (
                            contribution.visibility !== "public" && (
                              <Badge variant="outline" className="text-xs">
                                {VISIBILITY_LABELS[
                                  contribution.visibility as keyof typeof VISIBILITY_LABELS
                                ] ?? contribution.visibility}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        <Link
                          href={`/profile/${contribution.authorId}`}
                          className="font-medium text-foreground/80 hover:text-primary hover:underline"
                        >
                          {contribution.author.displayName ||
                            contribution.author.name}
                        </Link>
                        <span aria-hidden> · </span>
                        <span>{timeAgo(contribution.createdAt)}</span>
                        {contribution._count.comments > 0 && (
                          <>
                            <span aria-hidden> · </span>
                            <span>
                              {contribution._count.comments} comment
                              {contribution._count.comments !== 1 ? "s" : ""}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isSealed && !access.canViewContent ? (
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
                      <ContributionContent
                        content={contribution.content}
                        className="mb-3"
                      />
                      {isSealed && isContribAuthor && (
                        <div className="mb-3 p-2 rounded bg-amber-50 dark:bg-amber-950 flex items-center justify-between gap-2">
                          <span className="text-xs text-amber-700 dark:text-amber-300">
                            This contribution is sealed. Others can only see the
                            hash{contribution.revealedAt ? "" : " until you reveal it"}.
                          </span>
                          <RevealButton contributionId={contribution.id} />
                        </div>
                      )}
                      {!isSealed &&
                        isContribAuthor &&
                        contribution.visibility !== "public" && (
                          <div className="mb-3 p-2 rounded bg-muted/50 flex items-center justify-between gap-2">
                            <span className="text-xs text-muted-foreground">
                              Not ready to share? Seal this to lock the content
                              while proving priority with its hash.
                            </span>
                            <SealButton contributionId={contribution.id} />
                          </div>
                        )}
                    </>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                    <Link
                      href={`/verify/${contribution.contentHash}`}
                      title={`Verify ${contribution.contentHash}`}
                      className="hover:text-foreground hover:underline"
                    >
                      SHA-256: {truncateHash(contribution.contentHash)}
                    </Link>
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
