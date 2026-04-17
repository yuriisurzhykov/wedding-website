-- Reply templates for admin inbox and singleton Resend webhook subscription row.
-- RLS enabled with no policies — service_role only.

CREATE TABLE reply_templates
(
    id          UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    name        TEXT        NOT NULL,
    subject     TEXT        NOT NULL,
    heading     TEXT        NOT NULL,
    body_html   TEXT        NOT NULL,
    body_text   TEXT,
    is_default  BOOLEAN     NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE reply_templates ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION reply_templates_set_updated_at()
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

CREATE TRIGGER reply_templates_updated_at
    BEFORE UPDATE
    ON reply_templates
    FOR EACH ROW
    EXECUTE PROCEDURE reply_templates_set_updated_at();

ALTER TABLE inbound_email_replies
    ADD CONSTRAINT inbound_email_replies_template_id_fkey
        FOREIGN KEY (template_id) REFERENCES reply_templates (id) ON DELETE SET NULL;

CREATE TABLE resend_webhook_subscription
(
    id               TEXT PRIMARY KEY     DEFAULT 'default' CHECK (id = 'default'),
    webhook_id       TEXT,
    endpoint_url     TEXT,
    signing_secret   TEXT,
    filter_email     TEXT,
    last_synced_at   TIMESTAMPTZ,
    last_sync_error  TEXT
);

ALTER TABLE resend_webhook_subscription ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE resend_webhook_subscription IS 'Singleton (id=default): Resend webhook id, endpoint, signing secret, and inbound allow-list email.';
