-- Verified "From" identities for admin email (Resend must allow each mailbox/domain).

CREATE TABLE email_senders
(
    id           UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    label        TEXT        NOT NULL,
    mailbox      TEXT        NOT NULL,
    display_name TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE email_templates
    ADD COLUMN sender_id UUID REFERENCES email_senders (id) ON DELETE SET NULL;

ALTER TABLE email_send_log
    ADD COLUMN from_address TEXT;

CREATE INDEX idx_email_templates_sender_id ON email_templates (sender_id);

ALTER TABLE email_senders ENABLE ROW LEVEL SECURITY;
