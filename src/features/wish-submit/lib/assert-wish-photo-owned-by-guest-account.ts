import "server-only";

import type {SupabaseClient} from "@supabase/supabase-js";

/**
 * Ensures a wish attachment key refers to a `photos` row uploaded by the same guest account
 * (prevents attaching another guest’s R2 key).
 */
export async function assertWishPhotoOwnedByGuestAccount(
    supabase: SupabaseClient,
    r2Key: string,
    guestAccountId: string,
): Promise<
    | { ok: true }
    | { ok: false; reason: "not_owned" }
    | { ok: false; reason: "query"; message: string }
> {
    const {data, error} = await supabase
        .from("photos")
        .select("id")
        .eq("r2_key", r2Key)
        .eq("guest_account_id", guestAccountId)
        .maybeSingle();

    if (error) {
        return {ok: false, reason: "query", message: error.message};
    }
    if (!data) {
        return {ok: false, reason: "not_owned"};
    }
    return {ok: true};
}
