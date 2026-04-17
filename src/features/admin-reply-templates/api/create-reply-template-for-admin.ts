import "server-only";

import type {ReplyTemplateRow} from "@entities/inbound-email";
import {createServerClient} from "@shared/api/supabase/server";

import {ensureSingleDefaultReplyTemplate} from "../lib/ensure-single-default-reply-template";
import {mapReplyTemplateRow} from "../lib/map-reply-template-row";
import {replyTemplateCreateSchema} from "../lib/reply-template-schemas";

export type CreateReplyTemplateForAdminResult =
    | {ok: true; row: ReplyTemplateRow}
    | {ok: false; kind: "validation"; error: string}
    | {ok: false; kind: "database"; message: string}
    | {ok: false; kind: "config"; message: string};

/**
 * Inserts a reply template row. When `is_default` is true, other rows are cleared to a single default.
 */
export async function createReplyTemplateForAdmin(
    body: unknown,
): Promise<CreateReplyTemplateForAdminResult> {
    const parsed = replyTemplateCreateSchema.safeParse(body);
    if (!parsed.success) {
        const msg = parsed.error.issues.map((i) => i.message).join("; ");
        return {ok: false, kind: "validation", error: msg || "Invalid body"};
    }

    const row = parsed.data;

    let supabase;
    try {
        supabase = createServerClient();
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, kind: "config", message};
    }

    const {data, error} = await supabase
        .from("reply_templates")
        .insert({
            name: row.name,
            subject: row.subject,
            heading: row.heading,
            body_html: row.body_html,
            body_text: row.body_text ?? null,
            is_default: row.is_default,
        })
        .select("*")
        .single();

    if (error) {
        return {ok: false, kind: "database", message: error.message};
    }

    if (row.is_default) {
        const cleared = await ensureSingleDefaultReplyTemplate(supabase, String(data.id));
        if (!cleared.ok) {
            return {ok: false, kind: "database", message: cleared.message};
        }
    }

    return {ok: true, row: mapReplyTemplateRow(data as Record<string, unknown>)};
}
