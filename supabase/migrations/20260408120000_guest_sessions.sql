-- Guest sessions: opaque cookie token (hash only), bound to RSVP row.
-- Access from API via service role; no anon policies (see schema.sql).

CREATE TABLE guest_sessions
(
    id            UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    rsvp_id       UUID        NOT NULL REFERENCES rsvp (id) ON DELETE CASCADE,
    token_hash    TEXT        NOT NULL,
    expires_at    TIMESTAMPTZ NOT NULL,
    created_at    TIMESTAMPTZ          DEFAULT now(),
    last_seen_at  TIMESTAMPTZ
);

ALTER TABLE guest_sessions ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX guest_sessions_token_hash_key ON guest_sessions (token_hash);
CREATE INDEX idx_guest_sessions_rsvp_id ON guest_sessions (rsvp_id);
CREATE INDEX idx_guest_sessions_expires_at ON guest_sessions (expires_at);
