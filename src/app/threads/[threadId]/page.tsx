import Link from "next/link";
import dynamic from "next/dynamic";
import { Database } from "lucide-react";
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
  type ContributionPricingMeta,
  CONTENT_LICENSE_CONFIG,
  type ContentLicense,
} from "@/lib/types";
import { T } from "@/components/t";
import { TimeAgo, LocalDate, TagLabel } from "@/components/i18n-date";
import { truncateHash } from "@/lib/hash";
import { VisibilityUpgrade } from "@/components/thread/visibility-upgrade";
import { CollaboratorManager } from "@/components/thread/collaborator-manager";
import { DisciplineBadge } from "@/components/thread/discipline-badge";
import { AvatarBadge } from "@/components/ui/avatar-badge";
import { ContributionContent } from "@/components/contribution/contribution-content";
import { GatedContent } from "@/components/contribution/gated-content";
import { CollabManagePanel } from "@/components/contribution/collab-manage-panel";
import { TranslateButton } from "@/components/contribution/translate-button";
import { TypeIcon } from "@/components/contribution/type-icon";
import { CommentSection } from "@/components/contribution/comment-section";
import { RevealButton } from "@/components/contribution/reveal-button";
import { SealButton } from "@/components/contribution/seal-button";
import { PublishButton } from "@/components/contribution/publish-button";
import { CreditTimestampStatus } from "@/components/contribution/credit-timestamp-status";
import { OnboardingCreditHint } from "@/components/contribution/onboarding-credit-hint";
import { ShareManager } from "@/components/contribution/share-manager";
import { LikeButton } from "@/components/contribution/like-button";
import { CopyLinkButton } from "@/components/contribution/copy-link-button";
import { ShareLinkButton } from "@/components/contribution/share-link-button";
import { StageAdvance } from "@/components/thread/stage-advance";
import { VerificationBadge } from "@/components/thread/VerificationBadge";
import { CreditDistribution } from "@/components/credit/CreditDistribution";
import { summarizeCredits } from "@/lib/credits";
import { evaluateContributionAccess } from "@/lib/access-control";
import {
  TitledDiv,
  TitledSpan,
  SealedAgo,
  ProofRecorded,
  VerifyHashLink,
  LicenseBadge,
} from "./thread-i18n";

// Lazy-load heavy below-fold components
const ContributionForm = dynamic(
  () =>
    import("@/components/contribution/contribution-form").then(
      (m) => m.ContributionForm
    ),
  { ssr: false }
);
const AIReviewSection = dynamic(
  () =>
    import("@/components/ai/AIReviewSection").then((m) => m.AIReviewSection),
  { ssr: false }
);
const ReplicationSection = dynamic(
  () =>
    import("@/components/replication/ReplicationSection").then(
      (m) => m.ReplicationSection
    ),
  { ssr: false }
);

// Stage name as displayed (lowercase in English) — falls back to the raw id.
function StageName({ stage }: { stage: string }) {
  return stage in STAGE_LEVEL ? <T k={`thread.stage.${stage}`} /> : <>{stage}</>;
}

