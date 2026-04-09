import type {RsvpRowInsert} from "@entities/rsvp";
import {VENUE} from '@entities/wedding-venue'
import {formatStoryWeddingLine} from '@shared/lib/wedding-calendar'
import {escapeHtml} from "@shared/lib/html-escape";

import {getGuestConfirmationCopy, guestConfirmationSubject, type GuestEmailLocale,} from "./guest-confirmation-copy";
import {buildGuestConfirmationMagicLinkEmailParts} from "./guest-confirmation-magic-link-email-parts";
import {normalizeOptionalHttpsUrl} from "./normalize-optional-https-url";
import {WEDDING_EMAIL_GOOGLE_FONTS_HREF, WEDDING_EMAIL_THEME as T,} from "./wedding-email-theme";

/** Parts passed to Resend `emails.send` for the guest thank-you after RSVP (multipart/alternative). */
export type GuestConfirmationEmailPayload = {
    subject: string;
    html: string;
    text: string;
};

function venueLines(locale: GuestEmailLocale): { title: string; lines: string[] } {
    const c = getGuestConfirmationCopy(locale);
    const ceremony = formatStoryWeddingLine(locale);
    const parts: string[] = [ceremony];
    const venueTitle = VENUE.name?.trim()
        ? `${VENUE.name.trim()} — ${VENUE.address}`
        : VENUE.address;
    if (venueTitle.trim()) {
        parts.push(venueTitle.trim());
    }
    return {title: `${c.ceremonyLabel} & ${c.venueLabel}`, lines: parts};
}

function optionalBlockText(
    label: string,
    value: string | null | undefined,
): string | null {
    const v = value?.trim();
    if (!v) return null;
    return `${label}: ${v}`;
}

/**
 * Builds multipart guest confirmation after RSVP (HTML + plain text).
 *
 * User-facing copy comes from {@link getGuestConfirmationCopy}; dynamic values are HTML-escaped in the HTML part.
 *
 * @param row — Stored RSVP row shape; callers should only invoke when `row.email` is non-empty (enforced in `notifyGuestRsvpConfirmation`).
 * @param locale — Matches the language the guest used on the form (`POST` body `locale` or default `en`).
 * @param siteUrl — Optional absolute site URL for the primary CTA; if missing/invalid, the button and text CTA are omitted.
 * @param magicLinkClaimUrl — Optional `GET /api/guest/claim` URL (opaque token); omitted when unavailable.
 * @returns {@link GuestConfirmationEmailPayload} for `notifyGuestRsvpConfirmation` → Resend.
 */
export function buildGuestConfirmationEmail(
    row: RsvpRowInsert,
    locale: GuestEmailLocale,
    siteUrl?: string,
    magicLinkClaimUrl?: string,
): GuestConfirmationEmailPayload {
    const copy = getGuestConfirmationCopy(locale);
    const subject = guestConfirmationSubject(row, locale);
    const greeting = escapeHtml(copy.greeting(row.name));

    const lead = row.attending ? copy.leadAttending : copy.leadNotAttending;
    const summary = row.attending
        ? copy.summaryAttending(row.guest_count)
        : copy.summaryNotAttending;

    const {title: whenWhereTitle, lines: whenWhereLines} = venueLines(locale);
    const whenWhereHtml = whenWhereLines
        .map((line) => `<p style="margin:0 0 6px 0;">${escapeHtml(line)}</p>`)
        .join("");
    const whenWhereText = whenWhereLines.join("\n");

    const extrasText = [
        optionalBlockText(copy.dietaryLabel, row.dietary),
        optionalBlockText(copy.messageLabel, row.message),
    ].filter(Boolean) as string[];

    const extrasHtml =
        extrasText.length > 0
            ? `<div style="margin-top:20px;padding-top:16px;border-top:1px solid ${T.border};font-family:${T.fontBody};font-size:14px;color:${T.textSecondary};">${extrasText
                .map(
                    (line) =>
                        `<p style="margin:0 0 8px 0;color:${T.textPrimary};">${escapeHtml(line)}</p>`,
                )
                .join("")}</div>`
            : "";

    const normalizedSite = normalizeOptionalHttpsUrl(siteUrl);
    const normalizedMagic = normalizeOptionalHttpsUrl(magicLinkClaimUrl);

    const ctaLine = normalizedSite
        ? `${copy.openSite}: ${normalizedSite}`
        : null;

    const magicParts = normalizedMagic
        ? buildGuestConfirmationMagicLinkEmailParts(
            {
                magicLinkIntro: copy.magicLinkIntro,
                magicLinkButton: copy.magicLinkButton,
            },
            normalizedMagic,
        )
        : null;

    const magicHtml = magicParts?.htmlBlock ?? "";

    const html = `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="stylesheet" href="${WEDDING_EMAIL_GOOGLE_FONTS_HREF}"/>
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:24px;background:${T.bgBase};font-family:${T.fontBody};color:${T.textPrimary};">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;margin:0 auto;background:${T.white};border-radius:12px;overflow:hidden;border:1px solid ${T.border};">
<tr><td style="padding:32px 28px 28px 28px;">
<p style="margin:0 0 16px 0;font-family:${T.fontDisplay};font-size:22px;color:${T.primary};">${greeting}</p>
<p style="margin:0 0 12px 0;font-family:${T.fontBody};font-size:16px;line-height:1.55;color:${T.textPrimary};">${escapeHtml(lead)}</p>
<p style="margin:0 0 24px 0;font-family:${T.fontBody};font-size:15px;line-height:1.55;color:${T.textSecondary};">${escapeHtml(summary)}</p>
<div style="padding:16px 18px;background:${T.bgSection};border-radius:8px;border:1px solid ${T.border};">
<p style="margin:0 0 8px 0;font-family:${T.fontBody};font-size:12px;letter-spacing:0.04em;text-transform:uppercase;color:${T.textSecondary};">${escapeHtml(whenWhereTitle)}</p>
${whenWhereHtml}
</div>
${extrasHtml}
${magicHtml}
<p style="margin:32px 0 0 0;font-family:${T.fontBody};font-size:14px;line-height:1.6;color:${T.textSecondary};white-space:pre-line;">${escapeHtml(copy.signOff)}</p>
</td></tr>
</table>
</body>
</html>`;

    const textLines = [
        copy.greeting(row.name),
        "",
        lead,
        "",
        summary,
        "",
        whenWhereTitle,
        whenWhereText,
    ];
    if (extrasText.length > 0) {
        textLines.push("", ...extrasText);
    }
    if (magicParts) {
        textLines.push(...magicParts.textAppend);
    }
    textLines.push("", copy.signOff);
    const text = textLines.join("\n");

    return {subject, html, text};
}
