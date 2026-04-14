import type {AdminGuestListRow} from "../model/admin-guest-list-row";

export type GuestAccountAdminJoinRsvpFields = Readonly<{
    attending: unknown;
    email: unknown;
    phone: unknown;
    guest_count: unknown;
    dietary: unknown;
    message: unknown;
    created_at: unknown;
}>;

export type GuestAccountAdminJoinRow = Readonly<{
    id: unknown;
    display_name: unknown;
    is_primary: unknown;
    sort_order: unknown;
    email: unknown;
    rsvp: GuestAccountAdminJoinRsvpFields | GuestAccountAdminJoinRsvpFields[];
}>;

function unwrapRsvp(
    rsvp: GuestAccountAdminJoinRow["rsvp"],
): GuestAccountAdminJoinRsvpFields | null {
    const r = Array.isArray(rsvp) ? rsvp[0] : rsvp;
    return r ?? null;
}

function asPartyGuestCount(value: unknown): number {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    return 1;
}

/**
 * Maps one PostgREST `guest_accounts` row with embedded `rsvp` to {@link AdminGuestListRow}.
 * Returns `null` when required fields are missing or malformed.
 */
export function mapGuestAccountJoinToAdminRow(
    row: GuestAccountAdminJoinRow,
): AdminGuestListRow | null {
    const rsvp = unwrapRsvp(row.rsvp);
    if (!rsvp) {
        return null;
    }

    if (typeof row.id !== "string" || !row.id) {
        return null;
    }
    if (typeof row.display_name !== "string") {
        return null;
    }
    if (typeof row.is_primary !== "boolean") {
        return null;
    }
    if (typeof row.sort_order !== "number" || !Number.isFinite(row.sort_order)) {
        return null;
    }
    if (row.email !== null && typeof row.email !== "string") {
        return null;
    }
    if (typeof rsvp.attending !== "boolean") {
        return null;
    }
    if (typeof rsvp.created_at !== "string" || !rsvp.created_at) {
        return null;
    }

    const partyEmail =
        rsvp.email === null || rsvp.email === undefined
            ? null
            : typeof rsvp.email === "string"
              ? rsvp.email.trim() || null
              : null;

    const accountEmail =
        row.email === null || row.email === undefined
            ? null
            : typeof row.email === "string"
              ? row.email.trim() || null
              : null;

    const contactEmail = row.is_primary
        ? partyEmail
        : (accountEmail ?? partyEmail);

    const phone =
        rsvp.phone === null || rsvp.phone === undefined
            ? null
            : typeof rsvp.phone === "string"
              ? rsvp.phone
              : null;

    const dietary =
        rsvp.dietary === null || rsvp.dietary === undefined
            ? null
            : typeof rsvp.dietary === "string"
              ? rsvp.dietary
              : null;

    const message =
        rsvp.message === null || rsvp.message === undefined
            ? null
            : typeof rsvp.message === "string"
              ? rsvp.message
              : null;

    return {
        guestAccountId: row.id,
        displayName: row.display_name.trim(),
        isPrimary: row.is_primary,
        sortOrder: row.sort_order,
        attending: rsvp.attending,
        partyGuestCount: asPartyGuestCount(rsvp.guest_count),
        phone,
        dietary,
        message,
        contactEmail,
        submittedAt: rsvp.created_at,
    };
}
