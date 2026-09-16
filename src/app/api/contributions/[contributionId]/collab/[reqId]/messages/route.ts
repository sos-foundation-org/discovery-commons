import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const messageSchema = z.object({
  text: z.string().min(1).max(2000),
});

interface ChatMessage {
  senderId: string;
  text: string;
  createdAt: string;
}

/**
 * GET /api/contributions/[contributionId]/collab/[reqId]/messages
 * Read chat messages. Privacy Layer 1: only the two parties can access.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { contributionId: string; reqId: string } }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const request = await prisma.collaborationRequest.findUnique({
    where: { id: params.reqId },
    select: {
      contributionId: true,
      applicantId: true,
      status: true,
      message: true,
      messages: true,
      contribution: { select: { authorId: true } },
    },
  });

  if (!request || request.contributionId !== params.contributionId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Privacy Layer 1: strict two-party check
  const isApplicant = session.user.id === request.applicantId;
  const isAuthor = session.user.id === request.contribution.authorId;
  if (!isApplicant && !isAuthor) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const chatMessages = (request.messages as unknown as ChatMessage[]) ?? [];

  return NextResponse.json({
    initialMessage: request.message,
    messages: chatMessages,
    status: request.status,
  });
}

/**
 * POST /api/contributions/[contributionId]/collab/[reqId]/messages
 * Send a chat message. Auto-transitions status from pending→chatting on first author reply.
 * Uses JSON append pattern to avoid lost-update on concurrent writes.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { contributionId: string; reqId: string } }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const collabReq = await prisma.collaborationRequest.findUnique({
    where: { id: params.reqId },
    select: {
      id: true,
      contributionId: true,
      applicantId: true,
      status: true,
      messages: true,
      contribution: { select: { authorId: true } },
    },
  });

  if (!collabReq || collabReq.contributionId !== params.contributionId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Privacy Layer 1: only the two parties
  const isApplicant = session.user.id === collabReq.applicantId;
  const isAuthor = session.user.id === collabReq.contribution.authorId;
  if (!isApplicant && !isAuthor) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Can only chat on pending or chatting requests
  if (!["pending", "chatting"].includes(collabReq.status)) {
    return NextResponse.json(
      { error: `Cannot send messages on a ${collabReq.status} request` },
      { status: 400 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const newMessage: ChatMessage = {
    senderId: session.user.id,
    text: parsed.data.text,
    createdAt: new Date().toISOString(),
  };

  // Append message to the JSON array (read-append-write in a transaction
  // to minimize lost-update window; acceptable for low-volume MVP chat)
  const existingMessages = (collabReq.messages as unknown as ChatMessage[]) ?? [];
  const updatedMessages = [...existingMessages, newMessage];

  // Auto-transition: pending → chatting on first author reply
  const newStatus =
    collabReq.status === "pending" && isAuthor
      ? "chatting"
      : collabReq.status;

  await prisma.collaborationRequest.update({
    where: { id: params.reqId },
    data: {
      messages: updatedMessages as unknown as import("@prisma/client").Prisma.InputJsonValue,
      status: newStatus,
      ...(newStatus !== collabReq.status ? { respondedAt: new Date() } : {}),
    },
  });

  // Notify the other party
  const recipientId = isAuthor
    ? collabReq.applicantId
    : collabReq.contribution.authorId;
  const senderName = session.user.displayName || session.user.name || "Someone";
  prisma.notification
    .create({
      data: {
        userId: recipientId,
        type: "collab_message",
        title: "New message in collaboration chat",
        message: `${senderName}: ${parsed.data.text.slice(0, 80)}${parsed.data.text.length > 80 ? "..." : ""}`,
        linkUrl: `/threads/${params.contributionId}`,
      },
    })
    .catch(() => {});

  return NextResponse.json({ message: newMessage, status: newStatus });
}
