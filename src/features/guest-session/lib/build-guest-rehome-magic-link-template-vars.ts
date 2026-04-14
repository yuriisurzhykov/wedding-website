import "server-only";

import type {GuestMagicLinkRehomePlaceholderKey} from "@entities/email-template";
import {escapeHtml} from "@shared/lib/html-escape";

import {getGuestRehomeMagicLinkCopy, type GuestRehomeEmailLocale} from "./rehome-magic-link-email-copy";

/** Same palette and CTA markup as RSVP `guest-confirmation-magic-link-email-parts` (avoid importing `@features/rsvp-submit` here — cycle). */
const T = {
    primary: "#758461",
    textSecondary: "#70645C",
    white: "#FFFFFF",
    fontBody: "'Lato', system-ui, -apple-system, Segoe UI, sans-serif",
} as const;

export type GuestRehomeMagicLinkTemplateVars = Record<GuestMagicLinkRehomePlaceholderKey, string>;

function magicLinkParts(
    copy: { magicLinkIntro: string; magicLinkButton: string },
    httpsUrl: string,
): { htmlBlock: string; textAppend: string[] } {
    const htmlBlock = `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:28px;">
<tr><td align="center" style="padding:0 8px;">
<p style="margin:0 0 20px 0;font-family:${T.fontBody};font-size:14px;line-height:1.6;color:${T.textSecondary};text-align:center;">${escapeHtml(copy.magicLinkIntro)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
<tr><td align="center" bgcolor="${T.primary}" style="border-radius:4px;background-color:${T.primary};mso-padding-alt:14px 32px;">
<a href="${escapeHtml(httpsUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 32px;font-family:${T.fontBody},Arial,sans-serif;font-size:13px;font-weight:400;letter-spacing:0.08em;text-transform:uppercase;color:${T.white};text-decoration:none;border-radius:4px;line-height:1.2;">${escapeHtml(copy.magicLinkButton)}</a>
</td></tr></table>
</td></tr></table>`;

    const textAppend = ["", copy.magicLinkIntro, "", `${copy.magicLinkButton}: ${httpsUrl}`];

    return {htmlBlock, textAppend};
}

/**
 * Placeholder map for `guest-magic-link-rehome-*` rows in `email_templates`.
 */
export function buildGuestRehomeMagicLinkTemplateVars(
    displayName: string,
    locale: GuestRehomeEmailLocale,
    magicLinkClaimUrl: string,
): GuestRehomeMagicLinkTemplateVars {
    const copy = getGuestRehomeMagicLinkCopy(locale);
    const greetingText = copy.greeting(displayName);
    const parts = magicLinkParts(
        {magicLinkIntro: copy.magicLinkIntro, magicLinkButton: copy.magicLinkButton},
        magicLinkClaimUrl,
    );

    return {
        subject: copy.subject,
        greeting_html: escapeHtml(greetingText),
        greeting_text: greetingText,
        lead: copy.lead,
        magic_link_html: parts.htmlBlock,
        magic_link_text: parts.textAppend.join("\n"),
        sign_off_html: escapeHtml(copy.signOff),
        sign_off_text: copy.signOff,
    };
}
