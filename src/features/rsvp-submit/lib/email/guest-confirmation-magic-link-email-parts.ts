import {escapeHtml} from "@shared/lib/html-escape";

import {WEDDING_EMAIL_THEME as T} from "./wedding-email-theme";

export type MagicLinkEmailCopy = {
    magicLinkIntro: string;
    magicLinkButton: string;
};

/**
 * HTML fragment and plain-text tail for the optional “open as guest” magic-link block (multipart email).
 */
export function buildGuestConfirmationMagicLinkEmailParts(
    copy: MagicLinkEmailCopy,
    normalizedHttpsUrl: string,
): {
    htmlBlock: string;
    textAppend: string[];
} {
    const htmlBlock = `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:28px;">
<tr><td align="center" style="padding:0 8px;">
<p style="margin:0 0 20px 0;font-family:${T.fontBody};font-size:14px;line-height:1.6;color:${T.textSecondary};text-align:center;">${escapeHtml(copy.magicLinkIntro)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
<tr><td align="center" bgcolor="${T.primary}" style="border-radius:4px;background-color:${T.primary};mso-padding-alt:14px 32px;">
<a href="${escapeHtml(normalizedHttpsUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 32px;font-family:${T.fontBody},Arial,sans-serif;font-size:13px;font-weight:400;letter-spacing:0.08em;text-transform:uppercase;color:${T.white};text-decoration:none;border-radius:4px;line-height:1.2;">${escapeHtml(copy.magicLinkButton)}</a>
</td></tr></table>
</td></tr></table>`;

    const textAppend = [
        "",
        copy.magicLinkIntro,
        "",
        `${copy.magicLinkButton}: ${normalizedHttpsUrl}`,
    ];

    return {htmlBlock, textAppend};
}
