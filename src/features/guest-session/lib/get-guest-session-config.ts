import "server-only";

const DEFAULT_COOKIE_NAME = "guest_session";
/** Default session lifetime: 90 days (server-managed `expires_at` in DB). */
const DEFAULT_MAX_AGE_SEC = 60 * 60 * 24 * 90;

export type GuestSessionRuntimeConfig = {
    /** Cookie name for the opaque session token. */
    cookieName: string;
    /** `Max-Age` / cookie lifetime in seconds (aligned with DB `expires_at`). */
    maxAgeSec: number;
    /** `Secure` flag: true in production unless overridden. */
    secure: boolean;
    /** `SameSite` attribute. */
    sameSite: "lax" | "strict" | "none";
};

function parsePositiveInt(raw: string | undefined, fallback: number): number {
    if (raw === undefined || raw === "") {
        return fallback;
    }
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * Reads optional env (`GUEST_SESSION_COOKIE_NAME`, `GUEST_SESSION_MAX_AGE_SEC`) with safe defaults.
 * `secure` is false on local HTTP (typical dev); true when `NODE_ENV === "production"`.
 */
export function getGuestSessionRuntimeConfig(): GuestSessionRuntimeConfig {
    const cookieName =
        process.env.GUEST_SESSION_COOKIE_NAME?.trim() || DEFAULT_COOKIE_NAME;
    const maxAgeSec = parsePositiveInt(
        process.env.GUEST_SESSION_MAX_AGE_SEC,
        DEFAULT_MAX_AGE_SEC,
    );
    const secure =
        process.env.GUEST_SESSION_COOKIE_SECURE !== undefined
            ? process.env.GUEST_SESSION_COOKIE_SECURE === "1" ||
            process.env.GUEST_SESSION_COOKIE_SECURE === "true"
            : process.env.NODE_ENV === "production";

    const sameSiteRaw = process.env.GUEST_SESSION_COOKIE_SAMESITE?.toLowerCase();
    const sameSite: GuestSessionRuntimeConfig["sameSite"] =
        sameSiteRaw === "strict" || sameSiteRaw === "none" || sameSiteRaw === "lax"
            ? sameSiteRaw
            : "lax";

    return {cookieName, maxAgeSec, secure, sameSite};
}

/**
 * Computes `expires_at` for a new row matching cookie `maxAgeSec`.
 */
export function guestSessionExpiresAtFromNow(
    config: Pick<GuestSessionRuntimeConfig, "maxAgeSec">,
): Date {
    return new Date(Date.now() + config.maxAgeSec * 1000);
}
