import "server-only";

import {createServerClient} from "@shared/api/supabase/server";

export type DeleteEmailSenderForAdminResult =
    | {ok: true}
    | {ok: false; kind: "database"; message: string}
    | {ok: false; kind: "config"; message: string}
    | {ok: false; kind: "not_found"};

/**
 * Deletes a sender. Templates referencing it clear `sender_id` (FK).
 */
export async function deleteEmailSenderForAdmin(
    id: string,
): Promise<DeleteEmailSenderForAdminResult> {
    let supabase;
    try {
        supabase = createServerClient();
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, kind: "config", message};
    }

    const {data, error} = await supabase
        .from("email_senders")
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
