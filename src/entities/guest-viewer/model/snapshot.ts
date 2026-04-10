/**
 * **Guest viewer** — what the web app may know about an authenticated guest after session validation.
 *
 * - Built only from persisted RSVP + safe display transforms (no raw session token, no secrets).
 * - **`attending`** and any future fields are the contract for **client-side gating hints**; server routes must still enforce the same rules.
 *
 * @see `@features/guest-session` — HTTP cookie + JSON uses {@link GuestSessionClientSnapshot} (alias of this type).
 */
export type GuestViewerSnapshot = {
    displayName: string;
    /** Optional masked email for UI subtitle / confirmation. */
    emailMasked?: string;
    /**
     * RSVP `attending` — used for product policies (e.g. gallery / wishes visibility).
     * Server APIs must not rely on the client copy alone.
     */
    attending: boolean;
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
 * Builds the public guest viewer snapshot from RSVP identity fields (no token).
 */
export function buildGuestViewerSnapshot(input: {
    name: string;
    email?: string | null;
    attending: boolean;
}): GuestViewerSnapshot {
    const displayName = input.name.trim();
    const em = input.email?.trim();
    return {
        displayName,
        attending: input.attending,
        ...(em ? {emailMasked: maskEmailForDisplay(em)} : {}),
    };
}
