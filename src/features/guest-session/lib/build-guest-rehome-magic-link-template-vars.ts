import "server-only";

import type {GuestMagicLinkRehomePlaceholderKey} from "@entities/email-template";
import {escapeHtml} from "@shared/lib/html-escape";

import {getGuestRehomeMagicLinkCopy, type GuestRehomeEmailLocale} from "./rehome-magic-link-email-copy";

/** Mirrors RSVP transactional palette (`wedding-email-theme`); email-only boundary. */
const T = {
    primary: "#C9A69A",
    textPrimary: "#2C2420",
    textSecondary: "#6B5C54",
    white: "#FFFFFF",
    fontBody: "'Lato', system-ui, -apple-system, Segoe UI, sans-serif",
} as const;

export type GuestRehomeMagicLinkTemplateVars = Record<GuestMagicLinkRehomePlaceholderKey, string>;

function magicLinkParts(
    copy: { magicLinkIntro: string; magicLinkButton: string },
    httpsUrl: string,
): { htmlBlock: string; textAppend: string[] } {
    const htmlBlock = `<p style="margin:24px 0 0 0;font-family:${T.fontBody};font-size:14px;line-height:1.55;color:${T.textSecondary};">${escapeHtml(copy.magicLinkIntro)}</p>
<p style="margin:16px 0 0 0;text-align:center;">
<a href="${escapeHtml(httpsUrl)}" style="display:inline-block;padding:12px 28px;background:${T.primary};color:${T.white};text-decoration:none;border-radius:9999px;font-family:${T.fontBody};font-size:15px;font-weight:600;">${escapeHtml(copy.magicLinkButton)}</a>
</p>`;

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
