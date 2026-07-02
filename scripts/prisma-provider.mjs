// Dual-provider Prisma helper.
//
// Prisma's datasource `provider` must be a static literal — it cannot read an
// env var. To run SQLite locally (per the dev setup: no Docker/Postgres) while
// deploying to Supabase PostgreSQL, we rewrite the provider line in
// schema.prisma at generate/build time based on DATABASE_PROVIDER.
//
//   DATABASE_PROVIDER unset | "sqlite"     -> provider = "sqlite"   (local dev)
//   DATABASE_PROVIDER = "postgresql"       -> provider = "postgresql" (Vercel/Supabase)
//
// Set DATABASE_PROVIDER=postgresql in the Vercel project env. Locally, leave it
// unset so the committed schema (sqlite) is not modified in git.
//
// The schema uses only portable types (Json instead of scalar lists, no native
// Postgres enums), so the same file works on both engines unchanged.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(__dirname, "..", "src", "prisma", "schema.prisma");

const raw = (process.env.DATABASE_PROVIDER || "sqlite").trim().toLowerCase();
const target = raw === "postgres" ? "postgresql" : raw;

if (target !== "sqlite" && target !== "postgresql") {
  console.error(
    `[prisma-provider] Unsupported DATABASE_PROVIDER="${process.env.DATABASE_PROVIDER}". Use "sqlite" or "postgresql".`
  );
  process.exit(1);
}

const schema = readFileSync(schemaPath, "utf8");
// Replace only the datasource provider ("sqlite" | "postgresql"); the generator
// provider ("prisma-client-js") is left untouched.
const updated = schema.replace(
  /provider\s*=\s*"(?:sqlite|postgresql)"/,
  `provider = "${target}"`
);

if (updated !== schema) {
  writeFileSync(schemaPath, updated);
  console.log(`[prisma-provider] datasource provider set to "${target}"`);
} else {
  console.log(`[prisma-provider] datasource provider already "${target}"`);
}
