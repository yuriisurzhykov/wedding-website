import "server-only";

import type {SupabaseClient} from "@supabase/supabase-js";

import type {MagicLinkRuntimeConfig} from "./get-magic-link-config";
import {guestSessionExpiresAtFromNow} from "./get-guest-session-config";
import {generateOpaqueToken, hashSessionToken} from "./token";

export type PersistOneMagicLinkTokenResult =
    | { ok: true; rawToken: string }
    | { ok: false; reason: "duplicate_hash" }
    | { ok: false; reason: "database"; message: string };

/**
 * Computes `expires_at` for a new magic-link row from configured TTL.
 */
export function computeMagicLinkExpiresAt(
    config: Pick<MagicLinkRuntimeConfig, "maxAgeSec">,
): Date {
    return guestSessionExpiresAtFromNow({maxAgeSec: config.maxAgeSec});
}

/**
 * Generates a new opaque token + hash pair (one attempt before insert).
 */
export function newMagicLinkOpaquePair(): { rawToken: string; tokenHash: string } {
    const rawToken = generateOpaqueToken();
    return {rawToken, tokenHash: hashSessionToken(rawToken)};
}

/**
 * Inserts one `guest_magic_link_tokens` row for a pre-generated opaque token.
 * Returns **`duplicate_hash`** when Postgres reports unique violation (`23505`) on `token_hash`.
 */
export async function persistOneGuestMagicLinkToken(
    supabase: SupabaseClient,
    rsvpId: string,
    expiresAt: Date,
    rawToken: string,
    tokenHash: string,
): Promise<PersistOneMagicLinkTokenResult> {
    const {error} = await supabase.from("guest_magic_link_tokens").insert({
        rsvp_id: rsvpId,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
    });

    if (!error) {
        return {ok: true, rawToken};
    }

    if (error.code === "23505") {
        return {ok: false, reason: "duplicate_hash"};
    }

    return {ok: false, reason: "database", message: error.message};
}
