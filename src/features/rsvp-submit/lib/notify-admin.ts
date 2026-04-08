import "server-only";

import type {RsvpRowInsert} from "@entities/rsvp";
import {
    createResendClient,
    getAdminEmailForNotifications,
    getResendApiKey,
    getTransactionalFromAddress,
} from "@shared/api/resend";

function formatRsvpSummary(row: RsvpRowInsert, id: string): {text: string} {
    const lines = [
        `New RSVP (${id})`,
        `Name: ${row.name}`,
        `Attending: ${row.attending ? "yes" : "no"}`,
        `Guest count: ${row.guest_count}`,
        row.email ? `Email: ${row.email}` : null,
        row.phone ? `Phone: ${row.phone}` : null,
        row.dietary ? `Dietary: ${row.dietary}` : null,
        row.message ? `Message: ${row.message}` : null,
    ].filter(Boolean) as string[];
    return {text: lines.join("\n")};
}

/**
 * Sends a transactional email to the admin inbox with the stored RSVP row.
 *
 * **Non-fatal:** Missing `RESEND_API_KEY` or `ADMIN_EMAIL` logs a warning and returns without throwing.
 * Resend API errors are thrown so callers can log them.
 *
 * @param row — Insert payload that was persisted (same shape as DB row minus id/timestamps).
 * @param id — New row UUID from Supabase.
 */
export async function notifyAdminOfNewRsvp(
    row: RsvpRowInsert,
    id: string,
): Promise<void> {
    const apiKey = getResendApiKey();
    const to = getAdminEmailForNotifications();
    if (!apiKey || !to) {
        console.warn(
            "[rsvp-submit] Skipping admin email: RESEND_API_KEY or ADMIN_EMAIL is not set",
        );
        return;
    }

    const from = getTransactionalFromAddress();
    const {text} = formatRsvpSummary(row, id);
    const resend = createResendClient(apiKey);
    const {error} = await resend.emails.send({
        from,
        to: [to],
        subject: `RSVP: ${row.name} — ${row.attending ? "attending" : "not attending"}`,
        text,
    });

    if (error) {
        throw new Error(`Resend: ${error.message}`);
    }
}
