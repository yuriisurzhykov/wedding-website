import "server-only";

import type {EmailSenderRow} from "@entities/email-template";
import {createServerClient} from "@shared/api/supabase/server";

import {emailSenderCreateSchema} from "../lib/email-sender-schemas";

export type CreateEmailSenderForAdminResult =
    | {ok: true; row: EmailSenderRow}
    | {ok: false; kind: "validation"; error: string}
    | {ok: false; kind: "database"; message: string}
    | {ok: false; kind: "config"; message: string};

/**
 * Inserts a sender identity row.
 */
export async function createEmailSenderForAdmin(
    body: unknown,
): Promise<CreateEmailSenderForAdminResult> {
    const parsed = emailSenderCreateSchema.safeParse(body);
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
        .from("email_senders")
        .insert({
            label: row.label,
            mailbox: row.mailbox.trim(),
            display_name: row.display_name?.trim() || null,
        })
        .select("*")
        .single();

    if (error) {
        return {ok: false, kind: "database", message: error.message};
    }

    return {ok: true, row: data as EmailSenderRow};
}
