import "server-only";

import type {SupabaseClient} from "@supabase/supabase-js";

export type PersistWishResult =
    | { ok: true }
    | { ok: false; message: string };

export async function persistWishRow(
    supabase: SupabaseClient,
    input: {
        authorName: string;
        message: string;
        photoR2Key: string | null;
        photoUrl: string | null;
    },
): Promise<PersistWishResult> {
    const {error} = await supabase.from("wishes").insert({
        author_name: input.authorName,
        message: input.message,
        photo_r2_key: input.photoR2Key,
        photo_url: input.photoUrl,
    });

    if (error) {
        return {ok: false, message: error.message};
    }

    return {ok: true};
}
