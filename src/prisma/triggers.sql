-- Hash Immutability Triggers for Discovery Commons
-- These ensure that content_hash fields and sealed registration timestamps
-- cannot be modified after creation (Policy P-2: never delete, never tamper).

-- Prevent UPDATE to content_hash on contributions
CREATE OR REPLACE FUNCTION prevent_hash_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.content_hash IS DISTINCT FROM NEW.content_hash THEN
        RAISE EXCEPTION 'content_hash is immutable and cannot be modified';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS trg_contributions_hash_immutable
    BEFORE UPDATE ON contributions
    FOR EACH ROW
    EXECUTE FUNCTION prevent_hash_modification();

CREATE TRIGGER IF NOT EXISTS trg_cv_hash_immutable
    BEFORE UPDATE ON contribution_versions
    FOR EACH ROW
    EXECUTE FUNCTION prevent_hash_modification();

-- Prevent modification of sealed registration hash and timestamp
CREATE OR REPLACE FUNCTION prevent_sealed_hash_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.content_hash IS DISTINCT FROM NEW.content_hash THEN
        RAISE EXCEPTION 'sealed registration hash is immutable';
    END IF;
    IF OLD.registered_at IS DISTINCT FROM NEW.registered_at THEN
        RAISE EXCEPTION 'sealed registration timestamp is immutable';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS trg_sealed_hash_immutable
    BEFORE UPDATE ON sealed_registrations
    FOR EACH ROW
    EXECUTE FUNCTION prevent_sealed_hash_modification();

-- Prevent DELETE on hash-bearing tables (P-2: data integrity)
CREATE OR REPLACE FUNCTION prevent_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Deletion is not allowed on this table (Policy P-2: data integrity)';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS trg_contributions_no_delete
    BEFORE DELETE ON contributions
    FOR EACH ROW EXECUTE FUNCTION prevent_delete();

CREATE TRIGGER IF NOT EXISTS trg_cv_no_delete
    BEFORE DELETE ON contribution_versions
    FOR EACH ROW EXECUTE FUNCTION prevent_delete();

CREATE TRIGGER IF NOT EXISTS trg_sealed_no_delete
    BEFORE DELETE ON sealed_registrations
    FOR EACH ROW EXECUTE FUNCTION prevent_delete();
