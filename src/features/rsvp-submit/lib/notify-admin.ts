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
 * **Required after a successful save:** Missing `RESEND_API_KEY` or `ADMIN_EMAIL`, or a Resend API error,
 * throws so the caller can fail the request before any guest confirmation is sent.
 *
 * @param row — Payload that was persisted (same shape as DB row minus id/timestamps).
 * @param id — Row UUID from Supabase after insert or update.
 * @see {@link buildAdminRsvpEmail} for the `{ subject, html, text }` contract.
 */
export async function notifyAdminOfNewRsvp(
    row: RsvpRowInsert,
    id: string,
): Promise<void> {
    const apiKey = getResendApiKey();
    const to = getAdminEmailForNotifications();
    if (!apiKey || !to) {
        throw new Error(
            "Cannot notify admin: RESEND_API_KEY or ADMIN_EMAIL is not configured",
        );
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
