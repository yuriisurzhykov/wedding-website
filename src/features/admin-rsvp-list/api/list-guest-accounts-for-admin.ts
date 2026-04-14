import "server-only";

import {createServerClient} from "@shared/api/supabase/server";

import type {AdminGuestListRow} from "../model/admin-guest-list-row";
import {
    mapGuestAccountJoinToAdminRow,
    type GuestAccountAdminJoinRow,
} from "./map-guest-account-join-to-admin-row";
import {sortAdminGuestRowsByParty} from "./sort-admin-guest-rows-by-party";

export type ListGuestAccountsForAdminOptions = Readonly<{
    /** When set, only party members whose parent `rsvp` has this `attending` value. */
    attending?: boolean;
}>;

export type ListGuestAccountsForAdminResult =
    | {ok: true; rows: AdminGuestListRow[]}
    | {ok: false; kind: "config" | "database"; message: string};

/**
 * Lists `guest_accounts` rows for the admin UI with nested `rsvp` (service role).
 * Rows are ordered by party `created_at` descending, then `guest_accounts.sort_order` ascending.
 * Call only after admin auth and rate limiting in HTTP handlers.
 */
export async function listGuestAccountsForAdmin(
    options?: ListGuestAccountsForAdminOptions,
): Promise<ListGuestAccountsForAdminResult> {
    let supabase;
    try {
        supabase = createServerClient();
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, kind: "config", message};
    }

    let query = supabase
        .from("guest_accounts")
        .select(
            "id, display_name, is_primary, sort_order, email, rsvp!inner(id, attending, email, phone, guest_count, dietary, message, created_at)",
        );

    if (options?.attending !== undefined) {
        query = query.eq("rsvp.attending", options.attending);
    }

    const {data, error} = await query;

    if (error) {
        return {ok: false, kind: "database", message: error.message};
    }

    const rawRows = (data ?? []) as GuestAccountAdminJoinRow[];
    const mapped: AdminGuestListRow[] = [];
    for (const row of rawRows) {
        const dto = mapGuestAccountJoinToAdminRow(row);
        if (dto) {
            mapped.push(dto);
        }
    }

    return {ok: true, rows: sortAdminGuestRowsByParty(mapped)};
}
