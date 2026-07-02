import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createThreadSchema } from "@/lib/validations";
import { generatePriorityHash } from "@/lib/hash";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("per_page") || "20");
    const q = searchParams.get("q") || "";
    const visibility = searchParams.get("visibility");
    const stage = searchParams.get("stage");
    const domain = searchParams.get("domain");
    const sort = searchParams.get("sort") || "updatedAt";
    const order = searchParams.get("order") || "desc";

    const where: any = {
      isArchived: false,
    };

    // Visibility filtering based on auth
    if (!session) {
      where.visibility = "public";
    } else {
      // Show public threads, the user's own threads, and shared threads where
      // the user is a thread collaborator (or, for back-compat, in the
      // creator's trusted circle).
      where.OR = [
        { visibility: "public" },
        { creatorId: session.user.id },
        {
          visibility: "shared",
          collaborators: { some: { userId: session.user.id } },
        },
        {
          visibility: "shared",
          creator: {
            trustedByMe: {
              some: { trustedUserId: session.user.id },
            },
          },
        },
      ];
    }

    if (visibility) where.visibility = visibility;
    if (stage) where.currentStage = stage;
    // domainTags is stored as Json; filter with string_contains for SQLite compat
    if (domain) where.domainTags = { string_contains: domain };
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
      ];
    }

    const [threads, total] = await Promise.all([
      prisma.thread.findMany({
        where,
        include: {
          creator: {
            select: { id: true, displayName: true, name: true, image: true },
          },
          _count: { select: { contributions: true } },
        },
        orderBy: { [sort]: order },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.thread.count({ where }),
    ]);

    return NextResponse.json({
      threads,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.error("Failed to list threads:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const parsed = createThreadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, description, visibility, domainTags } = parsed.data;

    const thread = await prisma.thread.create({
      data: {
        title,
        description,
        visibility,
        domainTags,
        creatorId: session.user.id,
      },
      include: {
        creator: {
          select: { id: true, displayName: true, name: true, image: true },
        },
      },
    });

    // Create origination credit
    const creditHash = generatePriorityHash(
      session.user.id,
      `thread:${thread.id}`,
      thread.createdAt
    );
    await prisma.credit.create({
      data: {
        userId: session.user.id,
        threadId: thread.id,
        creditType: "origination",
        hash: creditHash,
      },
    });

    return NextResponse.json(thread, { status: 201 });
  } catch (error) {
    console.error("Failed to create thread:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
