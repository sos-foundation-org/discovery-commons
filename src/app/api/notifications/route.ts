import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: session.user.id, isRead: false },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Failed to list notifications:", error);
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
    if (body.markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    if (body.id) {
      const notif = await prisma.notification.findUnique({
        where: { id: body.id },
      });
      if (!notif || notif.userId !== session.user.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      await prisma.notification.update({
        where: { id: body.id },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Failed to update notifications:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
