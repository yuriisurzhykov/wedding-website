import "server-only";

import type {SupabaseClient} from "@supabase/supabase-js";

import type {GuestSessionRow} from "./types";
import {
    getGuestSessionRuntimeConfig,
    guestSessionExpiresAtFromNow,
    type GuestSessionRuntimeConfig,
} from "./get-guest-session-config";
import {generateOpaqueToken, hashSessionToken} from "./token";

export type CreateGuestSessionResult =
    | {
    ok: true;
    rawToken: string;
    session: Pick<GuestSessionRow, "id" | "expires_at" | "guest_account_id">;
}
    | { ok: false; kind: "database"; message: string };

/**
 * Inserts a new `guest_sessions` row and returns the **raw** opaque token for `Set-Cookie`.
 * Only the hash is stored. Caller should set cookie with {@link getGuestSessionCookieDescriptor}.
 *
 * On extremely rare hash collision (unique violation), retries once with a new token.
 */
export async function createGuestSession(
    supabase: SupabaseClient,
    guestAccountId: string,
    config: GuestSessionRuntimeConfig = getGuestSessionRuntimeConfig(),
): Promise<CreateGuestSessionResult> {
    const expiresAt = guestSessionExpiresAtFromNow(config);

    for (let attempt = 0; attempt < 2; attempt++) {
        const rawToken = generateOpaqueToken();
        const tokenHash = hashSessionToken(rawToken);

        const {data, error} = await supabase
            .from("guest_sessions")
            .insert({
                guest_account_id: guestAccountId,
                token_hash: tokenHash,
                expires_at: expiresAt.toISOString(),
            })
            .select("id, guest_account_id, expires_at")
            .single();

        if (!error && data) {
            const row = data as {
                id: string;
                guest_account_id: string;
                expires_at: string;
            };
            return {
                ok: true,
                rawToken,
                session: {
                    id: row.id,
                    guest_account_id: row.guest_account_id,
                    expires_at: row.expires_at,
                },
            };
        }

        if (error?.code === "23505") {
            continue;
        }

        return {
            ok: false,
            kind: "database",
            message: error?.message ?? "insert failed",
        };
    }

    return {
        ok: false,
        kind: "database",
        message: "Could not allocate guest session token",
    };
}
