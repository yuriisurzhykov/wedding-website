import "server-only";

import {createServerClient} from "@shared/api/supabase/server";

export type DeleteReplyTemplateForAdminResult =
    | {ok: true}
    | {ok: false; kind: "database"; message: string}
    | {ok: false; kind: "config"; message: string}
    | {ok: false; kind: "not_found"};

/**
 * Deletes a reply template by id. `inbound_email_replies.template_id` is set null by FK.
 */
export async function deleteReplyTemplateForAdmin(
    id: string,
): Promise<DeleteReplyTemplateForAdminResult> {
    let supabase;
    try {
        supabase = createServerClient();
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, kind: "config", message};
    }

    const {data, error} = await supabase
        .from("reply_templates")
        .delete()
        .eq("id", id)
        .select("id");

    if (error) {
        return {ok: false, kind: "database", message: error.message};
    }
    if (!data?.length) {
        return {ok: false, kind: "not_found"};
    }

    return {ok: true};
}
