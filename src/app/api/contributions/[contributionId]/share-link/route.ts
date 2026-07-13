import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function loadOwned(contributionId: string, userId: string) {
  const c = await prisma.contribution.findUnique({
    where: { id: contributionId },
    select: { id: true, authorId: true, shareToken: true },
  });
  if (!c || c.authorId !== userId) return null;
  return c;
}

// GET — current unlisted link (if any).
export async function GET(
  _req: NextRequest,
  { params }: { params: { contributionId: string } }
) {
  const session = await getSession();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const c = await loadOwned(params.contributionId, session.user.id);
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    path: c.shareToken ? `/share/${c.shareToken}` : null,
  });
}

// POST — create the unlisted link if it doesn't exist; returns the path.
export async function POST(
  _req: NextRequest,
  { params }: { params: { contributionId: string } }
) {
  const session = await getSession();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const c = await loadOwned(params.contributionId, session.user.id);
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let token = c.shareToken;
  if (!token) {
    token = crypto.randomBytes(16).toString("hex");
    await prisma.contribution.update({
      where: { id: c.id },
      data: { shareToken: token },
    });
  }
  return NextResponse.json({ path: `/share/${token}` });
}

// DELETE — revoke the unlisted link.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { contributionId: string } }
) {
  const session = await getSession();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const c = await loadOwned(params.contributionId, session.user.id);
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.contribution.update({
    where: { id: c.id },
    data: { shareToken: null },
  });
  return NextResponse.json({ success: true });
}
