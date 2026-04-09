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

/** Absolute URLs embedded in the guest confirmation email (both optional). */
export type GuestConfirmationEmailLinks = {
    /** Origin for the primary “open site” CTA; defaults to {@link getPublicSiteUrl} when omitted. */
    publicSiteUrl?: string;
    /** Full `GET /api/guest/claim?token=…&locale=…` URL when the token and site base were available at RSVP time. */
    magicLinkClaimUrl?: string;
};

/**
 * Sends a multipart thank-you email to the guest after their RSVP is stored.
 *
 * If `row.email` is missing or blank, returns without sending (no-op).
 * When an email address is present, missing `RESEND_API_KEY` or a Resend failure **throws** after the admin
 * mail has already succeeded, so the caller can report a partial failure without implying the guest mail sent.
 *
 * @param row — Persisted insert; `email` must be non-empty to send.
 * @param locale — Drives copy from {@link buildGuestConfirmationEmail} / `guest-confirmation-copy`.
 * @param emailLinks — Optional; pass the same `publicSiteUrl` used to build `magicLinkClaimUrl` so both CTAs appear together after RSVP.
 */
export async function notifyGuestRsvpConfirmation(
    row: RsvpRowInsert,
    locale: GuestEmailLocale,
    emailLinks?: GuestConfirmationEmailLinks,
): Promise<void> {
    const to = row.email?.trim();
    if (!to) {
        return;
    }

    const apiKey = getResendApiKey();
    if (!apiKey) {
        throw new Error(
            "Cannot send guest confirmation: RESEND_API_KEY is not configured",
        );
    }

    const from = getTransactionalFromAddress();
    const siteUrl = emailLinks?.publicSiteUrl ?? getPublicSiteUrl();
    const {subject, html, text} = buildGuestConfirmationEmail(
        row,
        locale,
        siteUrl,
        emailLinks?.magicLinkClaimUrl,
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
