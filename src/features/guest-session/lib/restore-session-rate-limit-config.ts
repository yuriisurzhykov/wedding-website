import "server-only";

/**
 * Internal thresholds for restore rate limiting (plan §13). Tunable via env on the server only;
 * not part of the public `@features/guest-session` contract.
 */
const DEFAULT_WINDOW_SEC = 60 * 15;
const DEFAULT_MAX_ATTEMPTS = 10;

function parsePositiveInt(raw: string | undefined, fallback: number): number {
    if (raw === undefined || raw === "") {
        return fallback;
    }
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
}

export type GuestSessionRestoreRateLimitConfig = {
    windowSec: number;
    maxAttempts: number;
};

/**
 * Reads optional `GUEST_SESSION_RESTORE_RATE_WINDOW_SEC` and
 * `GUEST_SESSION_RESTORE_RATE_MAX_ATTEMPTS` (defaults: 15 minutes, 10 attempts per window per bucket).
 */
export function getGuestSessionRestoreRateLimitConfig(): GuestSessionRestoreRateLimitConfig {
    return {
        windowSec: parsePositiveInt(
            process.env.GUEST_SESSION_RESTORE_RATE_WINDOW_SEC,
            DEFAULT_WINDOW_SEC,
        ),
        maxAttempts: parsePositiveInt(
            process.env.GUEST_SESSION_RESTORE_RATE_MAX_ATTEMPTS,
            DEFAULT_MAX_ATTEMPTS,
        ),
    };
}
