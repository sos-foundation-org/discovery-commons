import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const COLLAB_ROLES = ["viewer", "contributor", "admin"] as const;

const addSchema = z.object({
  email: z.string().email(),
  role: z.enum(COLLAB_ROLES).default("contributor"),
});

// Only the thread creator (or an existing admin collaborator) manages collaborators.
async function canManage(threadId: string, userId: string) {
  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    select: { creatorId: true },
  });
  if (!thread) return { ok: false as const, status: 404 };
  if (thread.creatorId === userId) return { ok: true as const };
  const admin = await prisma.threadCollaborator.findUnique({
    where: { threadId_userId: { threadId, userId } },
    select: { role: true },
  });
  if (admin?.role === "admin") return { ok: true as const };
  return { ok: false as const, status: 403 };
}

// GET /api/threads/[threadId]/collaborators — list collaborators (managers only).
export async function GET(
  _request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const perm = await canManage(params.threadId, session.user.id);
  if (!perm.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: perm.status });
  }

  const collaborators = await prisma.threadCollaborator.findMany({
    where: { threadId: params.threadId },
    include: {
      user: {
        select: { id: true, displayName: true, name: true, image: true, email: true },
      },
    },
    orderBy: { addedAt: "asc" },
  });
  return NextResponse.json(collaborators);
}

// POST /api/threads/[threadId]/collaborators — invite a user by email.
export async function POST(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const perm = await canManage(params.threadId, session.user.id);
  if (!perm.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: perm.status });
  }

  const body = await request.json().catch(() => null);
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { email, role } = parsed.data;

  const target = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!target) {
    return NextResponse.json(
      { error: "No user found with that email" },
      { status: 404 }
    );
  }

  const thread = await prisma.thread.findUnique({
    where: { id: params.threadId },
    select: { creatorId: true },
  });
  if (thread?.creatorId === target.id) {
    return NextResponse.json(
      { error: "The thread creator is already an owner" },
      { status: 400 }
    );
  }

  try {
    const collaborator = await prisma.threadCollaborator.create({
      data: {
        threadId: params.threadId,
        userId: target.id,
        role,
        addedBy: session.user.id,
      },
      include: {
        user: {
          select: { id: true, displayName: true, name: true, image: true, email: true },
        },
      },
    });

    // Notify the invitee (non-blocking).
    prisma.notification
      .create({
        data: {
          userId: target.id,
          type: "thread_collaboration",
          title: "You were added as a collaborator",
          message: "You now have access to a shared thread.",
          linkUrl: `/threads/${params.threadId}`,
        },
      })
      .catch(() => {});

    return NextResponse.json(collaborator, { status: 201 });
  } catch {
    // Unique constraint (threadId, userId) → already a collaborator.
    return NextResponse.json(
      { error: "User is already a collaborator" },
      { status: 409 }
    );
  }
}

// DELETE /api/threads/[threadId]/collaborators?userId=... — remove a collaborator.
export async function DELETE(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const perm = await canManage(params.threadId, session.user.id);
  if (!perm.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: perm.status });
  }

  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  await prisma.threadCollaborator
    .delete({ where: { threadId_userId: { threadId: params.threadId, userId } } })
    .catch(() => {});

  return NextResponse.json({ success: true });
}
