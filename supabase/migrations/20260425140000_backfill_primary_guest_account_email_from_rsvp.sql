-- Backfill guest_accounts.email for primary party members from rsvp.email.
-- Matches app behavior: trim + lower (see normalizeGuestAccountEmailForStorage in @entities/guest-account).
-- Skips rows that would violate guest_accounts_email_lower_unique (another row already has that address).

UPDATE guest_accounts ga
SET email = lower(trim(r.email))
FROM rsvp r
WHERE r.id = ga.rsvp_id
  AND ga.is_primary = true
  AND ga.email IS NULL
  AND r.email IS NOT NULL
  AND trim(r.email) <> ''
  AND NOT EXISTS (
      SELECT 1
      FROM guest_accounts other
      WHERE other.id <> ga.id
        AND other.email IS NOT NULL
        AND lower(trim(other.email)) = lower(trim(r.email))
  );
