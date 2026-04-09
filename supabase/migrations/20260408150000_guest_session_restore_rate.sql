-- Fixed-window rate limit for POST /api/guest/session (restore by credentials).
-- Access only via service_role RPC; no direct table access from anon.

CREATE TABLE guest_session_restore_rate
(
    bucket_key   TEXT PRIMARY KEY,
    window_start TIMESTAMPTZ NOT NULL,
    attempt_count INT NOT NULL CHECK (attempt_count >= 0)
);

ALTER TABLE guest_session_restore_rate ENABLE ROW LEVEL SECURITY;

-- Invoker rights (no SECURITY DEFINER): runs as calling role; service_role only via GRANT.
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
