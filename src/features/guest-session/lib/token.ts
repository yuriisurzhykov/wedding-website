import "server-only";

import {createHash, randomBytes} from "node:crypto";

/** Byte length for opaque session tokens (before encoding). */
const OPAQUE_TOKEN_BYTES = 32;

/**
 * Generates a cryptographically random opaque token for cookies (base64url, no padding).
 * The raw value is never stored; only {@link hashSessionToken} is persisted.
 */
export function generateOpaqueToken(): string {
    return base64UrlEncode(randomBytes(OPAQUE_TOKEN_BYTES));
}

/**
 * SHA-256 hex digest of the opaque token for storage in `guest_sessions.token_hash`.
 */
export function hashSessionToken(rawToken: string): string {
    return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

function base64UrlEncode(buf: Buffer): string {
    return buf
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}
