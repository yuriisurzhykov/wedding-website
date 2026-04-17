import "server-only";

import {createServerClient} from "@shared/api/supabase/server";

import {
    decodeInboundEmailListCursor,
    encodeInboundEmailListCursor,
} from "@features/admin-inbox";
import type {AdminInboundEmailListItem} from "@features/admin-inbox";

export type ListInboundEmailsForAdminOptions = Readonly<{
    /** Max rows to return (capped). Default 25. */
    limit?: number;
    /** Opaque cursor from the previous response (`nextCursor`). */
    cursor?: string | null;
}>;

export type ListInboundEmailsForAdminResult =
    | {
          ok: true;
          emails: AdminInboundEmailListItem[];
          nextCursor: string | null;
      }
    | {ok: false; kind: "config" | "database"; message: string}
    | {ok: false; kind: "invalid_cursor"; message: string};

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 50;

const LIST_SELECT =
    "id, to_address, from_address, from_name, subject, status, received_at, created_at";

/**
 * Lists inbound messages for the admin mail UI (newest first), without body fields.
 * Call only after admin auth and rate limiting in HTTP handlers.
 */
export async function listInboundEmailsForAdmin(
    options?: ListInboundEmailsForAdminOptions,
): Promise<ListInboundEmailsForAdminResult> {
    const rawLimit = options?.limit ?? DEFAULT_LIMIT;
    const limit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(rawLimit)));

    let offset = 0;
    if (options?.cursor) {
        const decoded = decodeInboundEmailListCursor(options.cursor);
        if (!decoded) {
            return {ok: false, kind: "invalid_cursor", message: "Invalid or expired cursor."};
        }
        offset = decoded.offset;
    }

    let supabase;
    try {
        supabase = createServerClient();
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, kind: "config", message};
    }

    const fetchCount = limit + 1;
    const rangeEnd = offset + fetchCount - 1;

    const {data, error} = await supabase
        .from("inbound_emails")
        .select(LIST_SELECT)
        .order("received_at", {ascending: false})
        .order("id", {ascending: false})
        .range(offset, rangeEnd);

    if (error) {
        return {ok: false, kind: "database", message: error.message};
    }

    const rows = (data ?? []) as AdminInboundEmailListItem[];
    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore
        ? encodeInboundEmailListCursor({offset: offset + limit})
        : null;

    return {ok: true, emails: pageRows, nextCursor};
}
