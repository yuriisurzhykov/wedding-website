import "server-only";

import type {EmailTemplateRow} from "@entities/email-template";
import {createServerClient} from "@shared/api/supabase/server";

export type ListEmailTemplatesForAdminResult =
    | {ok: true; rows: EmailTemplateRow[]}
    | {ok: false; kind: "config" | "database"; message: string};

/**
 * Lists email templates (newest first). Call only after admin auth + rate limit in HTTP handlers.
 */
export async function listEmailTemplatesForAdmin(): Promise<ListEmailTemplatesForAdminResult> {
    let supabase;
    try {
        supabase = createServerClient();
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, kind: "config", message};
    }

    const {data, error} = await supabase
        .from("email_templates")
        .select("*")
        .order("created_at", {ascending: false});

    if (error) {
        return {ok: false, kind: "database", message: error.message};
    }

    return {ok: true, rows: (data ?? []) as EmailTemplateRow[]};
}
