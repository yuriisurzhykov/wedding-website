import type {InboundEmailRow} from "@entities/inbound-email";

/**
 * Display name for `{{senderName}}` — prefers stored `from_name`, else parses a `Name <addr>` line, else the local part of the address.
 */
export function deriveSenderDisplayName(
    inbound: Pick<InboundEmailRow, "from_name" | "from_address">,
): string {
    const named = inbound.from_name?.trim();
    if (named) {
        return named;
    }
    const from = inbound.from_address.trim();
    const angle = from.match(/^(.+?)\s*<([^>]+)>\s*$/);
    if (angle) {
        const rawName = angle[1].trim().replace(/^["']|["']$/g, "").trim();
        if (rawName.length > 0) {
            return rawName;
        }
        const addr = angle[2].trim();
        const local = addr.split("@")[0];
        return local && local.length > 0 ? local : "Guest";
    }
    const local = from.split("@")[0];
    return local && local.length > 0 ? local : "Guest";
}
