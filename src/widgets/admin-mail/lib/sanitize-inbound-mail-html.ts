import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitizes untrusted inbound HTML for display inside a sandboxed iframe (`srcDoc`).
 * Stricter than outgoing reply bodies: common mail tags, no scripts/styles.
 */
export function sanitizeInboundMailHtmlForPreview(raw: string | null | undefined): string {
    if (!raw?.trim()) {
        return "";
    }
    return DOMPurify.sanitize(raw, {
        ALLOWED_TAGS: [
            "p",
            "br",
            "div",
            "span",
            "a",
            "strong",
            "em",
            "b",
            "i",
            "u",
            "ul",
            "ol",
            "li",
            "blockquote",
            "h1",
            "h2",
            "h3",
            "h4",
            "table",
            "thead",
            "tbody",
            "tr",
            "td",
            "th",
            "img",
            "hr",
            "pre",
            "code",
        ],
        ALLOWED_ATTR: ["href", "title", "target", "rel", "src", "alt", "class", "colspan", "rowspan"],
        ALLOW_DATA_ATTR: false,
        FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input", "button"],
    });
}
