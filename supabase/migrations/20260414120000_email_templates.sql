-- Email templates and send history for admin broadcast (service_role only; RLS enabled, no anon policies).

CREATE TABLE email_templates
(
    id               UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    slug             TEXT        NOT NULL UNIQUE,
    name             TEXT        NOT NULL,
    subject_template TEXT        NOT NULL,
    body_html        TEXT        NOT NULL,
    body_text        TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE email_send_log
(
    id               UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    template_id      UUID REFERENCES email_templates (id) ON DELETE SET NULL,
    recipient_email  TEXT        NOT NULL,
    subject          TEXT        NOT NULL,
    status           TEXT        NOT NULL CHECK (status IN ('sent', 'failed')),
    resend_email_id  TEXT,
    error_message    TEXT,
    segment          TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_send_log_created_at ON email_send_log (created_at DESC);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_send_log ENABLE ROW LEVEL SECURITY;
