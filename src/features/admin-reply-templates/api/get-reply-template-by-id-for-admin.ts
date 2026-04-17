import "server-only";

import type {ReplyTemplateRow} from "@entities/inbound-email";
import {createServerClient} from "@shared/api/supabase/server";

import {mapReplyTemplateRow} from "../lib/map-reply-template-row";

export type GetReplyTemplateByIdForAdminResult =
    | {ok: true; row: ReplyTemplateRow}
    | {ok: false; kind: "database"; message: string}
    | {ok: false; kind: "config"; message: string}
    | {ok: false; kind: "not_found"};

/**
 * Loads one reply template by id (admin UI / send flow).
 */
export async function getReplyTemplateByIdForAdmin(
    id: string,
): Promise<GetReplyTemplateByIdForAdminResult> {
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
        .eq("id", id)
        .maybeSingle();

    if (error) {
        return {ok: false, kind: "database", message: error.message};
    }
    if (!data) {
        return {ok: false, kind: "not_found"};
    }

    return {ok: true, row: mapReplyTemplateRow(data as Record<string, unknown>)};
}
