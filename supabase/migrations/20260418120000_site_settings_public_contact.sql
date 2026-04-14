-- Public contact for the landing: display phone and email for mailto (no JSON — scalar columns).
-- RLS unchanged: anon/authenticated keep SELECT on site_settings; admin writes use service_role.
--
-- NULL or empty string in a column → application uses code default for that field (@entities/wedding-venue).

ALTER TABLE site_settings
    ADD COLUMN public_contact_phone TEXT NULL,
    ADD COLUMN public_contact_email TEXT NULL;

COMMENT ON COLUMN site_settings.public_contact_phone IS
    'Display phone for the site; NULL or empty → code default.';

COMMENT ON COLUMN site_settings.public_contact_email IS
    'Email for mailto:; NULL or empty → code default.';

-- Existing `default` row keeps both columns NULL (same behavior as before this migration).
