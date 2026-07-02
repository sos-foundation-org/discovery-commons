import Link from "next/link";
import { prisma } from "@/lib/db";
import { verifyHash } from "@/lib/hash";
import { formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Public hash-verification page (Web Prototype §9 /verify/[hash]). Anyone — no
// login — can confirm that a SHA-256 hash was recorded on the platform, when,
// and that the stored content still matches the hash (integrity). Content is
// only shown if the contribution is public; sealed/private content stays hidden
// while its existence + timestamp remain provable.
export default async function VerifyHashPage({
  params,
}: {
  params: { hash: string };
}) {
  const hash = decodeURIComponent(params.hash).toLowerCase().trim();
  const validFormat = /^[a-f0-9]{64}$/.test(hash);

  const contribution = validFormat
    ? await prisma.contribution.findFirst({
        where: { contentHash: hash },
        include: {
          author: { select: { displayName: true, name: true } },
          thread: { select: { id: true, title: true, visibility: true } },
        },
      })
    : null;

  const sealedReg =
    validFormat && !contribution
      ? await prisma.sealedRegistration.findFirst({
          where: { contentHash: hash },
          include: { user: { select: { displayName: true, name: true } } },
        })
      : null;

  const integrityOk = contribution
    ? verifyHash(
        contribution.authorId,
        contribution.content,
        contribution.createdAt,
        contribution.contentHash
      )
    : null;

  const publiclyViewable = contribution?.visibility === "public";
  const threadPublic = contribution?.thread?.visibility === "public";

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-1">Hash Verification</h1>
      <p className="text-sm text-muted-foreground mb-6">
        SHA-256 priority record lookup
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-mono break-all">{hash}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!validFormat ? (
            <p className="text-sm text-red-600">
              Not a valid SHA-256 hash (expected 64 hex characters).
            </p>
          ) : contribution ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-green-600">Record found</Badge>
                {integrityOk ? (
                  <Badge variant="secondary">✓ Integrity verified</Badge>
                ) : (
                  <Badge variant="destructive">✗ Integrity check failed</Badge>
                )}
                <Badge variant="outline">{contribution.visibility}</Badge>
              </div>

              <dl className="text-sm space-y-1">
                <div className="flex gap-2">
                  <dt className="text-muted-foreground w-28">Recorded at</dt>
                  <dd className="font-medium">
                    {formatDateTime(contribution.createdAt)}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted-foreground w-28">Author</dt>
                  <dd className="font-medium">
                    {contribution.author.displayName ||
                      contribution.author.name ||
                      "—"}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted-foreground w-28">Type</dt>
                  <dd className="font-medium">{contribution.type}</dd>
                </div>
              </dl>

              <p className="text-xs text-muted-foreground">
                {integrityOk
                  ? "The content stored for this record still hashes to the value above — it has not been altered since it was recorded."
                  : "Warning: the stored content does not match this hash."}
              </p>

              {publiclyViewable && threadPublic ? (
                <Link
                  href={`/threads/${contribution.thread.id}`}
                  className="text-sm text-primary underline"
                >
                  View the public contribution →
                </Link>
              ) : (
                <p className="text-xs text-muted-foreground">
                  The content is not public
                  {contribution.visibility === "sealed" ? " (sealed)" : ""}, but
                  its existence and timestamp are provable from this hash.
                </p>
              )}
            </>
          ) : sealedReg ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-green-600">Sealed record found</Badge>
                <Badge variant="outline">{sealedReg.status}</Badge>
              </div>
              <dl className="text-sm space-y-1">
                <div className="flex gap-2">
                  <dt className="text-muted-foreground w-28">Registered at</dt>
                  <dd className="font-medium">
                    {formatDateTime(sealedReg.registeredAt)}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted-foreground w-28">By</dt>
                  <dd className="font-medium">
                    {sealedReg.user.displayName || sealedReg.user.name || "—"}
                  </dd>
                </div>
              </dl>
              <p className="text-xs text-muted-foreground">
                This hash was registered as a sealed record at the time above.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No record found for this hash on Discovery Commons.
            </p>
          )}
        </CardContent>
      </Card>

      <p className="mt-6 text-xs text-muted-foreground">
        A SHA-256 hash + server timestamp is evidence of when a contribution
        existed. It is not a legal claim of patent priority.
      </p>

      <div className="mt-4">
        <Link href="/verify" className="text-sm text-primary underline">
          Verify another hash
        </Link>
      </div>
    </div>
  );
}
