import "server-only";

import type {EmailTemplateRow} from "@entities/email-template";
import {createServerClient} from "@shared/api/supabase/server";

import {emailTemplateCreateSchema} from "../lib/email-template-schemas";

export type CreateEmailTemplateForAdminResult =
    | {ok: true; row: EmailTemplateRow}
    | {ok: false; kind: "validation"; error: string}
    | {ok: false; kind: "database"; message: string}
    | {ok: false; kind: "config"; message: string};

/**
 * Inserts a template row. Unique `slug` violations surface as database errors.
 */
export async function createEmailTemplateForAdmin(
    body: unknown,
): Promise<CreateEmailTemplateForAdminResult> {
    const parsed = emailTemplateCreateSchema.safeParse(body);
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
        .from("email_templates")
        .insert({
            slug: row.slug,
            name: row.name,
            subject_template: row.subject_template,
            body_html: row.body_html,
            body_text: row.body_text ?? null,
            sender_id: row.sender_id ?? null,
        })
        .select("*")
        .single();

    if (error) {
        return {ok: false, kind: "database", message: error.message};
    }

    return {ok: true, row: data as EmailTemplateRow};
}
