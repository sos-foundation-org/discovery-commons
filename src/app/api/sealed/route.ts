import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sealRegistrationSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const seals = await prisma.sealedRegistration.findMany({
      where: { userId: session.user.id },
      orderBy: { registeredAt: "desc" },
      include: {
        contribution: {
          select: { id: true, threadId: true, type: true },
        },
      },
    });

    return NextResponse.json(seals);
  } catch (error) {
    console.error("Failed to list sealed registrations:", error);
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
    const parsed = sealRegistrationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { contentHash, title } = parsed.data;

    const seal = await prisma.sealedRegistration.create({
      data: {
        userId: session.user.id,
        contentHash,
        title,
      },
    });

    return NextResponse.json(seal, { status: 201 });
  } catch (error) {
    console.error("Failed to create sealed registration:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
