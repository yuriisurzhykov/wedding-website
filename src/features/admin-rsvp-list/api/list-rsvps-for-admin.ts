import "server-only";

import type {RsvpRow} from "@entities/rsvp";
import {createServerClient} from "@shared/api/supabase/server";

export type ListRsvpsForAdminOptions = Readonly<{
    /** When set, only rows with this `attending` value; when omitted, all rows. */
    attending?: boolean;
}>;

export type ListRsvpsForAdminResult =
    | {ok: true; rows: RsvpRow[]}
    | {ok: false; kind: "config" | "database"; message: string};

/**
 * Lists RSVP rows for the admin UI (service role, `created_at` descending).
 * Call only after admin auth and rate limiting in HTTP handlers.
 */
export async function listRsvpsForAdmin(
    options?: ListRsvpsForAdminOptions,
): Promise<ListRsvpsForAdminResult> {
    let supabase;
    try {
        supabase = createServerClient();
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, kind: "config", message};
    }

    let query = supabase
        .from("rsvp")
        .select("*")
        .order("created_at", {ascending: false});

    if (options?.attending !== undefined) {
        query = query.eq("attending", options.attending);
    }

    const {data, error} = await query;

    if (error) {
        return {ok: false, kind: "database", message: error.message};
    }

    return {ok: true, rows: (data ?? []) as RsvpRow[]};
}
