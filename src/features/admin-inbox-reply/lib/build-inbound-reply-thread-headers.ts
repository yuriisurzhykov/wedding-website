import type {InboundEmailRow} from "@entities/inbound-email";

function bracketMessageId(raw: string | null | undefined): string | undefined {
    if (!raw?.trim()) {
        return undefined;
    }
    let t = raw.trim();
    if (!t.startsWith("<")) {
        t = `<${t}`;
    }
    if (!t.endsWith(">")) {
        t = `${t}>`;
    }
    return t;
}

/**
 * RFC 5322 threading headers for a reply to a stored inbound row.
 */
export function buildInboundReplyThreadHeaders(
    inbound: Pick<InboundEmailRow, "message_id" | "references">,
): Record<string, string> | undefined {
    const inReplyTo = bracketMessageId(inbound.message_id);
    const refsParts: string[] = [];
    if (inbound.references?.trim()) {
        refsParts.push(...inbound.references.trim().split(/\s+/).filter(Boolean));
    }
    const mid = bracketMessageId(inbound.message_id);
    if (mid && !refsParts.includes(mid)) {
        refsParts.push(mid);
    }
    const headers: Record<string, string> = {};
    if (inReplyTo) {
        headers["In-Reply-To"] = inReplyTo;
    }
    if (refsParts.length > 0) {
        headers["References"] = refsParts.join(" ");
    }
    return Object.keys(headers).length > 0 ? headers : undefined;
}
