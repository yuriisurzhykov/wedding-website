import "server-only";

import type {RsvpRowInsert} from "@entities/rsvp";
import {
    createResendClient,
    getAdminEmailForNotifications,
    getResendApiKey,
    getTransactionalFromAddress,
} from "@shared/api/resend";

import {buildAdminRsvpEmail} from "./email/build-admin-rsvp-email";

/**
 * Sends a multipart (HTML + plain text) transactional email to the admin inbox with the stored RSVP row.
 *
 * **Non-fatal:** Missing `RESEND_API_KEY` or `ADMIN_EMAIL` logs a warning and returns without throwing.
 * Resend API errors are thrown so callers can log them.
 *
 * @param row — Insert payload that was persisted (same shape as DB row minus id/timestamps).
 * @param id — New row UUID from Supabase.
 * @see {@link buildAdminRsvpEmail} for the `{ subject, html, text }` contract.
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
    const {subject, html, text} = buildAdminRsvpEmail(row, id);
    const resend = createResendClient(apiKey);
    const {error} = await resend.emails.send({
        from,
        to: [to],
        subject,
        html,
        text,
    });

    if (error) {
        throw new Error(`Resend: ${error.message}`);
    }
}
