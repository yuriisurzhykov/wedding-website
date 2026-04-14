import "server-only";

import type {SupabaseClient} from "@supabase/supabase-js";
import {z} from "zod";

import {mapRsvpFormToRow} from "@entities/rsvp";

import type {GuestSessionClientSnapshot} from "./client-snapshot";
import {createGuestSession} from "./create-session";
import {getGuestSessionRuntimeConfig} from "./get-guest-session-config";
import {loadGuestSessionClientSnapshotForGuestAccount,} from "./load-guest-session-snapshot-for-guest-account";

/** Name / email string rules aligned with RSVP submit validation; email is required for restore. */
const restoreCredentialsSchema = z
    .object({
        name: z.string().trim().min(1, "Name is required").max(200),
        email: z.string().trim().max(320).pipe(z.email()),
    })
    .strict();

export type ParseGuestSessionRestoreBodyResult =
    | { ok: true; name: string; email: string }
    | { ok: false; error: z.ZodError };

/**
 * Parses `POST /api/guest/session` JSON. Field rules align with RSVP payload normalization via
 * {@link mapRsvpFormToRow} in the restore step.
 */
export function parseGuestSessionRestoreBody(
    raw: unknown,
): ParseGuestSessionRestoreBodyResult {
    const result = restoreCredentialsSchema.safeParse(raw);
    if (!result.success) {
        return {ok: false, error: result.error};
    }
    return {ok: true, ...result.data};
}

function idFromMaybeRow(data: unknown): string | null {
    const id = (data as { id?: string } | null)?.id;
    return typeof id === "string" ? id : null;
}

/**
 * Resolves `guest_accounts.id` for restore: primary by `rsvp.name` + `rsvp.email`, then companion with own email,
 * then non-primary without `guest_accounts.email` matched by `display_name` + party `rsvp.email`.
 */
async function findGuestAccountIdForRestore(
    supabase: SupabaseClient,
    normalizedName: string,
    normalizedEmail: string,
): Promise<string | null> {
    const {data: primary, error: ePrimary} = await supabase
        .from("guest_accounts")
        .select("id, rsvp!inner(name, email)")
        .eq("is_primary", true)
        .eq("rsvp.name", normalizedName)
        .eq("rsvp.email", normalizedEmail)
        .limit(1)
        .maybeSingle();

    if (ePrimary) {
        console.warn("[guest-session] restore primary lookup", ePrimary.message);
        return null;
    }
    const primaryId = idFromMaybeRow(primary);
    if (primaryId) {
        return primaryId;
    }

    const {data: compOwn, error: eOwn} = await supabase
        .from("guest_accounts")
        .select("id")
        .eq("is_primary", false)
        .eq("display_name", normalizedName)
        .eq("email", normalizedEmail)
        .limit(1)
        .maybeSingle();

    if (eOwn) {
        console.warn("[guest-session] restore companion-email lookup", eOwn.message);
        return null;
    }
    const companionOwnId = idFromMaybeRow(compOwn);
    if (companionOwnId) {
        return companionOwnId;
    }

    const {data: compParty, error: eParty} = await supabase
        .from("guest_accounts")
        .select("id, rsvp!inner(email)")
        .eq("is_primary", false)
        .is("email", null)
        .eq("display_name", normalizedName)
        .eq("rsvp.email", normalizedEmail)
        .limit(1)
        .maybeSingle();

    if (eParty) {
        console.warn("[guest-session] restore companion-party-email lookup", eParty.message);
        return null;
    }
    return idFromMaybeRow(compParty);
}

export type RestoreGuestSessionByCredentialsResult =
    | { ok: true; rawToken: string; session: GuestSessionClientSnapshot }
    | { ok: false; kind: "no_match" }
    | { ok: false; kind: "database"; message: string };

/**
 * Finds a `guest_accounts` row using the same name/email normalization as RSVP persistence, creates a new
 * `guest_sessions` row bound to that account, and returns the raw cookie token plus a safe client snapshot (plan §4).
 */
export async function restoreGuestSessionByCredentials(
    supabase: SupabaseClient,
    name: string,
    email: string,
): Promise<RestoreGuestSessionByCredentialsResult> {
    const row = mapRsvpFormToRow({
        name,
        email,
        attending: true,
        guestCount: 1,
    });

    if (!row.email) {
        return {ok: false, kind: "no_match"};
    }

    const guestAccountId = await findGuestAccountIdForRestore(
        supabase,
        row.name,
        row.email,
    );

    if (!guestAccountId) {
        return {ok: false, kind: "no_match"};
    }

    const created = await createGuestSession(
        supabase,
        guestAccountId,
        getGuestSessionRuntimeConfig(),
    );

    if (!created.ok) {
        return {ok: false, kind: "database", message: created.message};
    }

    const loaded = await loadGuestSessionClientSnapshotForGuestAccount(
        supabase,
        guestAccountId,
    );

    if (!loaded.ok) {
        if (loaded.kind === "database") {
            return {ok: false, kind: "database", message: loaded.message};
        }
        return {ok: false, kind: "no_match"};
    }

    return {
        ok: true,
        rawToken: created.rawToken,
        session: loaded.snapshot,
    };
}
