import {REPLY_EMAIL_FOOTER_TEXT} from "./render-reply-email";

/**
 * Plain-text alternative for multipart send (searchable clients; no HTML tags).
 */
export function buildReplyEmailPlainText(headingHtml: string, bodyHtml: string): string {
    function strip(html: string): string {
        return html
            .replace(/<\/(p|div|br|li|tr|h[1-6])>/gi, "\n")
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<[^>]+>/g, "")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
    }
    return [strip(headingHtml), strip(bodyHtml), REPLY_EMAIL_FOOTER_TEXT].filter(Boolean).join("\n\n");
}
