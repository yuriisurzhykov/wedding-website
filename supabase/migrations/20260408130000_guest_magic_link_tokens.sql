-- Magic link: opaque tokens (hash only), separate from guest_sessions cookie tokens.
-- Claim flow validates hash, checks expiry and one-time use, then creates guest_sessions.
-- Access from API via service role; no anon policies (see schema.sql).

CREATE TABLE guest_magic_link_tokens
(
    id           UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    rsvp_id      UUID        NOT NULL REFERENCES rsvp (id) ON DELETE CASCADE,
    token_hash   TEXT        NOT NULL,
    expires_at   TIMESTAMPTZ NOT NULL,
    used_at      TIMESTAMPTZ,
    created_at   TIMESTAMPTZ          DEFAULT now()
);

ALTER TABLE guest_magic_link_tokens ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX guest_magic_link_tokens_token_hash_key ON guest_magic_link_tokens (token_hash);
CREATE INDEX idx_guest_magic_link_tokens_rsvp_id ON guest_magic_link_tokens (rsvp_id);
CREATE INDEX idx_guest_magic_link_tokens_expires_at ON guest_magic_link_tokens (expires_at);
