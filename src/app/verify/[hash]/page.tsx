import Link from "next/link";
import { prisma } from "@/lib/db";
import { verifyHash } from "@/lib/hash";
import { T } from "@/components/t";
import { LocalDate } from "@/components/i18n-date";
import { IdLabel } from "@/components/profile/account-i18n";
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
      <h1 className="text-2xl font-bold mb-1"><T k="account.verify.resultTitle" /></h1>
      <p className="text-sm text-muted-foreground mb-6">
        <T k="account.verify.resultSubtitle" />
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-mono break-all">{hash}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!validFormat ? (
            <p className="text-sm text-red-600">
              <T k="account.verify.badFormat" />
            </p>
          ) : contribution ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-green-700 dark:bg-green-600"><T k="account.verify.recordFound" /></Badge>
                {integrityOk ? (
                  <Badge variant="secondary"><T k="account.verify.integrityOk" /></Badge>
                ) : (
                  <Badge variant="destructive"><T k="account.verify.integrityFail" /></Badge>
                )}
                <Badge variant="outline">
                  <IdLabel
                    id={contribution.visibility}
                    k={`vis.${contribution.visibility}`}
                  />
                </Badge>
              </div>

              <dl className="text-sm space-y-1">
                <div className="flex gap-2">
                  <dt className="text-muted-foreground w-28"><T k="account.verify.recordedAt" /></dt>
                  <dd className="font-medium">
                    <LocalDate date={contribution.createdAt} withTime />
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted-foreground w-28"><T k="account.verify.author" /></dt>
                  <dd className="font-medium">
                    {contribution.author.displayName ||
                      contribution.author.name ||
                      "—"}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted-foreground w-28"><T k="account.verify.type" /></dt>
                  <dd className="font-medium">
                    <IdLabel id={contribution.type} k={`type.${contribution.type}`} />
                  </dd>
                </div>
              </dl>

              <p className="text-xs text-muted-foreground">
                <T k={integrityOk ? "account.verify.okNote" : "account.verify.failNote"} />
              </p>

              {publiclyViewable && threadPublic ? (
                <Link
                  href={`/threads/${contribution.thread.id}`}
                  className="text-sm text-primary underline"
                >
                  <T k="account.verify.viewPublic" />
                </Link>
              ) : (
                <p className="text-xs text-muted-foreground">
                  <T
                    k={
                      contribution.visibility === "sealed"
                        ? "account.verify.notPublicSealed"
                        : "account.verify.notPublic"
                    }
                  />
                </p>
              )}
            </>
          ) : sealedReg ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-green-700 dark:bg-green-600"><T k="account.verify.sealedFound" /></Badge>
                <Badge variant="outline">
                  <IdLabel id={sealedReg.status} k={`account.sealStatus.${sealedReg.status}`} />
                </Badge>
              </div>
              <dl className="text-sm space-y-1">
                <div className="flex gap-2">
                  <dt className="text-muted-foreground w-28"><T k="account.verify.registeredAt" /></dt>
                  <dd className="font-medium">
                    <LocalDate date={sealedReg.registeredAt} withTime />
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted-foreground w-28"><T k="account.verify.by" /></dt>
                  <dd className="font-medium">
                    {sealedReg.user.displayName || sealedReg.user.name || "—"}
                  </dd>
                </div>
              </dl>
              <p className="text-xs text-muted-foreground">
                <T k="account.verify.sealedNote" />
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              <T k="account.verify.noRecord" />
            </p>
          )}
        </CardContent>
      </Card>

      <p className="mt-6 text-xs text-muted-foreground">
        <T k="account.verify.disclaimer" />
      </p>

      <div className="mt-4">
        <Link href="/verify" className="text-sm text-primary underline">
          <T k="account.verify.another" />
        </Link>
      </div>
    </div>
  );
}
