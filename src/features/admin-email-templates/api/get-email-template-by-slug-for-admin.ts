import "server-only";

import type {EmailTemplateRow} from "@entities/email-template";
import {createServerClient} from "@shared/api/supabase/server";

export type GetEmailTemplateBySlugForAdminResult =
    | {ok: true; row: EmailTemplateRow}
    | {ok: false; kind: "database"; message: string}
    | {ok: false; kind: "config"; message: string}
    | {ok: false; kind: "not_found"};

/**
 * Loads one template by slug (e.g. transactional sends keyed by reserved slug).
 */
export async function getEmailTemplateBySlugForAdmin(
    slug: string,
): Promise<GetEmailTemplateBySlugForAdminResult> {
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
        .eq("slug", slug)
        .maybeSingle();

    if (error) {
        return {ok: false, kind: "database", message: error.message};
    }
    if (!data) {
        return {ok: false, kind: "not_found"};
    }

    return {ok: true, row: data as EmailTemplateRow};
}
