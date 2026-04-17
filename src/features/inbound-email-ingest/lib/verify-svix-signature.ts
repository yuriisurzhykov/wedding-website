import "server-only";

import {createHmac, timingSafeEqual} from "node:crypto";

const SVIX_TOLERANCE_SEC = 300;

function unwrapSvixSecret(secret: string): Buffer {
    const t = secret.trim();
    if (t.startsWith("whsec_")) {
        return Buffer.from(t.slice("whsec_".length), "base64");
    }
    return Buffer.from(t, "utf8");
}

function parseSignatureHeader(header: string): string[] {
    return header
        .split(/\s+/)
        .map((p) => p.trim())
        .filter(Boolean);
}

/**
 * Verifies an Svix-signed webhook body (Resend inbound webhooks use Svix).
 *
 * @param rawBody — Exact request body string (do not re-stringify JSON).
 * @param secret — Signing secret (`whsec_…` or raw); from DB preferred, env fallback for first boot.
 */
export function verifySvixSignature(input: {
    rawBody: string;
    svixId: string;
    svixTimestamp: string;
    svixSignature: string;
    secret: string;
}): boolean {
    const secretBytes = unwrapSvixSecret(input.secret);
    const signedContent = `${input.svixId}.${input.svixTimestamp}.${input.rawBody}`;

    const ts = Number(input.svixTimestamp);
    if (!Number.isFinite(ts)) {
        return false;
    }
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - ts) > SVIX_TOLERANCE_SEC) {
        return false;
    }

    const expected = createHmac("sha256", secretBytes)
        .update(signedContent)
        .digest("base64");

    const parts = parseSignatureHeader(input.svixSignature);
    for (const part of parts) {
        const [version, sigB64] = part.split(",", 2);
        if (version !== "v1" || !sigB64) {
            continue;
        }
        let sigBuf: Buffer;
        try {
            sigBuf = Buffer.from(sigB64, "base64");
        } catch {
            continue;
        }
        const expBuf = Buffer.from(expected, "base64");
        if (sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf)) {
            return true;
        }
    }

    return false;
}

/**
 * Reads Svix headers from an incoming webhook request (case-insensitive names).
 */
export function readSvixHeaders(headers: Headers): {
    id: string;
    timestamp: string;
    signature: string;
} | null {
    const pick = (name: string): string | null => {
        const direct = headers.get(name);
        if (direct) {
            return direct;
        }
        const lower = name.toLowerCase();
        for (const [k, v] of headers.entries()) {
            if (k.toLowerCase() === lower) {
                return v;
            }
        }
        return null;
    };

    const id = pick("svix-id");
    const timestamp = pick("svix-timestamp");
    const signature = pick("svix-signature");
    if (!id || !timestamp || !signature) {
        return null;
    }
    return {id, timestamp, signature};
}
