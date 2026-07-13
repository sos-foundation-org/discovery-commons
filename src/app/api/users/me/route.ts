import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        _count: {
          select: {
            threads: true,
            contributions: true,
            sealedRegistrations: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Failed to get current user:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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
    const updates: any = {};
    if (body.displayName !== undefined) updates.displayName = body.displayName;
    if (body.bio !== undefined) updates.bio = body.bio;
    if (body.interests !== undefined) updates.interests = body.interests;
    // Avatar: a chosen icon path (/avatars/xx.png) or null to clear it.
    if (body.image !== undefined) {
      updates.image =
        typeof body.image === "string" && body.image.startsWith("/avatars/")
          ? body.image
          : body.image === null
            ? null
            : undefined;
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updates,
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Failed to update current user:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
