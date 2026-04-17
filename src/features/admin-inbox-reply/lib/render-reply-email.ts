import {
    WEDDING_EMAIL_GOOGLE_FONTS_HREF,
    WEDDING_EMAIL_THEME as T,
} from "@features/rsvp-submit/lib/email/wedding-email-theme";
import {escapeHtml} from "@shared/lib/html-escape";

/** Fixed footer line (product invariant). */
export const REPLY_EMAIL_FOOTER_TEXT = "With love, Yurii & Mariia";

export type RenderReplyEmailHtmlInput = Readonly<{
    /** Safe HTML for the heading band (caller escapes or uses merged template output). */
    headingHtml: string;
    /** Sanitized body fragment HTML. */
    bodyHtml: string;
    /** Value for `<title>` (usually the subject line). */
    documentTitle: string;
}>;

/**
 * Wraps heading + body + fixed footer in the same inline-styled layout as other transactional wedding emails.
 */
export function renderReplyEmailHtml(input: RenderReplyEmailHtmlInput): string {
    const title = escapeHtml(input.documentTitle);
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="stylesheet" href="${WEDDING_EMAIL_GOOGLE_FONTS_HREF}"/>
<title>${title}</title>
</head>
<body style="margin:0;padding:24px;background:${T.bgBase};font-family:${T.fontBody};color:${T.textPrimary};">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;margin:0 auto;background:${T.white};border-radius:12px;overflow:hidden;border:1px solid ${T.border};">
<tr><td style="padding:28px 28px 20px 28px;border-bottom:1px solid ${T.border};background:${T.bgSection};">
<p style="margin:0;font-family:${T.fontDisplay};font-size:22px;line-height:1.35;color:${T.primary};">${input.headingHtml}</p>
</td></tr>
<tr><td style="padding:24px 28px 8px 28px;">
<div style="font-family:${T.fontBody};font-size:15px;line-height:1.6;color:${T.textPrimary};">${input.bodyHtml}</div>
</td></tr>
<tr><td style="padding:8px 28px 28px 28px;">
<p style="margin:0;font-family:${T.fontBody};font-size:14px;line-height:1.5;color:${T.textSecondary};">${escapeHtml(REPLY_EMAIL_FOOTER_TEXT)}</p>
</td></tr>
</table>
</body>
</html>`;
}
