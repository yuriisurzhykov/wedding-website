import "server-only";

import type {SupabaseClient} from "@supabase/supabase-js";
import {z} from "zod";

import {mapRsvpFormToRow} from "@entities/rsvp";

import {
    buildGuestSessionClientSnapshot,
    type GuestSessionClientSnapshot,
} from "./client-snapshot";
import {createGuestSession} from "./create-session";
import {getGuestSessionRuntimeConfig} from "./get-guest-session-config";

/** Name / email string rules aligned with RSVP submit validation; email is required for restore. */
const restoreCredentialsSchema = z
    .object({
        name: z.string().trim().min(1, "Name is required").max(200),
        email: z.string().trim().max(320).pipe(z.email()),
    })
    .strict();

export type ParseGuestSessionRestoreBodyResult =
    | {ok: true; name: string; email: string}
    | {ok: false; error: z.ZodError};

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

export type RestoreGuestSessionByCredentialsResult =
    | {
          ok: true;
          rawToken: string;
          session: GuestSessionClientSnapshot;
      }
    | {ok: false; kind: "no_match"}
    | {ok: false; kind: "database"; message: string};

/**
 * Finds an `rsvp` row using the same normalization as RSVP persistence, creates a new
 * `guest_sessions` row, and returns the raw cookie token plus a safe client snapshot (plan §4).
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

    const {data, error} = await supabase
        .from("rsvp")
        .select("id, name, email")
        .eq("email", row.email)
        .eq("name", row.name)
        .maybeSingle();

    if (error) {
        return {ok: false, kind: "database", message: error.message};
    }

    if (!data) {
        return {ok: false, kind: "no_match"};
    }

    const created = await createGuestSession(
        supabase,
        data.id,
        getGuestSessionRuntimeConfig(),
    );

    if (!created.ok) {
        return {ok: false, kind: "database", message: created.message};
    }

    const session = buildGuestSessionClientSnapshot({
        name: data.name,
        email: data.email,
    });

    return {
        ok: true,
        rawToken: created.rawToken,
        session,
    };
}

export type LoadGuestSessionSnapshotResult =
    | {ok: true; snapshot: GuestSessionClientSnapshot}
    | {ok: false; kind: "not_found"}
    | {ok: false; kind: "database"; message: string};

/**
 * Loads display fields for §4 JSON after a validated `guest_sessions` row.
 */
export async function loadGuestSessionClientSnapshotForRsvp(
    supabase: SupabaseClient,
    rsvpId: string,
): Promise<LoadGuestSessionSnapshotResult> {
    const {data, error} = await supabase
        .from("rsvp")
        .select("name, email")
        .eq("id", rsvpId)
        .maybeSingle();

    if (error) {
        return {ok: false, kind: "database", message: error.message};
    }

    if (!data) {
        return {ok: false, kind: "not_found"};
    }

    const row = data as {name: string; email: string | null};
    return {
        ok: true,
        snapshot: buildGuestSessionClientSnapshot({
            name: row.name,
            email: row.email,
        }),
    };
}
