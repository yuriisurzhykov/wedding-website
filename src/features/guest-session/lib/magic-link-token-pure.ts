/**
 * Pure helpers for magic-link **eligibility** (no I/O). Used by {@link claimMagicLink}.
 */

/** Columns needed to decide if a stored magic-link row can still be claimed. */
export type MagicLinkEligibilityInput = {
    expires_at: string;
    used_at: string | null;
};

/** Outcome of {@link getMagicLinkClaimEligibility}. */
export type MagicLinkClaimEligibility = "usable" | "used" | "expired";

/**
 * Trims the raw query value; returns `null` if empty (invalid for lookup).
 */
export function trimMagicLinkTokenInput(raw: string): string | null {
    const t = raw.trim();
    return t.length > 0 ? t : null;
}

/**
 * Decides whether a magic-link row may be consumed at `nowMs`.
 *
 * - **`used`** — `used_at` is set.
 * - **`expired`** — `expires_at` is missing, invalid, or not after `nowMs`.
 * - **`usable`** — otherwise.
 */
export function getMagicLinkClaimEligibility(
    row: MagicLinkEligibilityInput,
    nowMs: number,
): MagicLinkClaimEligibility {
    if (row.used_at) {
        return "used";
    }
    const expires = new Date(row.expires_at).getTime();
    if (!Number.isFinite(expires) || expires <= nowMs) {
        return "expired";
    }
    return "usable";
}
