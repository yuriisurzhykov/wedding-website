/**
 * Pure helpers for magic-link **eligibility** (no I/O). Used by {@link claimMagicLink}.
 */

/** Columns needed to decide if a stored magic-link row can still be used for session restore. */
export type MagicLinkEligibilityInput = {
    expires_at: string;
};

/** Outcome of {@link getMagicLinkClaimEligibility}. */
export type MagicLinkClaimEligibility = "usable" | "expired";

/**
 * Trims the raw query value; returns `null` if empty (invalid for lookup).
 */
export function trimMagicLinkTokenInput(raw: string): string | null {
    const t = raw.trim();
    return t.length > 0 ? t : null;
}

/**
 * Decides whether a magic-link row may open a guest session at `nowMs`.
 *
 * Tokens are **reusable** until `expires_at` (session restore semantics, not one-time consumption).
 *
 * - **`expired`** — `expires_at` is missing, invalid, or not after `nowMs`.
 * - **`usable`** — otherwise.
 */
export function getMagicLinkClaimEligibility(
    row: MagicLinkEligibilityInput,
    nowMs: number,
): MagicLinkClaimEligibility {
    const expires = new Date(row.expires_at).getTime();
    if (!Number.isFinite(expires) || expires <= nowMs) {
        return "expired";
    }
    return "usable";
}
