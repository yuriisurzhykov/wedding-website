/**
 * Safe JSON snapshot for the client after session establishment (plan §4).
 * Never includes the raw session token.
 */
export type GuestSessionClientSnapshot = {
    displayName: string;
    /** Optional masked email for UI subtitle / confirmation. */
    emailMasked?: string;
};

/**
 * Masks an email for display (e.g. `j***@example.com`). Returns a short placeholder if parsing fails.
 */
export function maskEmailForDisplay(email: string): string {
    const trimmed = email.trim();
    const at = trimmed.indexOf("@");
    if (at <= 0 || at === trimmed.length - 1) {
        return "***";
    }
    const local = trimmed.slice(0, at);
    const domain = trimmed.slice(at + 1);
    if (local.length <= 1) {
        return `*@${domain}`;
    }
    return `${local[0]}***@${domain}`;
}

/**
 * Builds the `session` object from RSVP identity fields (no token).
 */
export function buildGuestSessionClientSnapshot(input: {
    name: string;
    email?: string | null;
}): GuestSessionClientSnapshot {
    const displayName = input.name.trim();
    const em = input.email?.trim();
    return {
        displayName,
        ...(em ? {emailMasked: maskEmailForDisplay(em)} : {}),
    };
}
