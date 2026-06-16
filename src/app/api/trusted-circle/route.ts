import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const circle = await prisma.trustedCircle.findMany({
      where: { ownerId: session.user.id },
      include: {
        trustedUser: {
          select: {
            id: true,
            email: true,
            displayName: true,
            name: true,
            image: true,
            trustLevel: true,
          },
        },
      },
      orderBy: { addedAt: "desc" },
    });

    return NextResponse.json(circle);
  } catch (error) {
    console.error("Failed to list trusted circle:", error);
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
    const { email, note } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (email === session.user.email) {
      return NextResponse.json(
        { error: "You cannot add yourself to your trusted circle" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "No user found with that email. They must sign up first." },
        { status: 404 }
      );
    }

    const existing = await prisma.trustedCircle.findUnique({
      where: {
        ownerId_trustedUserId: {
          ownerId: session.user.id,
          trustedUserId: targetUser.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This user is already in your trusted circle" },
        { status: 409 }
      );
    }

    const entry = await prisma.trustedCircle.create({
      data: {
        ownerId: session.user.id,
        trustedUserId: targetUser.id,
        note: note || null,
      },
      include: {
        trustedUser: {
          select: {
            id: true,
            email: true,
            displayName: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Failed to add user to trusted circle:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get("id");

    if (!entryId) {
      return NextResponse.json({ error: "Entry ID required" }, { status: 400 });
    }

    const entry = await prisma.trustedCircle.findUnique({
      where: { id: entryId },
    });

    if (!entry || entry.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.trustedCircle.delete({ where: { id: entryId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove user from trusted circle:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
