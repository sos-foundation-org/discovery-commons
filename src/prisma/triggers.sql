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
-- 0. Migration backfill (Web Prototype §3B.5 / §4). Contributions that were
--    already public before published_at existed have NULL published_at and
--    would lose their credit priority. Backfill from the reveal time, falling
--    back to the creation (priority) timestamp. Idempotent: the WHERE clause
--    matches nothing on re-run. Runs safely with the guard trigger installed —
--    setting published_at on an already-public row (OLD.published_at IS NULL)
--    passes every guard below.
-- ---------------------------------------------------------------------------
UPDATE contributions
SET published_at = COALESCE(revealed_at, created_at)
WHERE visibility = 'public' AND published_at IS NULL;

-- ---------------------------------------------------------------------------
-- 1. content_hash immutability. The shared helper still guards
--    contribution_versions; contributions are guarded by the merged
--    contributions_before_update_guard() below (§4).
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

DROP TRIGGER IF EXISTS trg_cv_hash_immutable ON contribution_versions;
CREATE TRIGGER trg_cv_hash_immutable
  BEFORE UPDATE ON contribution_versions
  FOR EACH ROW EXECUTE FUNCTION prevent_hash_modification();

-- ---------------------------------------------------------------------------
-- 2. Visibility widen-only rule for THREADS (contributions are handled by the
--    merged guard below). public is terminal; a thread can only widen.
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

DROP TRIGGER IF EXISTS trg_threads_visibility_rules ON threads;
CREATE TRIGGER trg_threads_visibility_rules
  BEFORE UPDATE ON threads
  FOR EACH ROW EXECUTE FUNCTION prevent_visibility_downgrade();

-- ---------------------------------------------------------------------------
-- 3. Retire the pre-v1.3 per-concern contribution triggers. Their logic is now
--    consolidated into contributions_before_update_guard() (§4) so execution
--    order is explicit rather than dependent on trigger-name alphabetization.
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_contributions_hash_immutable ON contributions;
DROP TRIGGER IF EXISTS trg_contributions_created_immutable ON contributions;
DROP TRIGGER IF EXISTS trg_contributions_sealed_immutable ON contributions;
DROP TRIGGER IF EXISTS trg_contributions_visibility_rules ON contributions;
DROP FUNCTION IF EXISTS prevent_created_at_modification();
DROP FUNCTION IF EXISTS prevent_sealed_content_edit();

-- ---------------------------------------------------------------------------
-- 4. Contributions — merged BEFORE UPDATE guard (Web Prototype §4, v1.3 R4).
--    A single function so the ordering of the checks is controlled in code:
--      Step 1  immutable columns (content_hash, created_at priority timestamp)
--      Step 2  sealed content is frozen
--      Step 3  visibility transition rules (public terminal, sealed↛private)
--      Step 4  lifecycle timestamps — sealed_at / revealed_at / published_at
--              are each auto-stamped by the DB on the widening transition and
--              are immutable once set. published_at additionally cannot exist
--              on a non-public row (triple-protection against forgery).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION contributions_before_update_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Step 1: immutable columns.
  IF OLD.content_hash IS DISTINCT FROM NEW.content_hash THEN
    RAISE EXCEPTION 'content_hash is immutable and cannot be modified';
  END IF;
  IF OLD.created_at IS DISTINCT FROM NEW.created_at THEN
    RAISE EXCEPTION 'created_at is immutable (priority timestamp)';
  END IF;

  -- Step 2: sealed content is frozen once the public hash is committed.
  IF OLD.visibility = 'sealed' AND OLD.content IS DISTINCT FROM NEW.content THEN
    RAISE EXCEPTION 'sealed contribution content cannot be modified';
  END IF;

  -- Step 3: visibility transition rules.
  IF OLD.visibility = 'public' AND NEW.visibility <> 'public' THEN
    RAISE EXCEPTION 'cannot downgrade visibility from public';
  END IF;
  IF OLD.visibility = 'sealed' AND NEW.visibility = 'private' THEN
    RAISE EXCEPTION 'cannot revert a sealed contribution to private';
  END IF;

  -- Step 4a: sealed_at — auto-set on → sealed, immutable once set.
  IF OLD.visibility <> 'sealed' AND NEW.visibility = 'sealed' THEN
    NEW.sealed_at = now();
  END IF;
  IF OLD.sealed_at IS NOT NULL AND OLD.sealed_at IS DISTINCT FROM NEW.sealed_at THEN
    RAISE EXCEPTION 'sealed_at is immutable once set';
  END IF;

  -- Step 4b: revealed_at — auto-set on sealed → shared/public, immutable.
  IF OLD.visibility = 'sealed' AND NEW.visibility IN ('shared', 'public') THEN
    NEW.revealed_at = now();
  END IF;
  IF OLD.revealed_at IS NOT NULL AND OLD.revealed_at IS DISTINCT FROM NEW.revealed_at THEN
    RAISE EXCEPTION 'revealed_at is immutable once set';
  END IF;

  -- Step 4c: published_at — the credit timestamp. Auto-set on → public, may
  -- never exist on a non-public row, immutable once set.
  IF OLD.visibility <> 'public' AND NEW.visibility = 'public' THEN
    NEW.published_at = now();
  END IF;
  IF NEW.published_at IS NOT NULL AND NEW.visibility <> 'public' THEN
    RAISE EXCEPTION 'published_at can only be set when visibility is public';
  END IF;
  IF OLD.published_at IS NOT NULL AND OLD.published_at IS DISTINCT FROM NEW.published_at THEN
    RAISE EXCEPTION 'published_at is immutable once set';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_contributions_before_update_guard ON contributions;
CREATE TRIGGER trg_contributions_before_update_guard
  BEFORE UPDATE ON contributions
  FOR EACH ROW EXECUTE FUNCTION contributions_before_update_guard();

-- ---------------------------------------------------------------------------
-- 5. Contributions — BEFORE INSERT guard (Web Prototype §4, v1.3 R4). Prevents
--    inserting a row with a forged lifecycle timestamp: published_at/sealed_at
--    are derived from the row's visibility, and revealed_at is always NULL at
--    creation (a brand-new row can never already be revealed).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION contributions_before_insert_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.visibility = 'public' THEN
    NEW.published_at = now();
  ELSE
    NEW.published_at = NULL;
  END IF;

  IF NEW.visibility = 'sealed' THEN
    NEW.sealed_at = now();
  ELSE
    NEW.sealed_at = NULL;
  END IF;

  NEW.revealed_at = NULL;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_contributions_before_insert_guard ON contributions;
CREATE TRIGGER trg_contributions_before_insert_guard
  BEFORE INSERT ON contributions
  FOR EACH ROW EXECUTE FUNCTION contributions_before_insert_guard();

-- ---------------------------------------------------------------------------
-- 6. Credit records are append-only: hash + timestamp immutable (credits + credits_v2)
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
-- 7. Sealed registration hash + timestamp immutable (legacy seal table)
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
-- 8. No deletes on hash-bearing / append-only tables (P-2: data integrity)
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
