import "server-only";

import type {EmailSenderRow} from "@entities/email-template";
import {createServerClient} from "@shared/api/supabase/server";

export type ListEmailSendersForAdminResult =
    | {ok: true; rows: EmailSenderRow[]}
    | {ok: false; kind: "config" | "database"; message: string};

/**
 * Lists saved sender identities (label order). Call only after admin auth + rate limit.
 */
export async function listEmailSendersForAdmin(): Promise<ListEmailSendersForAdminResult> {
    let supabase;
    try {
        supabase = createServerClient();
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, kind: "config", message};
    }

    const {data, error} = await supabase
        .from("email_senders")
        .select("*")
        .order("label", {ascending: true});

    if (error) {
        return {ok: false, kind: "database", message: error.message};
    }

    return {ok: true, rows: (data ?? []) as EmailSenderRow[]};
}
