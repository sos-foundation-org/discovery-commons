import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SUPPORTED_LOCALES } from "@/lib/i18n";

const translateSchema = z.object({
  contributionId: z.string().min(1),
  targetLocale: z.enum(SUPPORTED_LOCALES),
});

/**
 * POST /api/translate — translate a contribution's content to target locale.
 *
 * Strategy:
 * 1. Check cache first (stored in contribution.metadata.translations)
 * 2. If not cached, call Anthropic API (already in deps)
 * 3. Cache the result for future requests
 *
 * Falls back gracefully: if ANTHROPIC_API_KEY is not set, returns a helpful
 * message instead of crashing. This lets the feature degrade gracefully
 * on environments without the key.
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to translate" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = translateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const { contributionId, targetLocale } = parsed.data;

  // Fetch contribution
  const contribution = await prisma.contribution.findUnique({
    where: { id: contributionId },
    select: { content: true, metadata: true },
  });
  if (!contribution) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Check cache
  const meta = (contribution.metadata as Record<string, unknown>) ?? {};
  const translations = (meta.translations as Record<string, string>) ?? {};
  if (translations[targetLocale]) {
    return NextResponse.json({
      translation: translations[targetLocale],
      cached: true,
    });
  }

  // Translate via Anthropic (if API key available)
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Translation service not configured. Try using your browser's built-in translation." },
      { status: 503 }
    );
  }

  const localeNames: Record<string, string> = {
    en: "English",
    "zh-TW": "Traditional Chinese (繁體中文)",
    "zh-CN": "Simplified Chinese (简体中文)",
  };

  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: `Translate the following text to ${localeNames[targetLocale]}. Preserve all Markdown formatting, code blocks, and technical terms. Only output the translation, nothing else.\n\n${contribution.content}`,
        },
      ],
    });

    const translatedText =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Cache in metadata (non-blocking)
    const updatedTranslations = { ...translations, [targetLocale]: translatedText };
    const updatedMeta = { ...meta, translations: updatedTranslations };
    prisma.contribution
      .update({
        where: { id: contributionId },
        data: { metadata: updatedMeta as any },
      })
      .catch(() => {}); // Non-blocking cache write

    return NextResponse.json({
      translation: translatedText,
      cached: false,
    });
  } catch (error) {
    console.error("Translation failed:", error);
    return NextResponse.json(
      { error: "Translation failed. Try again later." },
      { status: 500 }
    );
  }
}
