import "server-only";

import type {
    InboundEmailAttachmentRow,
    InboundEmailReplyRow,
    InboundEmailRow,
} from "@entities/inbound-email";
import {createServerClient} from "@shared/api/supabase/server";

type InboundEmailWithRelationsRow = InboundEmailRow & {
    inbound_email_attachments: InboundEmailAttachmentRow[] | null;
    inbound_email_replies: InboundEmailReplyRow[] | null;
};

export type GetInboundEmailForAdminResult =
    | {
          ok: true;
          email: InboundEmailRow;
          attachments: InboundEmailAttachmentRow[];
          replies: InboundEmailReplyRow[];
      }
    | {ok: false; kind: "database"; message: string}
    | {ok: false; kind: "config"; message: string}
    | {ok: false; kind: "not_found"};

/**
 * Loads one inbound message with its attachments and admin-sent replies (service role).
 * Replies are returned in chronological order (oldest first) for threaded display.
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
        .select(
            "*, inbound_email_attachments (*), inbound_email_replies (*)",
        )
        .eq("id", id)
        .maybeSingle();

    if (error) {
        return {ok: false, kind: "database", message: error.message};
    }
    if (!data) {
        return {ok: false, kind: "not_found"};
    }

    const row = data as InboundEmailWithRelationsRow;
    const {
        inbound_email_attachments: embeddedAtt,
        inbound_email_replies: embeddedRep,
        ...email
    } = row;

    const attachments = Array.isArray(embeddedAtt) ? embeddedAtt : [];
    const replies = Array.isArray(embeddedRep)
        ? [...embeddedRep].sort(
              (a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime(),
          )
        : [];

    return {
        ok: true,
        email: email as InboundEmailRow,
        attachments,
        replies,
    };
}
