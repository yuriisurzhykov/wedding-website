-- Wedding site schema — run once in Supabase SQL Editor (ARCHITECTURE.md §7).

-- =============================================
-- Guest RSVPs
-- =============================================
CREATE TABLE rsvp
(
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT    NOT NULL,
    email       TEXT,
    phone       TEXT,
    attending   BOOLEAN NOT NULL,
    guest_count INT              DEFAULT 1,
    dietary     TEXT,
    message     TEXT,
    created_at  TIMESTAMPTZ      DEFAULT now()
);

-- =============================================
-- Photos
-- =============================================
CREATE TABLE photos
(
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    r2_key        TEXT NOT NULL UNIQUE,
    uploader_name TEXT,
    public_url    TEXT NOT NULL,
    size_bytes    INT,
    rsvp_id       UUID REFERENCES rsvp (id) ON DELETE SET NULL,
    uploaded_at   TIMESTAMPTZ      DEFAULT now()
);

-- =============================================
-- Wishes
-- =============================================
CREATE TABLE wishes
(
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_name  TEXT NOT NULL,
    message      TEXT NOT NULL,
    photo_r2_key TEXT,
    photo_url    TEXT,
    created_at   TIMESTAMPTZ      DEFAULT now()
);

-- =============================================
-- Guest sessions (opaque token hash; API via service role)
-- =============================================
CREATE TABLE guest_sessions
(
    id            UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    rsvp_id       UUID        NOT NULL REFERENCES rsvp (id) ON DELETE CASCADE,
    token_hash    TEXT        NOT NULL,
    expires_at    TIMESTAMPTZ NOT NULL,
    created_at    TIMESTAMPTZ          DEFAULT now(),
    last_seen_at  TIMESTAMPTZ
);

-- =============================================
-- Magic link tokens (opaque hash; one-time via used_at; not session cookies)
-- =============================================
CREATE TABLE guest_magic_link_tokens
(
    id           UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    rsvp_id      UUID        NOT NULL REFERENCES rsvp (id) ON DELETE CASCADE,
    token_hash   TEXT        NOT NULL,
    expires_at   TIMESTAMPTZ NOT NULL,
    used_at      TIMESTAMPTZ,
    created_at   TIMESTAMPTZ          DEFAULT now()
);

-- =============================================
-- Row Level Security
-- =============================================
ALTER TABLE rsvp ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_magic_link_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "photos_public_read"
  ON photos FOR SELECT USING (true);

CREATE POLICY "wishes_public_read"
  ON wishes FOR SELECT USING (true);

-- Writes: only via service_role in API Routes (no INSERT policies for anon).

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX idx_photos_uploaded_at ON photos (uploaded_at DESC);
CREATE INDEX idx_photos_rsvp_id ON photos (rsvp_id) WHERE rsvp_id IS NOT NULL;
CREATE INDEX idx_wishes_created_at ON wishes (created_at DESC);
CREATE INDEX idx_rsvp_created_at ON rsvp (created_at DESC);
CREATE INDEX idx_rsvp_attending ON rsvp (attending);

-- One RSVP row per guest contact (NULLs allowed multiple times).
CREATE UNIQUE INDEX rsvp_email_unique ON rsvp (email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX rsvp_phone_unique ON rsvp (phone) WHERE phone IS NOT NULL;

CREATE UNIQUE INDEX guest_sessions_token_hash_key ON guest_sessions (token_hash);
CREATE INDEX idx_guest_sessions_rsvp_id ON guest_sessions (rsvp_id);
CREATE INDEX idx_guest_sessions_expires_at ON guest_sessions (expires_at);

CREATE UNIQUE INDEX guest_magic_link_tokens_token_hash_key ON guest_magic_link_tokens (token_hash);
CREATE INDEX idx_guest_magic_link_tokens_rsvp_id ON guest_magic_link_tokens (rsvp_id);
CREATE INDEX idx_guest_magic_link_tokens_expires_at ON guest_magic_link_tokens (expires_at);

-- =============================================
-- Guest session restore rate limit (fixed window; RPC only, service_role)
-- =============================================
CREATE TABLE guest_session_restore_rate
(
    bucket_key    TEXT PRIMARY KEY,
    window_start  TIMESTAMPTZ NOT NULL,
    attempt_count INT NOT NULL CHECK (attempt_count >= 0)
);

ALTER TABLE guest_session_restore_rate ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION guest_session_check_restore_rate(
    p_bucket_key text,
    p_max_attempts int,
    p_window_seconds int
)
RETURNS json
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_now timestamptz := clock_timestamp();
    v_window_end timestamptz;
    v_count int;
    v_start timestamptz;
BEGIN
    IF p_max_attempts < 1 OR p_window_seconds < 1 THEN
        RETURN json_build_object('allowed', true, 'retry_after_sec', 0);
    END IF;

    PERFORM pg_advisory_xact_lock(hashtext(p_bucket_key)::bigint);

    SELECT window_start, attempt_count INTO v_start, v_count
    FROM guest_session_restore_rate
    WHERE bucket_key = p_bucket_key;

    IF NOT FOUND THEN
        INSERT INTO guest_session_restore_rate (bucket_key, window_start, attempt_count)
        VALUES (p_bucket_key, v_now, 1);
        RETURN json_build_object('allowed', true, 'retry_after_sec', 0);
    END IF;

    v_window_end := v_start + make_interval(secs => p_window_seconds);

    IF v_now >= v_window_end THEN
        UPDATE guest_session_restore_rate
        SET window_start = v_now, attempt_count = 1
        WHERE bucket_key = p_bucket_key;
        RETURN json_build_object('allowed', true, 'retry_after_sec', 0);
    END IF;

    IF v_count >= p_max_attempts THEN
        RETURN json_build_object(
            'allowed', false,
            'retry_after_sec',
            GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_window_end - v_now)))::int)
        );
    END IF;

    UPDATE guest_session_restore_rate
    SET attempt_count = attempt_count + 1
    WHERE bucket_key = p_bucket_key;

    RETURN json_build_object('allowed', true, 'retry_after_sec', 0);
END;
$$;

REVOKE ALL ON FUNCTION guest_session_check_restore_rate(text, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION guest_session_check_restore_rate(text, int, int) TO service_role;
