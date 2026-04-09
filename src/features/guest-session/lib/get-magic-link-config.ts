import "server-only";

/** Default magic-link token lifetime (matches guest session default unless overridden). */
const DEFAULT_MAGIC_LINK_MAX_AGE_SEC = 60 * 60 * 24 * 90;

function parsePositiveInt(raw: string | undefined, fallback: number): number {
    if (raw === undefined || raw === "") {
        return fallback;
    }
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
}

export type MagicLinkRuntimeConfig = {
    /** TTL for `guest_magic_link_tokens.expires_at` (new rows). */
    maxAgeSec: number;
};

/**
 * Optional `GUEST_MAGIC_LINK_MAX_AGE_SEC` — not exported outside the guest-session server bundle.
 */
export function getMagicLinkRuntimeConfig(): MagicLinkRuntimeConfig {
    return {
        maxAgeSec: parsePositiveInt(
            process.env.GUEST_MAGIC_LINK_MAX_AGE_SEC,
            DEFAULT_MAGIC_LINK_MAX_AGE_SEC,
        ),
    };
}
