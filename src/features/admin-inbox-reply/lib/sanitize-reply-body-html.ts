import DOMPurify from "isomorphic-dompurify";

/**
 * Allow-listed subset for reply body HTML (plan: p, br, strong, em, a, ul, ol, li; `href` on anchors only).
 */
export function sanitizeReplyBodyHtml(raw: string): string {
    return DOMPurify.sanitize(raw, {
        ALLOWED_TAGS: ["p", "br", "strong", "em", "a", "ul", "ol", "li"],
        ALLOWED_ATTR: ["href"],
        ALLOW_DATA_ATTR: false,
    });
}
