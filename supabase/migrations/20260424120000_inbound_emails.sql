-- Inbound messages from Resend (email.received webhook).
-- RLS enabled with no policies for anon/authenticated — service_role only.

CREATE TABLE inbound_emails
(
    id               UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    resend_event_id  TEXT        NOT NULL UNIQUE,
    to_address       TEXT        NOT NULL,
    from_address     TEXT        NOT NULL,
    from_name        TEXT,
    subject          TEXT,
    html             TEXT,
    text             TEXT,
    message_id       TEXT,
    in_reply_to      TEXT,
    "references"     TEXT,
    status           TEXT        NOT NULL CHECK (status IN ('unread', 'read', 'archived')),
    received_at      TIMESTAMPTZ NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inbound_emails_received_at ON inbound_emails (received_at DESC);
CREATE INDEX idx_inbound_emails_status ON inbound_emails (status);

CREATE TABLE inbound_email_attachments
(
    id               UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    inbound_email_id UUID        NOT NULL REFERENCES inbound_emails (id) ON DELETE CASCADE,
    filename         TEXT        NOT NULL,
    content_type     TEXT,
    size_bytes       BIGINT,
    r2_key           TEXT        NOT NULL,
    r2_public_url    TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inbound_email_attachments_inbound_email_id ON inbound_email_attachments (inbound_email_id);

ALTER TABLE inbound_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbound_email_attachments ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE inbound_emails IS 'Inbound mail ingested from Resend; resend_event_id is idempotent.';
COMMENT ON TABLE inbound_email_attachments IS 'Attachment metadata and R2 object keys for inbound mail.';
