import type { Prisma, PrismaClient } from "@prisma/client";
import type { AIRole } from "../types";

/**
 * Default model for AI features. Configurable via AI_MODEL so the deployment
 * can trade cost vs. capability without code changes. Defaults to the latest
 * Opus per Anthropic guidance.
 */
export const AI_MODEL = process.env.AI_MODEL || "claude-opus-4-8";

// USD per 1M tokens, by model. Used for per-interaction cost tracking.
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-4-8": { input: 5.0, output: 25.0 },
  "claude-opus-4-7": { input: 5.0, output: 25.0 },
  "claude-opus-4-6": { input: 5.0, output: 25.0 },
  "claude-sonnet-4-6": { input: 3.0, output: 15.0 },
  "claude-haiku-4-5": { input: 1.0, output: 5.0 },
};

/** Compute the USD cost of a call from token counts. */
export function computeCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING["claude-opus-4-8"];
  return (
    (inputTokens / 1_000_000) * pricing.input +
    (outputTokens / 1_000_000) * pricing.output
  );
}

export function isAIConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

type DbClient = PrismaClient | Prisma.TransactionClient;

/** Record an AI interaction for cost monitoring and per-role quotas. */
export async function logAIInteraction(
  client: DbClient,
  params: {
    userId: string;
    threadId?: string | null;
    aiRole: AIRole;
    aiFeature: string;
    inputTokens: number;
    outputTokens: number;
    cached?: boolean;
    responseData?: unknown;
    model?: string;
  }
) {
  const cost = computeCost(
    params.model || AI_MODEL,
    params.inputTokens,
    params.outputTokens
  );
  return client.aIInteraction.create({
    data: {
      userId: params.userId,
      threadId: params.threadId ?? null,
      aiRole: params.aiRole,
      aiFeature: params.aiFeature,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      cost,
      cached: params.cached ?? false,
      responseData: (params.responseData ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}

/**
 * Per-user daily quota check for AI calls of a given role. Returns whether the
 * user is under quota and the count so far today. Quotas come from env with
 * sensible defaults from the brief.
 */
export async function checkDailyQuota(
  client: DbClient,
  userId: string,
  aiRole: AIRole
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const limit =
    aiRole === "reviewer"
      ? Number(process.env.AI_REVIEWER_DAILY_QUOTA || 5)
      : Number(process.env.AI_PER_USER_DAILY_QUOTA || 10);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const used = await client.aIInteraction.count({
    where: { userId, aiRole, createdAt: { gte: startOfDay } },
  });

  return { allowed: used < limit, used, limit };
}
