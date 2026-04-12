import type {RsvpRowInsert} from "@entities/rsvp";
import {escapeHtml} from "@shared/lib/html-escape";

import {buildGuestRsvpConfirmationTemplateVars} from "./build-guest-rsvp-confirmation-template-vars";
import type {GuestEmailLocale} from "./guest-confirmation-copy";
import {WEDDING_EMAIL_GOOGLE_FONTS_HREF, WEDDING_EMAIL_THEME as T} from "./wedding-email-theme";

/** Parts passed to Resend `emails.send` for the guest thank-you after RSVP (multipart/alternative). */
export type GuestConfirmationEmailPayload = {
    subject: string;
    html: string;
    text: string;
};

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
    const v = buildGuestRsvpConfirmationTemplateVars(
        row,
        locale,
        siteUrl,
        magicLinkClaimUrl,
    );
    const subject = v.subject;
    const greeting = v.greeting_html;

    const lead = v.lead;
    const summary = v.summary;

    const whenWhereTitle = v.when_where_title;
    const whenWhereHtml = v.when_where_body_html;
    const whenWhereText = v.when_where_body_text;

    const extrasHtml = v.extras_html;
    const extrasText = v.extras_text ? v.extras_text.split("\n") : [];

    const magicHtml = v.magic_link_html;

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
<p style="margin:32px 0 0 0;font-family:${T.fontBody};font-size:14px;line-height:1.6;color:${T.textSecondary};white-space:pre-line;">${v.sign_off_html}</p>
</td></tr>
</table>
</body>
</html>`;

    const textLines = [
        v.greeting_text,
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
    if (v.magic_link_text) {
        textLines.push(...v.magic_link_text.split("\n"));
    }
    textLines.push("", v.sign_off_text);
    const text = textLines.join("\n");

    return {subject, html, text};
}
