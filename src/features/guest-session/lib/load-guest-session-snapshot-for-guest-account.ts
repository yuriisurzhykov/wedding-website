import "server-only";

import type {SupabaseClient} from "@supabase/supabase-js";

import {buildGuestSessionClientSnapshot, type GuestSessionClientSnapshot,} from "./client-snapshot";

export type LoadGuestSessionSnapshotForGuestAccountResult =
    | { ok: true; snapshot: GuestSessionClientSnapshot }
    | { ok: false; kind: "not_found" }
    | { ok: false; kind: "database"; message: string };

type GuestAccountWithRsvpRow = {
    display_name: string;
    is_primary: boolean;
    email: string | null;
    rsvp: {
        name: string;
        email: string | null;
        attending: boolean;
    };
};

/**
 * Builds the §4 client snapshot from `guest_accounts` joined with `rsvp`.
 *
 * **Effective email for masking**
 * - Primary: party contact on `rsvp.email` (single source for the main guest).
 * - Companion: `guest_accounts.email` when set; otherwise the party `rsvp.email` (shared inbox until rehome).
 */
export async function loadGuestSessionClientSnapshotForGuestAccount(
    supabase: SupabaseClient,
    guestAccountId: string,
): Promise<LoadGuestSessionSnapshotForGuestAccountResult> {
    const {data, error} = await supabase
        .from("guest_accounts")
        .select(
            "display_name, is_primary, email, rsvp!inner (name, email, attending)",
        )
        .eq("id", guestAccountId)
        .maybeSingle();

    if (error) {
        return {ok: false, kind: "database", message: error.message};
    }

    if (!data) {
        return {ok: false, kind: "not_found"};
    }

    const raw = data as {
        display_name: string;
        is_primary: boolean;
        email: string | null;
        rsvp:
            | GuestAccountWithRsvpRow["rsvp"]
            | GuestAccountWithRsvpRow["rsvp"][];
    };
    const rsvp = Array.isArray(raw.rsvp) ? raw.rsvp[0] : raw.rsvp;
    if (!rsvp || typeof rsvp.attending !== "boolean") {
        return {ok: false, kind: "not_found"};
    }

    const row: GuestAccountWithRsvpRow = {
        display_name: raw.display_name,
        is_primary: raw.is_primary,
        email: raw.email,
        rsvp,
    };
    const partyEmail = row.rsvp.email?.trim() ?? null;
    const accountEmail = row.email?.trim() ?? null;
    const effectiveEmail = row.is_primary
        ? partyEmail
        : (accountEmail ?? partyEmail);

    return {
        ok: true,
        snapshot: buildGuestSessionClientSnapshot({
            name: row.display_name.trim(),
            email: effectiveEmail,
            attending: row.rsvp.attending,
        }),
    };
}
