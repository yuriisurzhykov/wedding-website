import "server-only";

import type {SupabaseClient} from "@supabase/supabase-js";

import type {GuestSessionClientSnapshot} from "./client-snapshot";
import {createGuestSession} from "./create-session";
import {fetchMagicLinkTokenByHash} from "./fetch-magic-link-token-by-hash";
import {getGuestSessionRuntimeConfig} from "./get-guest-session-config";
import {getMagicLinkClaimEligibility, trimMagicLinkTokenInput,} from "./magic-link-token-pure";
import {markMagicLinkTokenUsed} from "./mark-magic-link-token-used";
import {loadGuestSessionClientSnapshotForRsvp} from "./restore-guest-session-by-credentials";
import {hashSessionToken} from "./token";

export type ClaimMagicLinkResult =
    | { ok: true; rawToken: string; snapshot: GuestSessionClientSnapshot }
    | {
    ok: false;
    kind:
        | "invalid_token"
        | "expired"
        | "used"
        | "session_failed"
        | "database";
    message?: string;
};

/**
 * End-to-end magic-link claim: resolve token → validate row → create session → mark used → load §4 snapshot.
 * Each step delegates to a dedicated helper.
 */
export async function claimMagicLink(
    supabase: SupabaseClient,
    rawMagicToken: string,
): Promise<ClaimMagicLinkResult> {
    const trimmed = trimMagicLinkTokenInput(rawMagicToken);
    if (!trimmed) {
        return {ok: false, kind: "invalid_token"};
    }

    const fetched = await fetchMagicLinkTokenByHash(
        supabase,
        hashSessionToken(trimmed),
    );

    if (!fetched.ok) {
        if (fetched.reason === "not_found") {
            return {ok: false, kind: "invalid_token"};
        }
        return {
            ok: false,
            kind: "database",
            message: fetched.message,
        };
    }

    const nowMs = Date.now();
    const eligibility = getMagicLinkClaimEligibility(fetched.row, nowMs);
    if (eligibility === "used") {
        return {ok: false, kind: "used"};
    }
    if (eligibility === "expired") {
        return {ok: false, kind: "expired"};
    }

    const created = await createGuestSession(
        supabase,
        fetched.row.rsvp_id,
        getGuestSessionRuntimeConfig(),
    );

    if (!created.ok) {
        return {
            ok: false,
            kind: "session_failed",
            message: created.message,
        };
    }

    const marked = await markMagicLinkTokenUsed(supabase, fetched.row.id);
    if (!marked.ok) {
        console.error(
            `[guest-session] magic link mark used failed (rsvp_id=${fetched.row.rsvp_id}): ${marked.message}`,
        );
    }

    const loaded = await loadGuestSessionClientSnapshotForRsvp(
        supabase,
        fetched.row.rsvp_id,
    );

    if (!loaded.ok) {
        if (loaded.kind === "database") {
            return {
                ok: false,
                kind: "database",
                message: loaded.message,
            };
        }
        return {ok: false, kind: "invalid_token"};
    }

    return {
        ok: true,
        rawToken: created.rawToken,
        snapshot: loaded.snapshot,
    };
}
