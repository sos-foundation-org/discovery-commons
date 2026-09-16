import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createCommentSchema } from "@/lib/validations";
import { rewardCommentPosted, rewardReviewReceived } from "@/lib/points";
import { checkContributionAccess } from "@/lib/access-control";

export async function GET(
  request: NextRequest,
  { params }: { params: { contributionId: string } }
) {
  try {
    // Access check: don't expose comments for contributions the user can't view
    const session = await getSession();
    const access = await checkContributionAccess(
      params.contributionId,
      session?.user?.id ?? null
    );
    if (!access.canView) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const comments = await prisma.comment.findMany({
      where: { contributionId: params.contributionId, parentId: null },
      include: {
        author: {
          select: { id: true, displayName: true, name: true, image: true, trustLevel: true },
        },
        children: {
          include: {
            author: {
              select: { id: true, displayName: true, name: true, image: true, trustLevel: true },
            },
            children: {
              include: {
                author: {
                  select: { id: true, displayName: true, name: true, image: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Mask anonymous authors
    const masked = comments.map((c) => maskAnonymous(c));
    return NextResponse.json(masked);
  } catch (error) {
    console.error("Failed to list comments:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

function maskAnonymous(comment: any): any {
  if (comment.isAnonymous) {
    comment.author = {
      id: "anonymous",
      displayName: "Anonymous Reviewer",
      name: "Anonymous Reviewer",
      image: null,
    };
  }
  if (comment.children) {
    comment.children = comment.children.map(maskAnonymous);
  }
  return comment;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { contributionId: string } }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
  }

  try {
    body.contributionId = params.contributionId;
    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { content, commentType, isAnonymous, parentId } = parsed.data;

    // Enforce max 3 levels of nesting
    if (parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { parentId: true },
      });
      if (parent?.parentId) {
        const grandparent = await prisma.comment.findUnique({
          where: { id: parent.parentId },
          select: { parentId: true },
        });
        if (grandparent?.parentId) {
          return NextResponse.json(
            { error: "Maximum comment nesting depth (3) reached" },
            { status: 400 }
          );
        }
      }
    }

    const comment = await prisma.comment.create({
      data: {
        contributionId: params.contributionId,
        authorId: session.user.id,
        content,
        commentType,
        isAnonymous,
        parentId,
      },
      include: {
        author: {
          select: { id: true, displayName: true, name: true, image: true },
        },
      },
    });

    // Award DP to commenter + contribution author (non-blocking)
    rewardCommentPosted(prisma, session.user.id, params.contributionId).catch(() => {});
    // If this is a review-type comment, also reward the contribution author
    if (["method_review", "stat_review", "critique"].includes(commentType)) {
      const contrib = await prisma.contribution
        .findUnique({ where: { id: params.contributionId }, select: { authorId: true } })
        .catch(() => null);
      if (contrib && contrib.authorId !== session.user.id) {
        rewardReviewReceived(prisma, contrib.authorId, params.contributionId, session.user.id).catch(() => {});
      }
    }

    const result = isAnonymous ? maskAnonymous(comment) : comment;
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Failed to create comment:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
