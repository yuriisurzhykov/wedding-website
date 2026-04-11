import "server-only";

import {
    readAdminSessionTokenFromCookieHeader,
    verifyAdminSessionJwt,
} from "./admin-session-jwt";

/** Value after "Bearer " (case-insensitive), trimmed. */
function parseBearerToken(auth: string | null): string {
    if (!auth) {
        return "";
    }
    const t = auth.trim();
    if (!/^Bearer\s+/i.test(t)) {
        return "";
    }
    return t.replace(/^Bearer\s+/i, "").trim();
}

/**
 * Legacy script/API access: same token as historical `ADMIN_SECRET` middleware check.
 */
export function isLegacyAdminSecretAuthorized(request: Request): boolean {
    const expected = process.env.ADMIN_SECRET?.trim() ?? "";
    if (!expected) {
        return false;
    }
    const bearer = parseBearerToken(request.headers.get("authorization"));
    if (bearer === expected) {
        return true;
    }
    const header = request.headers.get("x-admin-token")?.trim();
    if (header === expected) {
        return true;
    }
    return false;
}

/**
 * Password-login session: valid HS256 cookie issued by `POST /api/admin/login`.
 */
export async function isAdminSessionCookieAuthorized(
    request: Request,
): Promise<boolean> {
    const raw = readAdminSessionTokenFromCookieHeader(
        request.headers.get("cookie"),
    );
    if (!raw) {
        return false;
    }
    return verifyAdminSessionJwt(raw);
}

/**
 * `true` when the caller may invoke `/api/admin/*` business logic (session cookie or legacy secret header).
 */
export async function isAdminApiAuthorized(request: Request): Promise<boolean> {
    if (isLegacyAdminSecretAuthorized(request)) {
        return true;
    }
    return isAdminSessionCookieAuthorized(request);
}
