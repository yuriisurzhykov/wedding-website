import "server-only";

import type {EmailSenderRow} from "@entities/email-template";
import {createServerClient} from "@shared/api/supabase/server";

export type GetEmailSenderByIdForAdminResult =
    | {ok: true; row: EmailSenderRow}
    | {ok: false; kind: "database"; message: string}
    | {ok: false; kind: "config"; message: string}
    | {ok: false; kind: "not_found"};

/**
 * Loads one sender row by id (for Resend `from` resolution).
 */
export async function getEmailSenderByIdForAdmin(
    id: string,
): Promise<GetEmailSenderByIdForAdminResult> {
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
        .eq("id", id)
        .maybeSingle();

    if (error) {
        return {ok: false, kind: "database", message: error.message};
    }
    if (!data) {
        return {ok: false, kind: "not_found"};
    }

    return {ok: true, row: data as EmailSenderRow};
}
