-- Links public contact email to a verified Resend sender row (display name + mailbox for inbound replies).

ALTER TABLE site_settings
    ADD COLUMN public_contact_sender_id UUID REFERENCES email_senders (id) ON DELETE SET NULL;

COMMENT ON COLUMN site_settings.public_contact_sender_id IS
    'Optional email_senders row: Resend From line for inbound replies must match this identity; mailbox should match public_contact_email.';
