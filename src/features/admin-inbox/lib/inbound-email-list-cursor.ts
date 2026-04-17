/**
 * Opaque pagination cursor for {@link listInboundEmailsForAdmin} (offset-based; stable under simple admin loads).
 */
export type InboundEmailListCursorPayload = Readonly<{
    /** Row offset into the ordered list (newest `received_at` first, then `id` desc). */
    offset: number;
}>;

export function encodeInboundEmailListCursor(payload: InboundEmailListCursorPayload): string {
    return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeInboundEmailListCursor(raw: string): InboundEmailListCursorPayload | null {
    try {
        const json = Buffer.from(raw, "base64url").toString("utf8");
        const parsed = JSON.parse(json) as unknown;
        if (!parsed || typeof parsed !== "object") {
            return null;
        }
        const o = parsed as Record<string, unknown>;
        if (typeof o.offset !== "number" || !Number.isFinite(o.offset) || o.offset < 0) {
            return null;
        }
        if (!Number.isInteger(o.offset)) {
            return null;
        }
        return {offset: o.offset};
    } catch {
        return null;
    }
}
