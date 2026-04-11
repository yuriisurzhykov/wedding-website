import "server-only";

import {createServerClient} from "@shared/api/supabase/server";

export type DeleteEmailTemplateForAdminResult =
    | {ok: true}
    | {ok: false; kind: "database"; message: string}
    | {ok: false; kind: "config"; message: string}
    | {ok: false; kind: "not_found"};

/**
 * Deletes a template by id. Send log rows keep `template_id` null (FK).
 */
export async function deleteEmailTemplateForAdmin(
    id: string,
): Promise<DeleteEmailTemplateForAdminResult> {
    let supabase;
    try {
        supabase = createServerClient();
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, kind: "config", message};
    }

    const {data, error} = await supabase
        .from("email_templates")
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
