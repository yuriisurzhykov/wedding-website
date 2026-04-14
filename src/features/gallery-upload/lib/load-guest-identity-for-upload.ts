import "server-only";

import type {SupabaseClient} from "@supabase/supabase-js";

export type LoadGuestIdentityForUploadResult =
    | { ok: true; name: string; attending: boolean }
    | { ok: false; message: string };

/**
 * Loads uploader display name and attending flag from `guest_accounts` joined with `rsvp`.
 */
export async function loadGuestIdentityForUpload(
    supabase: SupabaseClient,
    guestAccountId: string,
): Promise<LoadGuestIdentityForUploadResult> {
    const {data, error} = await supabase
        .from("guest_accounts")
        .select("display_name, rsvp!inner(attending)")
        .eq("id", guestAccountId)
        .maybeSingle();

    if (error) {
        return {ok: false, message: error.message};
    }

    const raw = data as
        | {
        display_name?: unknown;
        rsvp?: { attending?: unknown } | { attending?: unknown }[];
    }
        | null;

    const rsvpPart = raw?.rsvp;
    const rsvp = Array.isArray(rsvpPart) ? rsvpPart[0] : rsvpPart;
    const attending = rsvp?.attending;
    const displayName = raw?.display_name;

    if (
        typeof displayName !== "string" ||
        typeof attending !== "boolean"
    ) {
        return {ok: false, message: "Guest account not found"};
    }

    const name = displayName.trim();
    if (!name) {
        return {ok: false, message: "Guest account not found"};
    }

    return {ok: true, name, attending};
}
