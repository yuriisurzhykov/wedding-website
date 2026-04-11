import "server-only";

import type {EmailSendLogRow} from "@entities/email-template";
import {createServerClient} from "@shared/api/supabase/server";

export type ListEmailSendLogForAdminOptions = Readonly<{
    limit?: number;
}>;

export type ListEmailSendLogForAdminResult =
    | {ok: true; rows: EmailSendLogRow[]}
    | {ok: false; kind: "config" | "database"; message: string};

const DEFAULT_LIMIT = 80;
const MAX_LIMIT = 200;

/**
 * Recent send attempts (newest first).
 */
export async function listEmailSendLogForAdmin(
    options?: ListEmailSendLogForAdminOptions,
): Promise<ListEmailSendLogForAdminResult> {
    let supabase;
    try {
        supabase = createServerClient();
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, kind: "config", message};
    }

    const raw = options?.limit ?? DEFAULT_LIMIT;
    const limit = Math.min(MAX_LIMIT, Math.max(1, raw));

    const {data, error} = await supabase
        .from("email_send_log")
        .select("*")
        .order("created_at", {ascending: false})
        .limit(limit);

    if (error) {
        return {ok: false, kind: "database", message: error.message};
    }

    return {ok: true, rows: (data ?? []) as EmailSendLogRow[]};
}
