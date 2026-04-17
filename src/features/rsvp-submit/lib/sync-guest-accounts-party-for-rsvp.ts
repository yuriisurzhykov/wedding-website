import "server-only";

import {
    checkPartyHasSinglePrimary,
    mapGuestPartyMemberToRowInsert,
    normalizeGuestAccountEmailForStorage,
    normalizeGuestDisplayNameForStorage,
    type GuestPartyMemberInput,
} from "@entities/guest-account";
import {getOrCreatePrimaryGuestAccountId} from "@features/guest-session/server";
import type {SupabaseClient} from "@supabase/supabase-js";

export type SyncGuestAccountsPartyResult =
    | { ok: true }
    | { ok: false; message: string };

/**
 * Keeps `guest_accounts` in sync with the submitted party: updates the primary display name,
 * replaces non-primary rows (companion emails and sessions on removed companions are dropped).
 */
export async function syncGuestAccountsPartyForRsvp(
    supabase: SupabaseClient,
    rsvpId: string,
    members: readonly GuestPartyMemberInput[],
): Promise<SyncGuestAccountsPartyResult> {
    const inv = checkPartyHasSinglePrimary(members);
    if (inv) {
        return {ok: false, message: `Party invariant violated: ${inv}`};
    }

    const primary = members.find((m) => m.isPrimary);
    if (!primary) {
        return {ok: false, message: "Party list has no primary member"};
    }

    const ensured = await getOrCreatePrimaryGuestAccountId(supabase, rsvpId);
    if (!ensured.ok) {
        return {ok: false, message: ensured.message};
    }

    const displayName = normalizeGuestDisplayNameForStorage(primary.displayName);
    const primaryEmail = normalizeGuestAccountEmailForStorage(
        primary.primaryRsvpEmail ?? null,
    );
    const {error: updErr} = await supabase
        .from("guest_accounts")
        .update({display_name: displayName, email: primaryEmail})
        .eq("id", ensured.guestAccountId);

    if (updErr) {
        return {ok: false, message: updErr.message};
    }

    const {error: delErr} = await supabase
        .from("guest_accounts")
        .delete()
        .eq("rsvp_id", rsvpId)
        .eq("is_primary", false);

    if (delErr) {
        return {ok: false, message: delErr.message};
    }

    const companions = members.filter((m) => !m.isPrimary);
    if (companions.length === 0) {
        return {ok: true};
    }

    const rows = companions.map((m) => mapGuestPartyMemberToRowInsert(rsvpId, m));
    const {error: insErr} = await supabase.from("guest_accounts").insert(rows);
    if (insErr) {
        return {ok: false, message: insErr.message};
    }
    return {ok: true};
}