// Visibility label — falls back to the raw value for unknown levels.
function VisLabel({ v }: { v: string }) {
  return v in VISIBILITY_LABELS ? <T k={`vis.${v}`} /> : <>{v}</>;
}

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
  const userId = session?.user?.id ?? null;
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
            likes: { where: { userId: userId ?? "" }, select: { id: true } },
            _count: { select: { comments: true, likes: true } },
          },
        },
        collaborators: { select: { userId: true } },
        _count: { select: { contributions: true } },
      },
    })
    .catch(() => null);

  if (!thread) notFound();
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

  // v3: Pre-load user's purchases and accepted collaborations for this thread
  // (batch query to avoid N+1 — SE review R3).
  const contributionIds = thread.contributions.map((c) => c.id);
  const [userPurchases, userCollabs] = userId
    ? await Promise.all([
        prisma.contentPurchase
          .findMany({
            where: { buyerId: userId, contributionId: { in: contributionIds } },
            select: { contributionId: true },
          })
          .catch(() => []),
        prisma.collaborationRequest
          .findMany({
            where: {
              applicantId: userId,
              contributionId: { in: contributionIds },
              status: "accepted",
            },
            select: { contributionId: true },
          })
          .catch(() => []),
      ])
    : [[], []];
  const purchasedIds = new Set(userPurchases.map((p) => p.contributionId));
  const collabIds = new Set(userCollabs.map((c) => c.contributionId));

  // Pre-load block rules: which authors have blocked the current viewer?
  const authorIds = Array.from(new Set(thread.contributions.map((c) => c.authorId)));
  const blockRules = userId
    ? await prisma.contentAccessRule
        .findMany({
          where: {
            ownerId: { in: authorIds },
            targetUserId: userId,
            action: "block",
          },
          select: { ownerId: true, targetContributionId: true },
        })
        .catch(() => [])
    : [];
  // User-level blocks (targetContributionId is null) — block ALL content from this author
  const blockedByAuthorIds = new Set<string>(
    blockRules.filter((r: { targetContributionId: string | null }) => !r.targetContributionId).map((r: { ownerId: string }) => r.ownerId)
  );
  // Contribution-level blocks — block specific contributions
  const blockedContributionIds = new Set<string>(
    blockRules
      .filter((r: { targetContributionId: string | null }) => !!r.targetContributionId)
      .map((r: { targetContributionId: string | null }) => r.targetContributionId as string)
  );

  // Filter contributions by visibility
  const visibleContributions = thread.contributions
    .map((c) => ({
      c,
      access: evaluateContributionAccess(
        {
          id: c.id,
          authorId: c.authorId,
          visibility: c.visibility,
          sharedWith: c.sharedWith.map((s) => s.userId),
          thread: {
            creatorId: thread.creatorId,
            visibility: thread.visibility,
            collaboratorIds,
          },
          metadata: c.metadata as { accessMode?: string; price?: number } | null,
        },
        userId,
        {
          purchasedContributionIds: purchasedIds,
          collabAcceptedContributionIds: collabIds,
          blockedByAuthorIds,
          blockedContributionIds,
        }
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
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold mb-3">{thread.title}</h1>
          <div className="flex gap-2 flex-wrap">
            <DisciplineBadge discipline={thread.discipline} />
            <VerificationBadge badge={thread.verificationBadge} />
            <Badge variant="secondary">
              <StageName stage={thread.currentStage} />
            </Badge>
            <Badge variant="outline">
              <VisLabel v={thread.visibility} />
            </Badge>
          </div>
        </div>

        <div className="max-w-none text-[15px] leading-relaxed text-muted-foreground mb-4 whitespace-pre-wrap">
          {thread.description}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            <T
              k="thread.startedBy"
              vars={{
                name: thread.creator.displayName || thread.creator.name || "",
              }}
            />
          </span>
          <span>
            <TimeAgo date={thread.createdAt} />
          </span>
          <div className="flex gap-1">
            {(thread.domainTags as string[]).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                <TagLabel tag={tag} />
              </Badge>
            ))}
          </div>
        </div>

        {/* Stage Progress Bar — horizontally scrollable on mobile */}
        <div className="mt-4 flex items-center gap-1 overflow-x-auto pb-2 scrollbar-thin">
          {STAGE_LEVELS.map((level, li) => {
            const stages = Array.isArray(level) ? level : [level];
            const isParallel = stages.length > 1;
            const levelReached = li <= currentLevel;
            const levelPassed = li < currentLevel;

            return (
              <div key={li} className="flex items-center gap-1 shrink-0">
                {isParallel ? (
                  <div className="flex items-center gap-1">
                    <div className="flex flex-col gap-0.5">
                      {stages.map((stage) => {
                        const count = stageCounts[stage] || 0;
                        const filled = count > 0;
                        return (
                          <TitledDiv
                            key={stage}
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              filled
                                ? "bg-primary text-primary-foreground"
                                : levelReached
                                  ? "bg-primary/20 text-primary/70 border border-dashed border-primary/40"
                                  : "bg-muted text-muted-foreground"
                            }`}
                            titleKey={count !== 1 ? "row.contributionMany" : "row.contributionOne"}
                            vars={{ n: count }}
                          >
                            <StageName stage={stage} />
                            {count > 0 && (
                              <span className="ml-1 opacity-75">({count})</span>
                            )}
                          </TitledDiv>
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
                          <TitledSpan
                            className="text-green-600 dark:text-green-400 text-xs font-bold"
                            titleKey="thread.stageFull"
                          >
                            ✓✓
                          </TitledSpan>
                        );
                      if (some)
                        return (
                          <TitledSpan
                            className="text-yellow-600 dark:text-yellow-400 text-xs"
                            titleKey="thread.stagePartial"
                          >
                            ✓
                          </TitledSpan>
                        );
                      return null;
                    })()}
                  </div>
                ) : (
                  <TitledDiv
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      levelReached
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                    titleKey={
                      (stageCounts[stages[0]] || 0) !== 1
                        ? "row.contributionMany"
                        : "row.contributionOne"
                    }
                    vars={{ n: stageCounts[stages[0]] || 0 }}
                  >
                    <StageName stage={stages[0]} />
                    {(stageCounts[stages[0]] || 0) > 0 && (
                      <span className="ml-1 opacity-75">
                        ({stageCounts[stages[0]]})
                      </span>
                    )}
                  </TitledDiv>
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
              <T k="thread.creditDistribution" />{" "}
              <span className="text-sm font-normal text-muted-foreground">
                <T
                  k="thread.creditTotal"
                  vars={{ n: creditSummary.total.toFixed(2) }}
                />
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
          <T
            k="thread.contributionsHeading"
            vars={{ n: visibleContributions.length }}
          />
        </h2>

        {visibleContributions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <T k="thread.noContributions" />
            </CardContent>
          </Card>
        ) : (
          visibleContributions.map(({ c: contribution, access }) => {
            const typeKey: ContributionType = CONTRIBUTION_TYPE_CONFIG[
              contribution.type as ContributionType
            ]
              ? (contribution.type as ContributionType)
              : "data";
            const typeConfig = CONTRIBUTION_TYPE_CONFIG[typeKey];

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
                id={`c-${contribution.id}`}
                className={`relative scroll-mt-24 border-l-4 ${stageColor}`}
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
                            <TitledSpan
                              className="text-amber-500"
                              titleKey="thread.sealedContribution"
                            >
                              &#x1F512;
                            </TitledSpan>
                          )}
                          <Badge
                            variant="outline"
                            className={`gap-1 ${typeConfig.color}`}
                          >
                            <TypeIcon type={contribution.type} className="h-3.5 w-3.5" />
                            <T k={`type.${typeKey}`} />
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
                                  → <T k={`method.${a}`} />
                                </Badge>
                              ) : null;
                            })}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {isSealed ? (
                            <Badge variant="secondary" className="text-xs">
                              <SealedAgo
                                date={
                                  contribution.sealedAt ??
                                  contribution.sealedReg?.registeredAt ??
                                  null
                                }
                              />
                            </Badge>
                          ) : (
                            contribution.visibility !== "public" && (
                              <Badge variant="outline" className="text-xs">
                                <VisLabel v={contribution.visibility} />
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
                        <span>
                          <TimeAgo date={contribution.createdAt} />
                        </span>
                        {contribution._count.comments > 0 && (
                          <>
                            <span aria-hidden> · </span>
                            <span>
                              <T
                                k={
                                  contribution._count.comments !== 1
                                    ? "thread.commentMany"
                                    : "thread.commentOne"
                                }
                                vars={{ n: contribution._count.comments }}
                              />
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
                        <T k="thread.sealedNotice" />
                      </p>
                      <p className="text-xs font-mono text-muted-foreground">
                        SHA-256: {contribution.contentHash}
                      </p>
                    </div>
                  ) : (
                    <>
                      {(() => {
                        const pricingMeta = contribution.metadata as ContributionPricingMeta | null;
                        const am = pricingMeta?.accessMode ?? "open";
                        // SECURITY: Only send full content if user has access.
                        // Otherwise, server-side truncate to outline only.
                        const canSeeAll = access.canViewContent || isContribAuthor;
                        const outlineBreakPos = pricingMeta?.outlineBreak ??
                          (() => {
                            const pp = contribution.content.indexOf("\n\n");
                            return pp > 0 && pp < 600 ? pp : Math.min(280, contribution.content.length);
                          })();
                        const safeContent = canSeeAll
                          ? contribution.content
                          : contribution.content.slice(0, outlineBreakPos);
                        const detailLength = contribution.content.length - outlineBreakPos;
                        const detailParagraphs = canSeeAll ? 0 :
                          contribution.content.slice(outlineBreakPos).split(/\n\n+/).filter(Boolean).length;

                        return am !== "open" ? (
                          <GatedContent
                            contributionId={contribution.id}
                            content={safeContent}
                            accessMode={am}
                            price={pricingMeta?.price}
                            outlineBreak={canSeeAll ? pricingMeta?.outlineBreak : safeContent.length}
                            whyGated={pricingMeta?.whyGated}
                            collaborationGate={pricingMeta?.collaborationGate}
                            hasAccess={canSeeAll}
                            hasPurchased={access.hasPurchased ?? false}
                            isAuthor={isContribAuthor}
                            detailCounts={
                              canSeeAll
                                ? undefined
                                : { paragraphs: detailParagraphs, chars: detailLength }
                            }
                          />
                        ) : (
                          <ContributionContent
                            content={contribution.content}
                            className="mb-3"
                          />
                        );
                      })()}
                      {/* Translate button — FB style */}
                      {access.canViewContent && (
                        <TranslateButton
                          contributionId={contribution.id}
                          originalContent={contribution.content}
                        />
                      )}
                      {contribution.type === "data" &&
                        (contribution.metadata as { dataUrl?: string } | null)
                          ?.dataUrl && (
                          <a
                            href={
                              (contribution.metadata as { dataUrl?: string })
                                .dataUrl
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-green-300 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-800 hover:bg-green-100 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
                          >
                            <Database className="h-3.5 w-3.5" />
                            <T k="thread.rawDataset" />
                          </a>
                        )}
                      {isSealed && isContribAuthor && (
                        <div className="mb-3 flex flex-wrap items-start justify-between gap-2 rounded bg-amber-50 p-2 dark:bg-amber-950">
                          <div className="flex flex-col gap-0.5 text-xs">
                            {/* Existence proof — positive framing. */}
                            <span className="text-green-700 dark:text-green-400">
                              <ProofRecorded
                                date={
                                  contribution.sealedAt ??
                                  contribution.sealedReg?.registeredAt ??
                                  null
                                }
                              />
                            </span>
                            {/* Credit timestamp — neutral framing. */}
                            <span className="text-muted-foreground">
                              <T k="thread.creditNotYet" />
                            </span>
                            <span className="mt-0.5 font-medium text-amber-700 dark:text-amber-300">
                              <T k="thread.readyPublish" />
                            </span>
                          </div>
                          <RevealButton contributionId={contribution.id} />
                        </div>
                      )}
                      {!isSealed &&
                        isContribAuthor &&
                        contribution.visibility !== "public" && (
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded bg-muted/50 p-2">
                            <span className="text-xs text-muted-foreground">
                              <T k="thread.publishOrSeal" />
                            </span>
                            <div className="flex items-center gap-2">
                              <PublishButton
                                contributionId={contribution.id}
                                content={contribution.content}
                                typeLabel={typeConfig.label}
                                type={contribution.type}
                                threadTitle={thread.title}
                              />
                              <SealButton contributionId={contribution.id} />
                            </div>
                          </div>
                        )}
                      {isContribAuthor &&
                        contribution.visibility === "shared" && (
                          <div className="mb-3">
                            <ShareManager contributionId={contribution.id} />
                          </div>
                        )}
                    </>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-mono">
                    <VerifyHashLink
                      hash={contribution.contentHash}
                      className="hover:text-foreground hover:underline"
                    >
                      SHA-256: {truncateHash(contribution.contentHash)}
                    </VerifyHashLink>
                    <span>|</span>
                    <span>
                      <LocalDate date={contribution.createdAt} withTime />
                    </span>
                    <span>|</span>
                    {/* Layer-2 credit-timestamp status (Web Prototype §3B.7). */}
                    <CreditTimestampStatus
                      publishedAt={contribution.publishedAt}
                    />
                    {/* License badge */}
                    {(() => {
                      const licenseKey = (contribution.metadata as ContributionPricingMeta | null)?.license;
                      if (!licenseKey) return null;
                      const lcfg = CONTENT_LICENSE_CONFIG[licenseKey as ContentLicense];
                      if (!lcfg) return null;
                      return (
                        <>
                          <span>|</span>
                          <LicenseBadge licenseKey={licenseKey} url={lcfg.url} />
                        </>
                      );
                    })()}
                  </div>

                  {/* Actions: like · copy link · private (unlisted) link */}
                  <div className="mt-2 flex flex-wrap items-center gap-4 border-t pt-2">
                    <LikeButton
                      contributionId={contribution.id}
                      initialCount={contribution._count.likes}
                      initialLiked={contribution.likes.length > 0}
                    />
                    <CopyLinkButton
                      path={`/threads/${thread.id}#c-${contribution.id}`}
                    />
                    {isContribAuthor &&
                      contribution.visibility !== "public" && (
                        <ShareLinkButton
                          contributionId={contribution.id}
                          initialPath={
                            contribution.shareToken
                              ? `/share/${contribution.shareToken}`
                              : null
                          }
                        />
                      )}
                  </div>

                  {/* Collaboration requests (visible on gated content) */}
                  {access.isGated && (
                    <CollabManagePanel contributionId={contribution.id} />
                  )}

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
        <>
          <OnboardingCreditHint />
          <ContributionForm
            threadId={thread.id}
            threadVisibility={thread.visibility as VisibilityLevel}
          />
        </>
      )}
    </div>
  );
}
