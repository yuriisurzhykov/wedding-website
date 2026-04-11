import "server-only";

import type {SupabaseClient} from "@supabase/supabase-js";

export type LoadRsvpIdentityForUploadResult =
    | { ok: true; name: string; attending: boolean }
    | { ok: false; message: string };

/**
 * Loads `rsvp.name` and `attending` (same source as uploader display name).
 */
export async function loadRsvpIdentityForUpload(
    supabase: SupabaseClient,
    rsvpId: string,
): Promise<LoadRsvpIdentityForUploadResult> {
    const {data, error} = await supabase
        .from("rsvp")
        .select("name, attending")
        .eq("id", rsvpId)
        .maybeSingle();

    if (error) {
        return {ok: false, message: error.message};
    }

    const row = data as { name?: unknown; attending?: unknown } | null;
    if (
        !row ||
        typeof row.name !== "string" ||
        typeof row.attending !== "boolean"
    ) {
        return {ok: false, message: "RSVP not found"};
    }

    const name = row.name.trim();
    if (!name) {
        return {ok: false, message: "RSVP not found"};
    }

    return {ok: true, name, attending: row.attending};
}
