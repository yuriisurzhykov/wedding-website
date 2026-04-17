import "server-only";

import type {EmailSenderRow} from "@entities/email-template";
import {createServerClient} from "@shared/api/supabase/server";

export type GetEmailSenderByMailboxForAdminResult =
    | {ok: true; row: EmailSenderRow}
    | {ok: false; kind: "database" | "config"; message: string}
    | {ok: false; kind: "not_found"};

function normalizeMailbox(value: string): string {
    return value.trim().toLowerCase();
}

/**
 * Finds a sender whose `mailbox` matches `email` (case-insensitive, trimmed).
 * Used when `site_settings.public_contact_sender_id` is unset but the contact email should still resolve to a saved sender.
 */
export async function getEmailSenderByMailboxForAdmin(
    email: string,
): Promise<GetEmailSenderByMailboxForAdminResult> {
    const target = normalizeMailbox(email);
    if (!target) {
        return {ok: false, kind: "not_found"};
    }

    let supabase;
    try {
        supabase = createServerClient();
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, kind: "config", message};
    }

    const {data, error} = await supabase.from("email_senders").select("*");

    if (error) {
        return {ok: false, kind: "database", message: error.message};
    }

    const rows = (data ?? []) as EmailSenderRow[];
    const row = rows.find((r) => normalizeMailbox(r.mailbox) === target);
    if (!row) {
        return {ok: false, kind: "not_found"};
    }

    return {ok: true, row};
}
