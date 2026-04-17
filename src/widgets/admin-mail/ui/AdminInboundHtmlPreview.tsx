"use client";

import {sanitizeInboundMailHtmlForPreview} from "../lib/sanitize-inbound-mail-html";

type Props = Readonly<{
    /** Raw HTML from inbound storage (untrusted). */
    html: string | null;
    /** Plain-text fallback when HTML is empty. */
    textFallback: string | null;
    title: string;
}>;

/**
 * Renders inbound message body in a strict sandbox iframe with DOMPurify-sanitized `srcDoc`.
 * Scripts and same-origin escalation are blocked by the empty `sandbox` attribute.
 */
export function AdminInboundHtmlPreview({html, textFallback, title}: Props) {
    const sanitized = sanitizeInboundMailHtmlForPreview(html);
    const srcDoc =
        sanitized.trim().length > 0
            ? `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body{font-family:system-ui,sans-serif;font-size:14px;line-height:1.5;margin:12px;word-break:break-word;} img{max-width:100%;height:auto;}</style></head><body>${sanitized}</body></html>`
            : "";

    if (!srcDoc) {
        const plain = textFallback?.trim() ?? "";
        if (!plain) {
            return (
                <p className="text-body text-text-muted">
                    —
                </p>
            );
        }
        return (
            <pre className="max-h-[min(60vh,480px)] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-bg-section p-4 text-small text-text-primary">
                {plain}
            </pre>
        );
    }

    return (
        <iframe
            title={title}
            className="h-[min(60vh,480px)] w-full rounded-md border border-border bg-bg-card"
            sandbox=""
            srcDoc={srcDoc}
        />
    );
}
