-- Party members per RSVP: sessions, magic links, and photo ownership bind to guest_account_id.
-- Backfill: one primary guest_account per existing rsvp row (display_name = rsvp.name).

-- =============================================
-- guest_accounts
-- =============================================
CREATE TABLE guest_accounts
(
    id            UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    rsvp_id       UUID        NOT NULL REFERENCES rsvp (id) ON DELETE CASCADE,
    display_name  TEXT        NOT NULL,
    is_primary    BOOLEAN     NOT NULL,
    sort_order    SMALLINT    NOT NULL DEFAULT 0,
    email         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT guest_accounts_email_nonempty CHECK (email IS NULL OR trim(email) <> '')
);

ALTER TABLE guest_accounts ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_guest_accounts_rsvp_id ON guest_accounts (rsvp_id);
CREATE UNIQUE INDEX guest_accounts_one_primary_per_rsvp ON guest_accounts (rsvp_id) WHERE is_primary;
CREATE UNIQUE INDEX guest_accounts_email_lower_unique ON guest_accounts (lower(trim(email)))
    WHERE email IS NOT NULL AND trim(email) <> '';

INSERT INTO guest_accounts (rsvp_id, display_name, is_primary, sort_order, email)
SELECT id,
       name,
       true,
       0,
       NULL
FROM rsvp;

-- =============================================
-- guest_sessions: rsvp_id -> guest_account_id (primary)
-- =============================================
ALTER TABLE guest_sessions
    ADD COLUMN guest_account_id UUID REFERENCES guest_accounts (id) ON DELETE CASCADE;

UPDATE guest_sessions gs
SET guest_account_id = ga.id
FROM guest_accounts ga
WHERE ga.rsvp_id = gs.rsvp_id
  AND ga.is_primary;

ALTER TABLE guest_sessions
    ALTER COLUMN guest_account_id SET NOT NULL;

DROP INDEX idx_guest_sessions_rsvp_id;

ALTER TABLE guest_sessions
    DROP COLUMN rsvp_id;

CREATE INDEX idx_guest_sessions_guest_account_id ON guest_sessions (guest_account_id);

-- =============================================
-- guest_magic_link_tokens: rsvp_id -> guest_account_id (primary)
-- =============================================
ALTER TABLE guest_magic_link_tokens
    ADD COLUMN guest_account_id UUID REFERENCES guest_accounts (id) ON DELETE CASCADE;

UPDATE guest_magic_link_tokens t
SET guest_account_id = ga.id
FROM guest_accounts ga
WHERE ga.rsvp_id = t.rsvp_id
  AND ga.is_primary;

ALTER TABLE guest_magic_link_tokens
    ALTER COLUMN guest_account_id SET NOT NULL;

DROP INDEX idx_guest_magic_link_tokens_rsvp_id;

ALTER TABLE guest_magic_link_tokens
    DROP COLUMN rsvp_id;

CREATE INDEX idx_guest_magic_link_tokens_guest_account_id ON guest_magic_link_tokens (guest_account_id);

-- =============================================
-- photos: rsvp_id -> guest_account_id (primary for that RSVP)
-- =============================================
ALTER TABLE photos
    ADD COLUMN guest_account_id UUID REFERENCES guest_accounts (id) ON DELETE CASCADE;

UPDATE photos p
SET guest_account_id = ga.id
FROM guest_accounts ga
WHERE ga.rsvp_id = p.rsvp_id
  AND ga.is_primary
  AND p.rsvp_id IS NOT NULL;

DROP INDEX idx_photos_rsvp_id;

ALTER TABLE photos
    DROP COLUMN rsvp_id;

CREATE INDEX idx_photos_guest_account_id ON photos (guest_account_id) WHERE guest_account_id IS NOT NULL;
