import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AvatarBadge } from "@/components/ui/avatar-badge";
import { ContributionContent } from "@/components/contribution/contribution-content";
import { TypeIcon } from "@/components/contribution/type-icon";
import { CONTRIBUTION_TYPE_CONFIG, type ContributionType } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { truncateHash } from "@/lib/hash";

// Public "unlisted" view of a single contribution reached via its secret
// shareToken. Anyone with the link can read it (no login) — even when it isn't
// public. Sealed contributions still show only their hash (the seal is honored).
export default async function SharedContributionPage({
  params,
}: {
  params: { token: string };
}) {
  const contribution = await prisma.contribution.findUnique({
    where: { shareToken: params.token },
    include: {
      author: { select: { id: true, displayName: true, name: true, image: true } },
      thread: { select: { id: true, title: true, visibility: true } },
    },
  });

  if (!contribution) notFound();

  const typeConfig =
    CONTRIBUTION_TYPE_CONFIG[contribution.type as ContributionType] ||
    CONTRIBUTION_TYPE_CONFIG.data;
  const isSealed = contribution.visibility === "sealed";
  const author =
    contribution.author.displayName || contribution.author.name || "Anonymous";

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <div className="mb-4 rounded-lg border border-dashed bg-muted/40 p-3 text-sm text-muted-foreground">
        🔗 You&rsquo;re viewing a contribution shared via a private (unlisted)
        link. It may not be publicly listed.
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <AvatarBadge
              name={author}
              seed={contribution.authorId}
              image={contribution.author.image}
              size="md"
              className="mt-0.5 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <Badge variant="outline" className={`gap-1 ${typeConfig.color}`}>
                <TypeIcon type={contribution.type} className="h-3.5 w-3.5" />
                {typeConfig.label}
              </Badge>
              <div className="mt-1 text-sm text-muted-foreground">
                <Link
                  href={`/profile/${contribution.authorId}`}
                  className="font-medium text-foreground/80 hover:underline"
                >
                  {author}
                </Link>
                <span aria-hidden> · </span>
                <span>{formatDateTime(contribution.createdAt)}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isSealed ? (
            <div className="rounded-md border border-dashed border-muted-foreground/30 bg-muted/50 p-4 text-center">
              <p className="mb-1 text-sm text-muted-foreground">
                This contribution is sealed — only its hash is public until the
                author reveals it.
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                SHA-256: {contribution.contentHash}
              </p>
            </div>
          ) : (
            <ContributionContent content={contribution.content} />
          )}
          <div className="mt-3 font-mono text-xs text-muted-foreground">
            <Link
              href={`/verify/${contribution.contentHash}`}
              className="hover:underline"
            >
              SHA-256: {truncateHash(contribution.contentHash)}
            </Link>
          </div>
        </CardContent>
      </Card>

      {contribution.thread.visibility === "public" && (
        <div className="mt-4 text-sm">
          <Link
            href={`/threads/${contribution.thread.id}`}
            className="text-primary hover:underline"
          >
            ← See the full thread: {contribution.thread.title}
          </Link>
        </div>
      )}
    </div>
  );
}
