-- RSVP: at most one row per non-null email and per non-null phone.
-- Run via Supabase migrations or SQL Editor. Deduplicates existing rows (keeps newest by created_at).

DELETE FROM rsvp
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) AS rn
        FROM rsvp
        WHERE email IS NOT NULL
    ) t
    WHERE rn > 1
);

DELETE FROM rsvp
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at DESC) AS rn
        FROM rsvp
        WHERE phone IS NOT NULL
    ) t
    WHERE rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS rsvp_email_unique ON rsvp (email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS rsvp_phone_unique ON rsvp (phone) WHERE phone IS NOT NULL;
