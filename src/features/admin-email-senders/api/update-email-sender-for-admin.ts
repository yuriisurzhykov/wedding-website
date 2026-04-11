import "server-only";

import type {EmailSenderRow} from "@entities/email-template";
import {createServerClient} from "@shared/api/supabase/server";

import {emailSenderUpdateSchema} from "../lib/email-sender-schemas";

export type UpdateEmailSenderForAdminResult =
    | {ok: true; row: EmailSenderRow}
    | {ok: false; kind: "validation"; error: string}
    | {ok: false; kind: "database"; message: string}
    | {ok: false; kind: "config"; message: string}
    | {ok: false; kind: "not_found"};

/**
 * Partial update by id.
 */
export async function updateEmailSenderForAdmin(
    id: string,
    body: unknown,
): Promise<UpdateEmailSenderForAdminResult> {
    const parsed = emailSenderUpdateSchema.safeParse(body);
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

    const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
    };
    if (patch.label !== undefined) {
        updatePayload.label = patch.label;
    }
    if (patch.mailbox !== undefined) {
        updatePayload.mailbox = patch.mailbox.trim();
    }
    if (patch.display_name !== undefined) {
        updatePayload.display_name = patch.display_name?.trim() || null;
    }

    const {data, error} = await supabase
        .from("email_senders")
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

    return {ok: true, row: data as EmailSenderRow};
}
