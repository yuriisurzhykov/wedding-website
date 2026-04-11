import type {RsvpRow} from "@entities/rsvp";

import type {EmailTemplatePlaceholderKey} from "@entities/email-template";

/**
 * Maps an RSVP row to placeholder values for email templates.
 */
export function buildRsvpPlaceholderVars(
    row: RsvpRow,
): Record<EmailTemplatePlaceholderKey, string> {
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
