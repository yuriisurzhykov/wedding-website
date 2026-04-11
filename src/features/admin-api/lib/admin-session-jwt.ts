import {SignJWT, jwtVerify} from "jose";

import {ADMIN_SESSION_COOKIE_NAME} from "./constants";

export {ADMIN_SESSION_COOKIE_NAME};

const ALG = "HS256";

function getSessionSecretBytes(): Uint8Array | null {
    const s = process.env.ADMIN_SESSION_SECRET?.trim();
    if (!s) {
        return null;
    }
    return new TextEncoder().encode(s);
}

/**
 * Verifies the HS256 admin session JWT. Safe to call from Edge middleware (no Node-only deps).
 *
 * @returns whether the token is valid for this deployment.
 */
export async function verifyAdminSessionJwt(token: string): Promise<boolean> {
    const secret = getSessionSecretBytes();
    if (!secret) {
        return false;
    }
    try {
        const {payload} = await jwtVerify(token, secret, {algorithms: [ALG]});
        return payload.sub === "admin";
    } catch {
        return false;
    }
}

/**
 * Issues a new admin session JWT (Node route handlers only — requires bcrypt elsewhere for login).
 */
export async function signAdminSessionJwt(): Promise<string> {
    const secret = getSessionSecretBytes();
    if (!secret) {
        throw new Error("ADMIN_SESSION_SECRET is not configured");
    }
    return new SignJWT({role: "admin"})
        .setProtectedHeader({alg: ALG})
        .setIssuedAt()
        .setExpirationTime("7d")
        .setSubject("admin")
        .sign(secret);
}

/**
 * Parses `Cookie` header and returns the admin session JWT string, if present.
 */
export function readAdminSessionTokenFromCookieHeader(
    cookieHeader: string | null,
): string | null {
    if (!cookieHeader) {
        return null;
    }
    for (const part of cookieHeader.split(";")) {
        const idx = part.indexOf("=");
        if (idx === -1) {
            continue;
        }
        const name = part.slice(0, idx).trim();
        if (name !== ADMIN_SESSION_COOKIE_NAME) {
            continue;
        }
        const value = part.slice(idx + 1).trim();
        if (value) {
            try {
                return decodeURIComponent(value);
            } catch {
                return value;
            }
        }
    }
    return null;
}
