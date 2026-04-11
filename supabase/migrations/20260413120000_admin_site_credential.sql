-- Singleton admin login: bcrypt hash in DB (no env password vars).
-- RLS enabled with no policies — anon/authenticated cannot access; service_role bypasses RLS.

CREATE TABLE admin_site_credential
(
    id             SMALLINT PRIMARY KEY     DEFAULT 1 CHECK (id = 1),
    password_hash  TEXT        NOT NULL,
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE admin_site_credential ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE admin_site_credential IS 'Singleton row: admin panel password hash (bcrypt). Set via npm run admin:set-password.';

CREATE OR REPLACE FUNCTION admin_site_credential_set_updated_at()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SET search_path = public
AS
$$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER admin_site_credential_updated_at
    BEFORE UPDATE
    ON admin_site_credential
    FOR EACH ROW
    EXECUTE PROCEDURE admin_site_credential_set_updated_at();
