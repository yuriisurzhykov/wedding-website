import "server-only";

import type {SupabaseClient} from "@supabase/supabase-js";

export type LoadRsvpDisplayNameResult =
    | {ok: true; name: string}
    | {ok: false; message: string};

/**
 * Loads `rsvp.name` for a guest session so `photos.uploader_name` matches RSVP identity.
 */
export async function loadRsvpDisplayNameForUpload(
    supabase: SupabaseClient,
    rsvpId: string,
): Promise<LoadRsvpDisplayNameResult> {
    const {data, error} = await supabase
        .from("rsvp")
        .select("name")
        .eq("id", rsvpId)
        .maybeSingle();

    if (error) {
        return {ok: false, message: error.message};
    }

    const name =
        data &&
        typeof (data as {name?: unknown}).name === "string"
            ? (data as {name: string}).name.trim()
            : "";

    if (!name) {
        return {ok: false, message: "RSVP not found"};
    }

    return {ok: true, name};
}
