import "server-only";

import type {RsvpRowInsert} from "@entities/rsvp";
import {
    createResendClient,
    getResendApiKey,
    getTransactionalFromAddress,
} from "@shared/api/resend";
import {getPublicSiteUrl} from "@shared/lib/get-public-site-url";

import {buildGuestConfirmationEmail} from "./email/build-guest-confirmation-email";
import type {GuestEmailLocale} from "./email/guest-confirmation-copy";

/**
 * Sends a multipart thank-you email to the guest after their RSVP is stored.
 *
 * **Non-fatal:** If `row.email` is missing or blank, returns without logging.
 * Missing `RESEND_API_KEY` logs a warning and returns. Resend errors propagate for callers to `.catch()`.
 *
 * @param row — Persisted insert; `email` must be non-empty to send.
 * @param locale — Drives copy from {@link buildGuestConfirmationEmail} / `guest-confirmation-copy`.
 */
export async function notifyGuestRsvpConfirmation(
    row: RsvpRowInsert,
    locale: GuestEmailLocale,
): Promise<void> {
    const to = row.email?.trim();
    if (!to) {
        return;
    }

    const apiKey = getResendApiKey();
    if (!apiKey) {
        console.warn(
            "[rsvp-submit] Skipping guest confirmation email: RESEND_API_KEY is not set",
        );
        return;
    }

    const from = getTransactionalFromAddress();
    const siteUrl = getPublicSiteUrl();
    const {subject, html, text} = buildGuestConfirmationEmail(
        row,
        locale,
        siteUrl,
    );
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
