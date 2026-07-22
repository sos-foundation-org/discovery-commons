-- ============================================================================
-- Discovery Commons — Row-Level Security (Supabase REST API lockdown)
-- ============================================================================
-- This app authenticates via NextAuth and connects through Prisma as the
-- database owner (postgres role), which BYPASSES RLS. The Supabase REST API
-- (PostgREST), however, uses the `anon` and `authenticated` roles — without
-- RLS enabled, anyone with the anon key can read/write ALL tables.
--
-- Fix: enable RLS on every table with NO policies. Effect:
--   - Prisma (postgres role) → unaffected (superuser bypasses RLS)
--   - Supabase REST API (anon/authenticated) → all access denied
--
-- Apply ONCE against Supabase after `prisma db push`:
--
--   psql "$DATABASE_URL" -f src/prisma/rls.sql
--
-- Idempotent: safe to re-run. Resolves Supabase security advisories:
--   - rls_disabled_in_public
--   - sensitive_columns_exposed
-- ============================================================================

-- NextAuth tables
ALTER TABLE accounts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_tokens  ENABLE ROW LEVEL SECURITY;

-- Domain tables
ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads              ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE contribution_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sealed_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits              ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_circles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE contribution_shares  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE visibility_logs      ENABLE ROW LEVEL SECURITY;

-- v2 tables (Phase 2)
ALTER TABLE credits_v2           ENABLE ROW LEVEL SECURITY;
ALTER TABLE replications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_objects     ENABLE ROW LEVEL SECURITY;

-- Social features
ALTER TABLE contribution_likes   ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Also revoke direct table access from anon/authenticated as defense-in-depth.
-- Even with RLS enabled, revoking privileges ensures zero access even if
-- someone accidentally creates an overly permissive policy later.
-- ============================================================================
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;

-- Keep sequence usage for any future insert policies (unlikely but harmless)
-- REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
-- REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
