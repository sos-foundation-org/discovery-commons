import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { linkOrcidSchema } from "@/lib/validations";

// POST /api/v2/auth/orcid/link — manually link an ORCID iD to the current
// account. Self-asserted links are stored unverified (orcidVerified = false);
// the OAuth sign-in flow is what marks a link verified.
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

  const parsed = linkOrcidSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    // Ensure the ORCID iD isn't already linked to another account.
    const taken = await prisma.user.findUnique({
      where: { orcidId: parsed.data.orcidId },
      select: { id: true },
    });
    if (taken && taken.id !== session.user.id) {
      return NextResponse.json(
        { error: "This ORCID iD is already linked to another account" },
        { status: 409 }
      );
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { orcidId: parsed.data.orcidId, orcidVerified: false },
      select: { orcidId: true, orcidVerified: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Failed to link ORCID:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
