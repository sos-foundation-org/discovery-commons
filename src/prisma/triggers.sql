-- ============================================================================
-- Discovery Commons — PostgreSQL integrity triggers (production / Supabase)
-- ============================================================================
-- These enforce the data-integrity guarantees the app relies on (Policy P-2:
-- never delete, never tamper) at the database level. They are PostgreSQL-only;
-- SQLite (local dev) lacks BEFORE UPDATE triggers, so local dev relies on the
-- app layer alone. Apply this file ONCE against Supabase after `prisma db push`:
--
--   psql "$DATABASE_URL" -f src/prisma/triggers.sql
--
-- Access control (who can SEE what) is enforced in the app layer
-- (src/lib/access-control.ts), NOT via Postgres RLS: this app authenticates
-- with NextAuth and connects through Prisma as the database owner, which
-- bypasses RLS. These triggers only guard immutability, which Prisma cannot
-- bypass. Idempotent: safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. content_hash immutability (contributions + contribution_versions)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION prevent_hash_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF OLD.content_hash IS DISTINCT FROM NEW.content_hash THEN
    RAISE EXCEPTION 'content_hash is immutable and cannot be modified';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_contributions_hash_immutable ON contributions;
CREATE TRIGGER trg_contributions_hash_immutable
  BEFORE UPDATE ON contributions
  FOR EACH ROW EXECUTE FUNCTION prevent_hash_modification();

DROP TRIGGER IF EXISTS trg_cv_hash_immutable ON contribution_versions;
CREATE TRIGGER trg_cv_hash_immutable
  BEFORE UPDATE ON contribution_versions
  FOR EACH ROW EXECUTE FUNCTION prevent_hash_modification();

-- ---------------------------------------------------------------------------
-- 2. created_at (priority timestamp) immutability on contributions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION prevent_created_at_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF OLD.created_at IS DISTINCT FROM NEW.created_at THEN
    RAISE EXCEPTION 'created_at is immutable (priority timestamp)';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_contributions_created_immutable ON contributions;
CREATE TRIGGER trg_contributions_created_immutable
  BEFORE UPDATE ON contributions
  FOR EACH ROW EXECUTE FUNCTION prevent_created_at_modification();

-- ---------------------------------------------------------------------------
-- 3. Sealed content is immutable (Web Prototype §4). Once sealed, the content
--    that produced the public hash can never change.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION prevent_sealed_content_edit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF OLD.visibility = 'sealed' AND OLD.content IS DISTINCT FROM NEW.content THEN
    RAISE EXCEPTION 'sealed contribution content cannot be modified';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_contributions_sealed_immutable ON contributions;
CREATE TRIGGER trg_contributions_sealed_immutable
  BEFORE UPDATE ON contributions
  FOR EACH ROW EXECUTE FUNCTION prevent_sealed_content_edit();

-- ---------------------------------------------------------------------------
-- 4. Visibility can only widen, never narrow. Applies to threads AND
--    contributions (both have a `visibility` column). public is terminal;
--    sealed can be revealed (→ shared/public) but never reverted to private.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION prevent_visibility_downgrade()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF OLD.visibility = 'public' AND NEW.visibility <> 'public' THEN
    RAISE EXCEPTION 'cannot downgrade visibility from public';
  END IF;
  IF OLD.visibility = 'sealed' AND NEW.visibility = 'private' THEN
    RAISE EXCEPTION 'cannot revert a sealed contribution to private';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_contributions_visibility_rules ON contributions;
CREATE TRIGGER trg_contributions_visibility_rules
  BEFORE UPDATE ON contributions
  FOR EACH ROW EXECUTE FUNCTION prevent_visibility_downgrade();

DROP TRIGGER IF EXISTS trg_threads_visibility_rules ON threads;
CREATE TRIGGER trg_threads_visibility_rules
  BEFORE UPDATE ON threads
  FOR EACH ROW EXECUTE FUNCTION prevent_visibility_downgrade();

-- ---------------------------------------------------------------------------
-- 5. Credit records are append-only: hash + timestamp immutable (credits + credits_v2)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION prevent_credit_hash_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF OLD.hash IS DISTINCT FROM NEW.hash THEN
    RAISE EXCEPTION 'credit hash is immutable';
  END IF;
  IF OLD.timestamp IS DISTINCT FROM NEW.timestamp THEN
    RAISE EXCEPTION 'credit timestamp is immutable';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_credits_immutable ON credits;
CREATE TRIGGER trg_credits_immutable
  BEFORE UPDATE ON credits
  FOR EACH ROW EXECUTE FUNCTION prevent_credit_hash_modification();

DROP TRIGGER IF EXISTS trg_credits_v2_immutable ON credits_v2;
CREATE TRIGGER trg_credits_v2_immutable
  BEFORE UPDATE ON credits_v2
  FOR EACH ROW EXECUTE FUNCTION prevent_credit_hash_modification();

-- ---------------------------------------------------------------------------
-- 6. Sealed registration hash + timestamp immutable (legacy seal table)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION prevent_sealed_hash_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF OLD.content_hash IS DISTINCT FROM NEW.content_hash THEN
    RAISE EXCEPTION 'sealed registration hash is immutable';
  END IF;
  IF OLD.registered_at IS DISTINCT FROM NEW.registered_at THEN
    RAISE EXCEPTION 'sealed registration timestamp is immutable';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sealed_hash_immutable ON sealed_registrations;
CREATE TRIGGER trg_sealed_hash_immutable
  BEFORE UPDATE ON sealed_registrations
  FOR EACH ROW EXECUTE FUNCTION prevent_sealed_hash_modification();

-- ---------------------------------------------------------------------------
-- 7. No deletes on hash-bearing / append-only tables (P-2: data integrity)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION prevent_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'Deletion is not allowed on this table (Policy P-2: data integrity)';
END;
$$;

DROP TRIGGER IF EXISTS trg_contributions_no_delete ON contributions;
CREATE TRIGGER trg_contributions_no_delete
  BEFORE DELETE ON contributions
  FOR EACH ROW EXECUTE FUNCTION prevent_delete();

DROP TRIGGER IF EXISTS trg_cv_no_delete ON contribution_versions;
CREATE TRIGGER trg_cv_no_delete
  BEFORE DELETE ON contribution_versions
  FOR EACH ROW EXECUTE FUNCTION prevent_delete();

DROP TRIGGER IF EXISTS trg_credits_no_delete ON credits;
CREATE TRIGGER trg_credits_no_delete
  BEFORE DELETE ON credits
  FOR EACH ROW EXECUTE FUNCTION prevent_delete();

DROP TRIGGER IF EXISTS trg_credits_v2_no_delete ON credits_v2;
CREATE TRIGGER trg_credits_v2_no_delete
  BEFORE DELETE ON credits_v2
  FOR EACH ROW EXECUTE FUNCTION prevent_delete();

DROP TRIGGER IF EXISTS trg_sealed_no_delete ON sealed_registrations;
CREATE TRIGGER trg_sealed_no_delete
  BEFORE DELETE ON sealed_registrations
  FOR EACH ROW EXECUTE FUNCTION prevent_delete();
