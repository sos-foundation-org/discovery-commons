import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkContributionAccess } from "@/lib/access-control";
import { ACCESS_MODES, COLLAB_SEEKING_TYPES, CONTENT_LICENSES, isLicenseChangeAllowed } from "@/lib/types";
import type { ContributionPricingMeta, ContentLicense } from "@/lib/types";

const updatePricingSchema = z.object({
  accessMode: z.enum(ACCESS_MODES),
  license: z.enum(CONTENT_LICENSES).optional(),
  price: z.number().int().min(0).max(1000).optional(),
  whyGated: z.string().max(200).optional(),
  outlineBreak: z.number().int().min(0).optional(),
  collaborationGate: z
    .object({
      seekingType: z.enum(COLLAB_SEEKING_TYPES).optional(),
      minLevel: z.number().int().min(1).max(6).optional(),
      description: z.string().max(300).optional(),
      requiredDisciplines: z.array(z.string()).max(5).optional(),
    })
    .optional(),
});

/**
 * GET /api/contributions/[contributionId]/pricing — get current pricing info
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { contributionId: string } }
) {
  const session = await getSession();
  const userId = session?.user?.id ?? null;
  const access = await checkContributionAccess(params.contributionId, userId);
  if (!access.canView) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const contribution = await prisma.contribution.findUnique({
    where: { id: params.contributionId },
    select: { metadata: true, authorId: true },
  });
  if (!contribution) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const meta = contribution.metadata as ContributionPricingMeta | null;
  return NextResponse.json({
    accessMode: meta?.accessMode ?? "open",
    price: meta?.price ?? 0,
    whyGated: meta?.whyGated ?? "",
    // The outline break position is an author-side editing detail.
    outlineBreak: userId === contribution.authorId ? meta?.outlineBreak ?? null : null,
    collaborationGate: meta?.collaborationGate ?? null,
  });
}

/**
 * PATCH /api/contributions/[contributionId]/pricing — author updates pricing
 * Supports: change price, change accessMode, add/remove collaboration gate.
 * Grandfather clause: when switching from open→priced, existing likers/commenters
 * retain access (tracked via ContentPurchase with pricePaid=0).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { contributionId: string } }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contribution = await prisma.contribution.findUnique({
    where: { id: params.contributionId },
    select: { authorId: true, metadata: true, id: true },
  });
  if (!contribution) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (contribution.authorId !== session.user.id) {
    return NextResponse.json({ error: "Only the author can update pricing" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updatePricingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const oldMeta = (contribution.metadata as Record<string, unknown>) ?? {};
  const oldAccessMode = (oldMeta.accessMode as string) ?? "open";
  const newAccessMode = parsed.data.accessMode;

  // License irrevocability check
  if (parsed.data.license) {
    const oldLicense = (oldMeta.license as ContentLicense) ?? "cc_by";
    if (!isLicenseChangeAllowed(oldLicense, parsed.data.license)) {
      return NextResponse.json(
        {
          error: `Cannot change license from ${oldLicense} to ${parsed.data.license}. Creative Commons licenses are irrevocable — you can only open up, not restrict.`,
        },
        { status: 400 }
      );
    }
  }

  // Grandfather clause: open→priced transition grants free access to existing interactors
  if (oldAccessMode === "open" && newAccessMode !== "open") {
    // Find users who liked or commented on this contribution
    const [likers, commenters] = await Promise.all([
      prisma.contributionLike.findMany({
        where: { contributionId: params.contributionId },
        select: { userId: true },
      }),
      prisma.comment.findMany({
        where: { contributionId: params.contributionId },
        select: { authorId: true },
      }),
    ]);

    const grandfatheredUserIds = Array.from(
      new Set([
        ...likers.map((l) => l.userId),
        ...commenters.map((c) => c.authorId),
      ])
    ).filter((id) => id !== session.user.id);

    // Create free purchases for grandfathered users
    for (const userId of grandfatheredUserIds) {
      await prisma.contentPurchase
        .create({
          data: {
            buyerId: userId,
            contributionId: params.contributionId,
            pricePaid: 0,
            platformFee: 0,
            sellerReceived: 0,
          },
        })
        .catch(() => {}); // Ignore if already exists
    }
  }

  // Update metadata — merge pricing + license fields while preserving non-pricing fields
  const newMeta: Record<string, unknown> = { ...oldMeta };
  // License update (always allowed if irrevocability check passed above)
  if (parsed.data.license) {
    newMeta.license = parsed.data.license;
  }
  if (newAccessMode === "open") {
    // Removing pricing — clean up pricing fields (but keep license)
    delete newMeta.accessMode;
    delete newMeta.price;
    delete newMeta.whyGated;
    delete newMeta.outlineBreak;
    delete newMeta.collaborationGate;
  } else {
    newMeta.accessMode = newAccessMode;
    newMeta.price = parsed.data.price ?? 0;
    if (parsed.data.whyGated) newMeta.whyGated = parsed.data.whyGated;
    else delete newMeta.whyGated;
    if (parsed.data.outlineBreak != null) newMeta.outlineBreak = parsed.data.outlineBreak;
    if (parsed.data.collaborationGate) newMeta.collaborationGate = parsed.data.collaborationGate;
    else delete newMeta.collaborationGate;
  }

  await prisma.contribution.update({
    where: { id: params.contributionId },
    data: {
      metadata:
        Object.keys(newMeta).length > 0
          ? (newMeta as Record<string, string | number | boolean | null>)
          : undefined,
    },
  });

  return NextResponse.json({
    success: true,
    accessMode: newAccessMode,
    grandfathered: oldAccessMode === "open" && newAccessMode !== "open",
  });
}
