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
    const htmlBlock = `<p style="margin:24px 0 0 0;font-family:${T.fontBody};font-size:14px;line-height:1.55;color:${T.textSecondary};">${escapeHtml(copy.magicLinkIntro)}</p>
<p style="margin:16px 0 0 0;text-align:center;">
<a href="${escapeHtml(normalizedHttpsUrl)}" style="display:inline-block;padding:12px 28px;background:${T.primary};color:${T.white};text-decoration:none;border-radius:9999px;font-family:${T.fontBody};font-size:15px;font-weight:600;">${escapeHtml(copy.magicLinkButton)}</a>
</p>`;

    const textAppend = [
        "",
        copy.magicLinkIntro,
        "",
        `${copy.magicLinkButton}: ${normalizedHttpsUrl}`,
    ];

    return {htmlBlock, textAppend};
}
