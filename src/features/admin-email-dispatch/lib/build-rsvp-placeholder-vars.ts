import type {RsvpRow} from "@entities/rsvp";

import type {RsvpPlaceholderKey} from "@entities/email-template";

/**
 * Maps an RSVP row to per-recipient placeholder values. Send-time globals (e.g. `site_url`)
 * are merged in by the caller; this builder only owns RSVP-derived keys.
 */
export function buildRsvpPlaceholderVars(
    row: RsvpRow,
): Record<RsvpPlaceholderKey, string> {
    return {
        name: row.name,
        email: row.email ?? "",
        phone: row.phone ?? "",
        guest_count: String(row.guest_count),
        dietary: row.dietary ?? "",
        message: row.message ?? "",
        attending: row.attending ? "yes" : "no",
    };
}
