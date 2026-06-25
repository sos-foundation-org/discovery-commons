import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// DELETE /api/v2/auth/orcid/unlink — remove the ORCID linkage from the account.
export async function DELETE(_request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { orcidId: null, orcidVerified: false },
    });
    return NextResponse.json({ linked: false });
  } catch (error) {
    console.error("Failed to unlink ORCID:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
