import "server-only";

import type {ReplyTemplateRow} from "@entities/inbound-email";
import {createServerClient} from "@shared/api/supabase/server";

import {mapReplyTemplateRow} from "../lib/map-reply-template-row";

export type ListReplyTemplatesForAdminResult =
    | {ok: true; rows: ReplyTemplateRow[]}
    | {ok: false; kind: "config" | "database"; message: string};

/**
 * Lists reply templates (newest first). Call only after admin auth + rate limit in HTTP handlers.
 */
export async function listReplyTemplatesForAdmin(): Promise<ListReplyTemplatesForAdminResult> {
    let supabase;
    try {
        supabase = createServerClient();
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, kind: "config", message};
    }

    const {data, error} = await supabase
        .from("reply_templates")
        .select("*")
        .order("created_at", {ascending: false});

    if (error) {
        return {ok: false, kind: "database", message: error.message};
    }

    const rows = (data ?? []).map((r) => mapReplyTemplateRow(r as Record<string, unknown>));
    return {ok: true, rows};
}
