import "server-only";

import {GUEST_RSVP_CONFIRMATION_PLACEHOLDER_KEYS} from "@entities/email-template";
import type {RsvpRowInsert} from "@entities/rsvp";
import {sendTransactionalEmailFromSlug} from "@features/admin-email-dispatch";
import {createResendClient, getResendApiKey, getTransactionalFromAddress} from "@shared/api/resend";
import {getPublicSiteUrl} from "@shared/lib/get-public-site-url";

import {buildGuestConfirmationEmail} from "./email/build-guest-confirmation-email";
import {buildGuestRsvpConfirmationTemplateVars} from "./email/build-guest-rsvp-confirmation-template-vars";
import type {GuestEmailLocale} from "./email/guest-confirmation-copy";

const GUEST_RSVP_CONFIRMATION_SLUG: Record<GuestEmailLocale, string> = {
    en: "guest-rsvp-confirmation-en",
    ru: "guest-rsvp-confirmation-ru",
};

function guestConfirmationTemplateSlug(locale: GuestEmailLocale): string {
    return GUEST_RSVP_CONFIRMATION_SLUG[locale];
}

async function sendGuestConfirmationWithFallbackResend(
    to: string,
    row: RsvpRowInsert,
    locale: GuestEmailLocale,
    siteUrl: string | undefined,
    magicLinkClaimUrl?: string,
): Promise<void> {
    const apiKey = getResendApiKey();
    if (!apiKey) {
        throw new Error(
            "Cannot send guest confirmation: RESEND_API_KEY is not configured",
        );
    }

    const from = getTransactionalFromAddress();
    const {subject, html, text} = buildGuestConfirmationEmail(
        row,
        locale,
        siteUrl,
        magicLinkClaimUrl,
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
 * Loads the locale-specific transactional template (`guest-rsvp-confirmation-en` / `guest-rsvp-confirmation-ru`)
 * and sends via {@link sendTransactionalEmailFromSlug}. If that row is missing, falls back to {@link buildGuestConfirmationEmail}.
 *
 * If `row.email` is missing or blank, returns without sending (no-op).
 * When an email address is present, missing `RESEND_API_KEY` or a Resend failure **throws** after the admin
 * mail has already succeeded, so the caller can report a partial failure without implying the guest mail sent.
 *
 * @param row — Persisted insert; `email` must be non-empty to send.
 * @param locale — Selects template slug and copy for placeholders / fallback.
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

    const siteUrl = emailLinks?.publicSiteUrl ?? getPublicSiteUrl();
    const magicLinkClaimUrl = emailLinks?.magicLinkClaimUrl;
    const slug = guestConfirmationTemplateSlug(locale);
    const vars = buildGuestRsvpConfirmationTemplateVars(
        row,
        locale,
        siteUrl,
        magicLinkClaimUrl,
    );

    const transactional = await sendTransactionalEmailFromSlug({
        slug,
        to,
        vars,
        segment: "transactional:guest-rsvp",
        placeholderAllowlist: GUEST_RSVP_CONFIRMATION_PLACEHOLDER_KEYS,
    });

    if (transactional.ok) {
        return;
    }

    if (transactional.kind === "not_found") {
        console.warn(
            "[rsvp-submit] Guest confirmation template missing; using code fallback.",
            {slug},
        );
        await sendGuestConfirmationWithFallbackResend(
            to,
            row,
            locale,
            siteUrl,
            magicLinkClaimUrl,
        );
        return;
    }

    if (transactional.kind === "resend_unconfigured") {
        throw new Error(
            "Cannot send guest confirmation: RESEND_API_KEY is not configured",
        );
    }

    if (transactional.kind === "resend") {
        throw new Error(
            transactional.message
                ? `Resend: ${transactional.message}`
                : "Resend: transactional guest confirmation send failed",
        );
    }

    const detail = transactional.message ?? transactional.kind;
    throw new Error(`Cannot send guest confirmation: ${detail}`);
}
