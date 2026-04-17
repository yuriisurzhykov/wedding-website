import "server-only";

import {normalizeGuestAccountEmailForStorage} from "@entities/guest-account";
import type {SupabaseClient} from "@supabase/supabase-js";

export type EnsurePrimaryGuestAccountResult =
    | { ok: true; guestAccountId: string }
    | { ok: false; message: string };

/**
 * Returns the primary `guest_accounts` row for an RSVP, inserting one from `rsvp.name` when missing
 * (e.g. RSVP row predates `guest_accounts` or was created before party-member persistence).
 */
export async function getOrCreatePrimaryGuestAccountId(
    supabase: SupabaseClient,
    rsvpId: string,
): Promise<EnsurePrimaryGuestAccountResult> {
    const {data: existing, error: selErr} = await supabase
        .from("guest_accounts")
        .select("id")
        .eq("rsvp_id", rsvpId)
        .eq("is_primary", true)
        .maybeSingle();

    if (selErr) {
        return {ok: false, message: selErr.message};
    }
    const existingId = (existing as { id?: string } | null)?.id;
    if (typeof existingId === "string") {
        return {ok: true, guestAccountId: existingId};
    }

    const {data: rsvpRow, error: rsvpErr} = await supabase
        .from("rsvp")
        .select("name, email")
        .eq("id", rsvpId)
        .maybeSingle();

    if (rsvpErr) {
        return {ok: false, message: rsvpErr.message};
    }
    const name = (rsvpRow as { name?: unknown } | null)?.name;
    if (typeof name !== "string" || name.trim() === "") {
        return {ok: false, message: "RSVP not found"};
    }

    const rawEmail = (rsvpRow as { email?: unknown } | null)?.email;
    const emailFromRsvp =
        typeof rawEmail === "string"
            ? normalizeGuestAccountEmailForStorage(rawEmail)
            : null;

    const {data: inserted, error: insErr} = await supabase
        .from("guest_accounts")
        .insert({
            rsvp_id: rsvpId,
            display_name: name.trim(),
            is_primary: true,
            sort_order: 0,
            email: emailFromRsvp,
        })
        .select("id")
        .single();

    if (insErr) {
        return {ok: false, message: insErr.message};
    }
    const id = (inserted as { id?: string })?.id;
    if (typeof id !== "string") {
        return {ok: false, message: "Insert succeeded but no guest account id was returned"};
    }
    return {ok: true, guestAccountId: id};
}
