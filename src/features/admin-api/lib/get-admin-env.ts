import "server-only";

function parsePositiveInt(raw: string | undefined, fallback: number): number {
    if (raw === undefined || raw === "") {
        return fallback;
    }
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
}

export type AdminRateLimitKind = "login" | "api";

export type AdminRateLimitThresholds = {
    maxAttempts: number;
    windowSec: number;
};

const LOGIN_DEFAULT_WINDOW_SEC = 60 * 15;
const LOGIN_DEFAULT_MAX = 10;
const API_DEFAULT_WINDOW_SEC = 60;
const API_DEFAULT_MAX = 300;

/**
 * Thresholds for Postgres `admin_check_rate_limit`: stricter for `login`, higher for other `/api/admin/*` calls.
 */
export function getAdminRateLimitThresholds(
    kind: AdminRateLimitKind,
): AdminRateLimitThresholds {
    if (kind === "login") {
        return {
            windowSec: parsePositiveInt(
                process.env.ADMIN_RATE_LIMIT_LOGIN_WINDOW_SEC,
                LOGIN_DEFAULT_WINDOW_SEC,
            ),
            maxAttempts: parsePositiveInt(
                process.env.ADMIN_RATE_LIMIT_LOGIN_MAX,
                LOGIN_DEFAULT_MAX,
            ),
        };
    }
    return {
        windowSec: parsePositiveInt(
            process.env.ADMIN_RATE_LIMIT_API_WINDOW_SEC,
            API_DEFAULT_WINDOW_SEC,
        ),
        maxAttempts: parsePositiveInt(
            process.env.ADMIN_RATE_LIMIT_API_MAX,
            API_DEFAULT_MAX,
        ),
    };
}
