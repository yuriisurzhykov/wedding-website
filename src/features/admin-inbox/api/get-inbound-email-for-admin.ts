import "server-only";

import type {InboundEmailAttachmentRow, InboundEmailRow} from "@entities/inbound-email";
import {createServerClient} from "@shared/api/supabase/server";

type InboundEmailWithAttachmentsRow = InboundEmailRow & {
    inbound_email_attachments: InboundEmailAttachmentRow[] | null;
};

export type GetInboundEmailForAdminResult =
    | {ok: true; email: InboundEmailRow; attachments: InboundEmailAttachmentRow[]}
    | {ok: false; kind: "database"; message: string}
    | {ok: false; kind: "config"; message: string}
    | {ok: false; kind: "not_found"};

/**
 * Loads one inbound message and its attachment rows (service role).
 */
export async function getInboundEmailForAdmin(id: string): Promise<GetInboundEmailForAdminResult> {
    let supabase;
    try {
        supabase = createServerClient();
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, kind: "config", message};
    }

    const {data, error} = await supabase
        .from("inbound_emails")
        .select("*, inbound_email_attachments (*)")
        .eq("id", id)
        .maybeSingle();

    if (error) {
        return {ok: false, kind: "database", message: error.message};
    }
    if (!data) {
        return {ok: false, kind: "not_found"};
    }

    const row = data as InboundEmailWithAttachmentsRow;
    const {
        inbound_email_attachments: embedded,
        ...email
    } = row;

    const attachments = Array.isArray(embedded) ? embedded : [];

    return {
        ok: true,
        email: email as InboundEmailRow,
        attachments,
    };
}
