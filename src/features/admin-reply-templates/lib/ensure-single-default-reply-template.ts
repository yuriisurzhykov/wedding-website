import type {SupabaseClient} from "@supabase/supabase-js";

/**
 * After insert/update marks `id` as default, clears `is_default` on all other rows.
 */
export async function ensureSingleDefaultReplyTemplate(
    supabase: SupabaseClient,
    keepId: string,
): Promise<{ok: true} | {ok: false; message: string}> {
    const {error} = await supabase
        .from("reply_templates")
        .update({is_default: false})
        .neq("id", keepId);

    if (error) {
        return {ok: false, message: error.message};
    }
    return {ok: true};
}
