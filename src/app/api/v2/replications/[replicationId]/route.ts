import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateReplicationSchema } from "@/lib/validations";
import { updateVerificationBadge } from "@/lib/verification";

// PATCH /api/v2/replications/[replicationId] — update a replication outcome,
// then recompute the original thread's verification badge.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { replicationId: string } }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { replicationId } = params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
  }

  const parsed = updateReplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.replication.findUnique({
      where: { id: replicationId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Replication not found" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.replication.update({
        where: { id: replicationId },
        data: {
          outcome: parsed.data.outcome ?? existing.outcome,
          notes: parsed.data.notes ?? existing.notes,
        },
      });
      await updateVerificationBadge(existing.originalThreadId, tx);
      return result;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update replication:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
