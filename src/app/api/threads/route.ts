import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createThreadSchema } from "@/lib/validations";
import { generatePriorityHash } from "@/lib/hash";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const perPage = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("per_page") || "20") || 20)
    );
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

    // User filters are ANDed on top of the access rule above — they may only
    // narrow the result set, never replace the visibility gate.
    const andConditions: any[] = [];
    if (visibility) andConditions.push({ visibility });
    if (stage) where.currentStage = stage;
    // domainTags is a JSON array. Postgres supports proper array containment;
    // SQLite has no JSON-array query, so fall back to a substring match on the
    // serialized JSON. (The datasource provider is swapped at build time — see
    // scripts/prisma-provider.mjs.)
    if (domain) {
      where.domainTags =
        process.env.DATABASE_PROVIDER === "postgresql"
          ? { array_contains: domain }
          : { string_contains: domain };
    }
    if (q) {
      andConditions.push({
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
        ],
      });
    }
    if (andConditions.length > 0) where.AND = andConditions;

    // Whitelist sort columns — arbitrary field names would reach Prisma.
    const SORTABLE = ["updatedAt", "createdAt", "title"];
    const safeSort = SORTABLE.includes(sort) ? sort : "updatedAt";
    const safeOrder = order === "asc" ? "asc" : "desc";

    const [threads, total] = await Promise.all([
      prisma.thread.findMany({
        where,
        include: {
          creator: {
            select: { id: true, displayName: true, name: true, image: true },
          },
          _count: { select: { contributions: true } },
        },
        orderBy: { [safeSort]: safeOrder },
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

    const { title, description, visibility, discipline, domainTags } = parsed.data;

    const thread = await prisma.thread.create({
      data: {
        title,
        description,
        visibility,
        discipline,
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
