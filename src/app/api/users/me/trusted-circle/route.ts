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
          select: { id: true, displayName: true, name: true, image: true, email: true },
        },
      },
      orderBy: { addedAt: "desc" },
    });

    return NextResponse.json(circle);
  } catch (error) {
    console.error("Failed to list user trusted circle:", error);
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

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, displayName: true, name: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "No user found with that email" },
        { status: 404 }
      );
    }

    if (targetUser.id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot add yourself to your trusted circle" },
        { status: 400 }
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
        { error: "User is already in your trusted circle" },
        { status: 409 }
      );
    }

    const entry = await prisma.trustedCircle.create({
      data: {
        ownerId: session.user.id,
        trustedUserId: targetUser.id,
        note,
      },
      include: {
        trustedUser: {
          select: { id: true, displayName: true, name: true, image: true },
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
