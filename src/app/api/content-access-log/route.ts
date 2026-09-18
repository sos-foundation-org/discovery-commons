import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import { logBackgroundError } from "@/lib/log";

const logSchema = z.object({
  contributionId: z.string().min(1),
  action: z.enum(["view", "copy_attempt", "download_attempt"]),
});

/**
 * POST /api/content-access-log — record a content access event.
 * Called by the frontend ProtectedContent wrapper on view/copy/download.
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = logSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  // Hash the IP for privacy (don't store raw IP)
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const ipHash = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);

  await prisma.contentAccessLog
    .create({
      data: {
        userId: session.user.id,
        contributionId: parsed.data.contributionId,
        action: parsed.data.action,
        ipHash,
      },
    })
    .catch(logBackgroundError("api/content-access-log")); // Non-blocking — don't fail the user experience

  return NextResponse.json({ logged: true });
}
