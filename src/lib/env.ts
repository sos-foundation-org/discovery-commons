import { z } from "zod";

/**
 * Validated environment variables. Import `env` instead of using
 * `process.env` directly — missing or invalid vars throw at startup.
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DATABASE_PROVIDER: z.enum(["sqlite", "postgresql"]).default("sqlite"),

  // Auth
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(1).optional(),

  // OAuth (optional — app works without them)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // ORCID (Phase 2)
  ORCID_CLIENT_ID: z.string().optional(),
  ORCID_CLIENT_SECRET: z.string().optional(),
  ORCID_SANDBOX: z.string().optional(),

  // AI (Phase 2)
  ANTHROPIC_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default("claude-sonnet-4-20250514"),

  // Feature flags
  NEXT_PUBLIC_VISIBLE_DISCIPLINES: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
    // Don't crash in development — just warn
    if (process.env.NODE_ENV === "production") {
      throw new Error("Invalid environment variables");
    }
  }
  return result.success ? result.data : (process.env as unknown as z.infer<typeof envSchema>);
}

export const env = validateEnv();
