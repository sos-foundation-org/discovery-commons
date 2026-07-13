import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  name: z.string().min(1).max(80).optional(),
});

// Create a self-service email+password account. Passwords are bcrypt-hashed.
// Prototype: no email verification / 2FA (deferred).
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const name = parsed.data.name?.trim() || email.split("@")[0];

  await prisma.user.create({
    data: {
      email,
      name,
      displayName: name,
      passwordHash,
      trustLevel: "new_member",
      covenantAcceptedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
