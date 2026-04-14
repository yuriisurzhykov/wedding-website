import "server-only";

import type {SupabaseClient} from "@supabase/supabase-js";

import type {GuestSessionClientSnapshot} from "./client-snapshot";
import {createGuestSession} from "./create-session";
import {fetchMagicLinkTokenByHash} from "./fetch-magic-link-token-by-hash";
import {getGuestSessionRuntimeConfig} from "./get-guest-session-config";
import {getMagicLinkClaimEligibility, trimMagicLinkTokenInput,} from "./magic-link-token-pure";
import {loadGuestSessionClientSnapshotForGuestAccount} from "./load-guest-session-snapshot-for-guest-account";
import {hashSessionToken} from "./token";

export type ClaimMagicLinkResult =
    | { ok: true; rawToken: string; snapshot: GuestSessionClientSnapshot }
    | {
    ok: false;
    kind:
        | "invalid_token"
        | "expired"
        | "session_failed"
        | "database";
    message?: string;
};

/**
 * End-to-end magic-link claim: resolve token → validate row (not past `expires_at`) → create session → load §4 snapshot.
 * The magic-link token remains valid until expiry so guests can restore the session again from the same email link.
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
    if (eligibility === "expired") {
        return {ok: false, kind: "expired"};
    }

    const created = await createGuestSession(
        supabase,
        fetched.row.guest_account_id,
        getGuestSessionRuntimeConfig(),
    );

    if (!created.ok) {
        return {
            ok: false,
            kind: "session_failed",
            message: created.message,
        };
    }

    const loaded = await loadGuestSessionClientSnapshotForGuestAccount(
        supabase,
        fetched.row.guest_account_id,
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
