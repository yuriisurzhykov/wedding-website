import "server-only";

import type {SupabaseClient} from "@supabase/supabase-js";

export type MarkMagicLinkTokenUsedResult =
    | { ok: true }
    | { ok: false; message: string };

/**
 * Sets `used_at` for a magic-link row **only if** it was still unused (idempotent-safe for races).
 */
export async function markMagicLinkTokenUsed(
    supabase: SupabaseClient,
    rowId: string,
): Promise<MarkMagicLinkTokenUsedResult> {
    const {error} = await supabase
        .from("guest_magic_link_tokens")
        .update({used_at: new Date().toISOString()})
        .eq("id", rowId)
        .is("used_at", null);

    if (error) {
        return {ok: false, message: error.message};
    }
    return {ok: true};
}
