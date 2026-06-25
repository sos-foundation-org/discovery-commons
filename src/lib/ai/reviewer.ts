import Anthropic from "@anthropic-ai/sdk";
import { AI_MODEL, isAIConfigured } from "./router";
import {
  AI_REVIEWER_SYSTEM_PROMPT,
  type AIReviewResult,
} from "./prompts/reviewer";

export interface RunReviewOutput {
  result: AIReviewResult;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Run the AI Reviewer over assembled thread content. Returns the structured
 * review plus token usage for cost logging. Throws if the AI is not configured
 * (no ANTHROPIC_API_KEY) so the caller can return a clear 503.
 */
export async function runReview(threadContent: string): Promise<RunReviewOutput> {
  if (!isAIConfigured()) {
    throw new Error("AI is not configured (ANTHROPIC_API_KEY missing)");
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 2048,
    system: AI_REVIEWER_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Review the following Discovery Commons thread content and return your JSON assessment.\n\n---\n${threadContent}\n---`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  const raw = textBlock && "text" in textBlock ? textBlock.text : "";

  const result = parseReviewJson(raw);

  return {
    result,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  };
}

/**
 * Defensively parse the model's JSON. Strips markdown fences if present and
 * falls back to a "concerns" assessment with low confidence if parsing fails,
 * so a malformed response never crashes the route.
 */
export function parseReviewJson(raw: string): AIReviewResult {
  let text = raw.trim();
  // Strip ```json ... ``` fences if the model added them.
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) text = fenceMatch[1].trim();

  try {
    const parsed = JSON.parse(text) as AIReviewResult;
    if (!parsed.overallAssessment || !Array.isArray(parsed.checks)) {
      throw new Error("Missing required fields");
    }
    // Clamp confidence into [0, 1].
    parsed.confidenceScore = Math.min(1, Math.max(0, Number(parsed.confidenceScore) || 0));
    return parsed;
  } catch {
    return {
      overallAssessment: "concerns",
      confidenceScore: 0,
      checks: [],
      summary:
        "The AI Reviewer returned a response that could not be parsed. Please try again. AI review supplements but does not replace human expert review.",
    };
  }
}
