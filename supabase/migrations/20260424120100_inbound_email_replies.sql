-- Admin replies to inbound messages (threading metadata on send path).
-- template_id FK to reply_templates is added in 20260424120200_reply_templates_and_webhook.sql.
-- RLS enabled with no policies — service_role only.

CREATE TABLE inbound_email_replies
(
    id               UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    inbound_email_id UUID        NOT NULL REFERENCES inbound_emails (id) ON DELETE CASCADE,
    to_address       TEXT        NOT NULL,
    subject          TEXT        NOT NULL,
    html             TEXT        NOT NULL,
    text             TEXT,
    resend_email_id  TEXT,
    from_address     TEXT        NOT NULL,
    template_id      UUID,
    sent_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inbound_email_replies_inbound_email_id ON inbound_email_replies (inbound_email_id);

ALTER TABLE inbound_email_replies ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE inbound_email_replies IS 'Outbound admin replies linked to an inbound row for UI history.';
