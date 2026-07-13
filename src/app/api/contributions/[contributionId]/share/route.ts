import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const shareSchema = z.object({ email: z.string().email() });

// Only the contribution's author manages its per-contribution shares.
async function loadOwned(contributionId: string, userId: string) {
  const c = await prisma.contribution.findUnique({
    where: { id: contributionId },
    select: { id: true, authorId: true, visibility: true, threadId: true },
  });
  if (!c || c.authorId !== userId) return null;
  return c;
}

// GET — list users this contribution is explicitly shared with (author only).
export async function GET(
  _req: NextRequest,
  { params }: { params: { contributionId: string } }
) {
  const session = await getSession();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const c = await loadOwned(params.contributionId, session.user.id);
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const shares = await prisma.contributionShare.findMany({
    where: { contributionId: c.id },
    include: {
      user: { select: { id: true, displayName: true, name: true, email: true, image: true } },
    },
    orderBy: { sharedAt: "asc" },
  });
  return NextResponse.json(shares);
}

// POST — share this contribution with a user by email (author only).
export async function POST(
  request: NextRequest,
  { params }: { params: { contributionId: string } }
) {
  const session = await getSession();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const c = await loadOwned(params.contributionId, session.user.id);
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = shareSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });

  const target = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (!target)
    return NextResponse.json({ error: "No user found with that email" }, { status: 404 });
  if (target.id === session.user.id)
    return NextResponse.json({ error: "You already have access" }, { status: 400 });

  try {
    const share = await prisma.contributionShare.create({
      data: {
        contributionId: c.id,
        userId: target.id,
        sharedBy: session.user.id,
      },
      include: {
        user: { select: { id: true, displayName: true, name: true, email: true, image: true } },
      },
    });
    prisma.notification
      .create({
        data: {
          userId: target.id,
          type: "contribution_shared",
          title: "A contribution was shared with you",
          message: "You now have access to a shared contribution.",
          linkUrl: `/threads/${c.threadId}`,
        },
      })
      .catch(() => {});
    return NextResponse.json(share, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Already shared with this user" }, { status: 409 });
  }
}

// DELETE ?userId= — revoke a share (author only).
export async function DELETE(
  request: NextRequest,
  { params }: { params: { contributionId: string } }
) {
  const session = await getSession();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const c = await loadOwned(params.contributionId, session.user.id);
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId)
    return NextResponse.json({ error: "userId is required" }, { status: 400 });

  await prisma.contributionShare
    .delete({ where: { contributionId_userId: { contributionId: c.id, userId } } })
    .catch(() => {});
  return NextResponse.json({ success: true });
}
