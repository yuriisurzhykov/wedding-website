import "server-only";

import type {ReplyTemplateRow} from "@entities/inbound-email";
import {createServerClient} from "@shared/api/supabase/server";

import {ensureSingleDefaultReplyTemplate} from "../lib/ensure-single-default-reply-template";
import {mapReplyTemplateRow} from "../lib/map-reply-template-row";
import {replyTemplateUpdateSchema} from "../lib/reply-template-schemas";

export type UpdateReplyTemplateForAdminResult =
    | {ok: true; row: ReplyTemplateRow}
    | {ok: false; kind: "validation"; error: string}
    | {ok: false; kind: "database"; message: string}
    | {ok: false; kind: "config"; message: string}
    | {ok: false; kind: "not_found"};

/**
 * Partial update by id. Empty patch is rejected. Setting `is_default` true clears other defaults.
 */
export async function updateReplyTemplateForAdmin(
    id: string,
    body: unknown,
): Promise<UpdateReplyTemplateForAdminResult> {
    const parsed = replyTemplateUpdateSchema.safeParse(body);
    if (!parsed.success) {
        const msg = parsed.error.issues.map((i) => i.message).join("; ");
        return {ok: false, kind: "validation", error: msg || "Invalid body"};
    }

    const patch = parsed.data;
    if (Object.keys(patch).length === 0) {
        return {ok: false, kind: "validation", error: "No fields to update"};
    }

    let supabase;
    try {
        supabase = createServerClient();
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, kind: "config", message};
    }

    const updatePayload = Object.fromEntries(
        Object.entries({
            ...patch,
            updated_at: new Date().toISOString(),
        }).filter(([, v]) => v !== undefined),
    );

    const {data, error} = await supabase
        .from("reply_templates")
        .update(updatePayload)
        .eq("id", id)
        .select("*")
        .maybeSingle();

    if (error) {
        return {ok: false, kind: "database", message: error.message};
    }
    if (!data) {
        return {ok: false, kind: "not_found"};
    }

    if (patch.is_default === true) {
        const cleared = await ensureSingleDefaultReplyTemplate(supabase, id);
        if (!cleared.ok) {
            return {ok: false, kind: "database", message: cleared.message};
        }
    }

    return {ok: true, row: mapReplyTemplateRow(data as Record<string, unknown>)};
}
