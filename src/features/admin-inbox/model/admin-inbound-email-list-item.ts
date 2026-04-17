import type {InboundEmailRow} from "@entities/inbound-email";

/**
 * Narrow row for admin mailbox lists (no `html` / `text` bodies).
 */
export type AdminInboundEmailListItem = Readonly<
    Pick<
        InboundEmailRow,
        | "id"
        | "to_address"
        | "from_address"
        | "from_name"
        | "subject"
        | "status"
        | "received_at"
        | "created_at"
    >
>;
