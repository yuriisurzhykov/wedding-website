import "server-only";

import type {SupabaseClient} from "@supabase/supabase-js";

/**
 * Row shape loaded before creating a guest session (claim flow).
 */
export type GuestMagicLinkTokenRow = {
    id: string;
    guest_account_id: string;
    expires_at: string;
};

export type FetchMagicLinkTokenByHashResult =
    | { ok: true; row: GuestMagicLinkTokenRow }
    | { ok: false; reason: "not_found" }
    | { ok: false; reason: "database"; message: string };

/**
 * Loads a single `guest_magic_link_tokens` row by SHA-256 hash of the opaque token.
 */
export async function fetchMagicLinkTokenByHash(
    supabase: SupabaseClient,
    tokenHash: string,
): Promise<FetchMagicLinkTokenByHashResult> {
    const {data, error} = await supabase
        .from("guest_magic_link_tokens")
        .select("id, guest_account_id, expires_at")
        .eq("token_hash", tokenHash)
        .maybeSingle();

    if (error) {
        return {ok: false, reason: "database", message: error.message};
    }

    if (!data) {
        return {ok: false, reason: "not_found"};
    }

    return {ok: true, row: data as GuestMagicLinkTokenRow};
}
