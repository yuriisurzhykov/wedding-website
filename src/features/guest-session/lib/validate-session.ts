import "server-only";

import type {SupabaseClient} from "@supabase/supabase-js";

import {extractGuestSessionTokenFromRequest} from "./cookie";
import type {GuestSessionRuntimeConfig} from "./get-guest-session-config";
import {getGuestSessionRuntimeConfig} from "./get-guest-session-config";
import type {GuestSessionRow, ValidateGuestSessionResult} from "./types";
import {hashSessionToken} from "./token";

function isExpired(iso: string): boolean {
    const t = Date.parse(iso);
    return !Number.isFinite(t) || t <= Date.now();
}

/**
 * Loads and validates a guest session by the **raw** cookie token.
 * Updates `last_seen_at` when validation succeeds (best-effort; failures are ignored).
 */
export async function validateGuestSession(
    supabase: SupabaseClient,
    rawToken: string | null | undefined,
): Promise<ValidateGuestSessionResult> {
    if (rawToken === null || rawToken === undefined || rawToken === "") {
        return {ok: false, reason: "missing"};
    }

    const tokenHash = hashSessionToken(rawToken);

    const {data, error} = await supabase
        .from("guest_sessions")
        .select(
            "id, rsvp_id, token_hash, expires_at, created_at, last_seen_at",
        )
        .eq("token_hash", tokenHash)
        .maybeSingle();

    if (error) {
        return {
            ok: false,
            reason: "database",
            message: error.message,
        };
    }

    if (!data) {
        return {ok: false, reason: "invalid"};
    }

    const row = data as GuestSessionRow;

    if (isExpired(row.expires_at)) {
        return {ok: false, reason: "expired"};
    }

    void supabase
        .from("guest_sessions")
        .update({last_seen_at: new Date().toISOString()})
        .eq("id", row.id)
        .then(({error: touchErr}) => {
            if (touchErr) {
                console.warn("[guest-session] last_seen_at update failed", touchErr.message);
            }
        });

    return {ok: true, session: row};
}

/**
 * Reads the cookie from the request and validates the session (see {@link validateGuestSession}).
 */
export async function validateGuestSessionFromRequest(
    supabase: SupabaseClient,
    request: Pick<Request, "headers">,
    config: GuestSessionRuntimeConfig = getGuestSessionRuntimeConfig(),
): Promise<ValidateGuestSessionResult> {
    const raw = extractGuestSessionTokenFromRequest(request, config);
    return validateGuestSession(supabase, raw);
}
