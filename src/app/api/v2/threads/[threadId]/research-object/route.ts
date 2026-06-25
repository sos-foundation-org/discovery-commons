import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { researchObjectSchema } from "@/lib/validations";
import { emptySDG } from "@/lib/types/research-object";
import type { Prisma } from "@prisma/client";

// GET /api/v2/threads/[threadId]/research-object — fetch the SDG for a thread.
export async function GET(
  _request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  const { threadId } = params;
  try {
    const researchObject = await prisma.researchObject.findUnique({
      where: { threadId },
    });
    if (!researchObject) {
      return NextResponse.json(
        { error: "No research object for this thread yet" },
        { status: 404 }
      );
    }
    return NextResponse.json(researchObject);
  } catch (error) {
    console.error("Failed to get research object:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// POST /api/v2/threads/[threadId]/research-object — create or update the SDG.
// If no structuredContent is supplied, an empty SDG scaffold is generated from
// the thread metadata. Thread creator only. Updating bumps the version.
export async function POST(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { threadId } = params;

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // Empty body is allowed — we'll scaffold an SDG.
  }

  try {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      select: {
        id: true,
        title: true,
        creatorId: true,
        domainTags: true,
        currentStage: true,
        verificationBadge: true,
      },
    });
    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }
    if (thread.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the thread creator can edit the research object" },
        { status: 403 }
      );
    }

    let structuredContent: Prisma.InputJsonValue;
    if (body && typeof body === "object" && "structuredContent" in body) {
      const parsed = researchObjectSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsed.error.flatten() },
          { status: 400 }
        );
      }
      structuredContent = parsed.data.structuredContent as Prisma.InputJsonValue;
    } else {
      const domainTags = Array.isArray(thread.domainTags)
        ? (thread.domainTags as string[])
        : [];
      structuredContent = emptySDG(
        thread.title,
        domainTags,
        thread.currentStage,
        thread.verificationBadge
      ) as unknown as Prisma.InputJsonValue;
    }

    const existing = await prisma.researchObject.findUnique({
      where: { threadId },
      select: { id: true, version: true },
    });

    const researchObject = await prisma.researchObject.upsert({
      where: { threadId },
      create: {
        threadId,
        structuredContent,
        version: 1,
        renderedFormats: {},
      },
      update: {
        structuredContent,
        version: (existing?.version ?? 0) + 1,
      },
    });

    return NextResponse.json(researchObject, {
      status: existing ? 200 : 201,
    });
  } catch (error) {
    console.error("Failed to upsert research object:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
