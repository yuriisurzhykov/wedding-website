/**
 * Display-name length cap aligned with RSVP `name` validation in `@features/rsvp-submit`
 * (Zod `.max(200)`). Kept private so callers use predicate helpers instead of importing the number.
 */
const maxDisplayNameChars = 200

export type PartyPrimaryInvariantIssue = 'no_primary' | 'multiple_primary'

/**
 * Returns `null` when exactly one member has `isPrimary === true`.
 */
export function checkPartyHasSinglePrimary(
    members: readonly {readonly isPrimary: boolean}[],
): PartyPrimaryInvariantIssue | null {
    const primaries = members.filter((m) => m.isPrimary).length
    if (primaries === 0) return 'no_primary'
    if (primaries > 1) return 'multiple_primary'
    return null
}

/**
 * Trims leading/trailing whitespace for stored `display_name`.
 */
export function normalizeGuestDisplayNameForStorage(value: string): string {
    return String(value ?? '').trim()
}

/**
 * Canonical form for **equality checks** of party names (duplicate-name guard in Zod `refine`).
 * Trims and applies Unicode case-folding via `toLocaleLowerCase` with default locale.
 */
export function normalizeGuestDisplayNameForPartyUniqueness(value: string): string {
    return normalizeGuestDisplayNameForStorage(value).toLocaleLowerCase()
}

/**
 * Whether two display names collide under {@link normalizeGuestDisplayNameForPartyUniqueness}.
 */
export function guestDisplayNamesCollideInParty(a: string, b: string): boolean {
    return (
        normalizeGuestDisplayNameForPartyUniqueness(a) ===
        normalizeGuestDisplayNameForPartyUniqueness(b)
    )
}

/**
 * True when the trimmed length is within the stored column policy (matches RSVP name cap).
 */
export function isGuestDisplayNameWithinStoredLimit(value: string): boolean {
    return normalizeGuestDisplayNameForStorage(value).length <= maxDisplayNameChars
}

/**
 * Normalizes optional companion email for `guest_accounts.email`: trim, empty → `null`,
 * otherwise lowercases for stable storage (Postgres unique index uses `lower(trim(email))`).
 */
export function normalizeGuestAccountEmailForStorage(
    value: string | null | undefined,
): string | null {
    if (value === undefined || value === null) return null
    const s = String(value).trim()
    if (s === '') return null
    return s.toLowerCase()
}
