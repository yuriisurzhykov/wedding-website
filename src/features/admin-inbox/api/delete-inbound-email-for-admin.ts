import "server-only";

import {deleteR2Object} from "@shared/api/r2";
import {createServerClient} from "@shared/api/supabase/server";

export type DeleteInboundEmailForAdminResult =
    | {ok: true}
    | {ok: false; kind: "database"; message: string}
    | {ok: false; kind: "config"; message: string}
    | {ok: false; kind: "not_found"};

/**
 * Deletes one inbound message (cascades attachment rows). Best-effort R2 deletes for stored keys.
 */
export async function deleteInboundEmailForAdmin(
    id: string,
): Promise<DeleteInboundEmailForAdminResult> {
    let supabase;
    try {
        supabase = createServerClient();
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, kind: "config", message};
    }

    const {data: attachmentRows, error: attachError} = await supabase
        .from("inbound_email_attachments")
        .select("r2_key")
        .eq("inbound_email_id", id);

    if (attachError) {
        return {ok: false, kind: "database", message: attachError.message};
    }

    const {data: deleted, error: deleteError} = await supabase
        .from("inbound_emails")
        .delete()
        .eq("id", id)
        .select("id");

    if (deleteError) {
        return {ok: false, kind: "database", message: deleteError.message};
    }
    if (!deleted?.length) {
        return {ok: false, kind: "not_found"};
    }

    for (const row of attachmentRows ?? []) {
        const key = row.r2_key as string;
        if (!key) {
            continue;
        }
        const r2Result = await deleteR2Object(key);
        if (!r2Result.ok) {
            console.error(
                "[admin-inbox] R2 delete failed after inbound email removed",
                key,
                r2Result.message,
            );
        }
    }

    return {ok: true};
}
