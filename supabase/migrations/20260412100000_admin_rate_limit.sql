-- Fixed-window rate limiting for /api/admin (RPC only, service_role).
-- Thresholds are passed from the app (stricter for login, looser for other admin API calls).

CREATE TABLE admin_rate_limit
(
    bucket_key    TEXT PRIMARY KEY,
    window_start  TIMESTAMPTZ NOT NULL,
    attempt_count INT NOT NULL CHECK (attempt_count >= 0)
);

ALTER TABLE admin_rate_limit ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION admin_check_rate_limit(
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
    FROM admin_rate_limit
    WHERE bucket_key = p_bucket_key;

    IF NOT FOUND THEN
        INSERT INTO admin_rate_limit (bucket_key, window_start, attempt_count)
        VALUES (p_bucket_key, v_now, 1);
        RETURN json_build_object('allowed', true, 'retry_after_sec', 0);
    END IF;

    v_window_end := v_start + make_interval(secs => p_window_seconds);

    IF v_now >= v_window_end THEN
        UPDATE admin_rate_limit
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

    UPDATE admin_rate_limit
    SET attempt_count = attempt_count + 1
    WHERE bucket_key = p_bucket_key;

    RETURN json_build_object('allowed', true, 'retry_after_sec', 0);
END;
$$;

REVOKE ALL ON FUNCTION admin_check_rate_limit(text, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_check_rate_limit(text, int, int) TO service_role;
