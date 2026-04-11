import "server-only";

import type {EmailTemplateRow} from "@entities/email-template";
import {createServerClient} from "@shared/api/supabase/server";

import {emailTemplateUpdateSchema} from "../lib/email-template-schemas";

export type UpdateEmailTemplateForAdminResult =
    | {ok: true; row: EmailTemplateRow}
    | {ok: false; kind: "validation"; error: string}
    | {ok: false; kind: "database"; message: string}
    | {ok: false; kind: "config"; message: string}
    | {ok: false; kind: "not_found"};

/**
 * Partial update by id. Empty patch is rejected.
 */
export async function updateEmailTemplateForAdmin(
    id: string,
    body: unknown,
): Promise<UpdateEmailTemplateForAdminResult> {
    const parsed = emailTemplateUpdateSchema.safeParse(body);
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

    const {data, error} = await supabase
        .from("email_templates")
        .update({
            ...patch,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*")
        .maybeSingle();

    if (error) {
        return {ok: false, kind: "database", message: error.message};
    }
    if (!data) {
        return {ok: false, kind: "not_found"};
    }

    return {ok: true, row: data as EmailTemplateRow};
}
