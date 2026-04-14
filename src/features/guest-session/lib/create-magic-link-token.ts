import "server-only";

import type {SupabaseClient} from "@supabase/supabase-js";

import {getMagicLinkRuntimeConfig, type MagicLinkRuntimeConfig,} from "./get-magic-link-config";
import {
    computeMagicLinkExpiresAt,
    newMagicLinkOpaquePair,
    persistOneGuestMagicLinkToken,
} from "./persist-one-magic-link-token";

export type CreateGuestMagicLinkTokenResult =
    | { ok: true; rawToken: string }
    | { ok: false; kind: "database"; message: string };

/**
 * Allocates a new magic-link token: computes expiry, inserts `guest_magic_link_tokens` (hash only), returns raw token for URLs.
 * Retries once on rare `token_hash` collision (`23505`).
 *
 * @param guestAccountId — Target `guest_accounts.id` (typically the party primary for RSVP confirmation mail).
 */
export async function createGuestMagicLinkToken(
    supabase: SupabaseClient,
    guestAccountId: string,
    config: MagicLinkRuntimeConfig = getMagicLinkRuntimeConfig(),
): Promise<CreateGuestMagicLinkTokenResult> {
    const expiresAt = computeMagicLinkExpiresAt(config);

    for (let attempt = 0; attempt < 2; attempt++) {
        const {rawToken, tokenHash} = newMagicLinkOpaquePair();

        const persisted = await persistOneGuestMagicLinkToken(
            supabase,
            guestAccountId,
            expiresAt,
            rawToken,
            tokenHash,
        );

        if (persisted.ok) {
            return {ok: true, rawToken: persisted.rawToken};
        }

        if (persisted.reason === "duplicate_hash") {
            continue;
        }

        return {
            ok: false,
            kind: "database",
            message: persisted.message,
        };
    }

    return {
        ok: false,
        kind: "database",
        message: "Could not allocate magic link token",
    };
}
