import "server-only";

import type {InboundEmailRow, ReplyTemplateRow} from "@entities/inbound-email";
import {getSiteSettings} from "@features/site-settings";
import {
    createResendClient,
    getResendApiKey,
    getTransactionalFromAddress,
} from "@shared/api/resend";
import {createServerClient} from "@shared/api/supabase/server";
import {escapeHtml} from "@shared/lib/html-escape";

import {applyReplyTemplateVariables} from "../lib/apply-template-variables";
import {buildInboundReplyThreadHeaders} from "../lib/build-inbound-reply-thread-headers";
import {buildReplyEmailPlainText} from "../lib/build-reply-plain-text";
import {deriveSenderDisplayName} from "../lib/derive-sender-display-name";
import {renderReplyEmailHtml} from "../lib/render-reply-email";
import {sanitizeReplyBodyHtml} from "../lib/sanitize-reply-body-html";
import {sendInboxReplyBodySchema} from "../lib/send-inbox-reply-schema";

export type SendInboxReplyResult =
    | {ok: true; reply_id: string; resend_email_id: string | null}
    | {
          ok: false;
          kind:
              | "validation"
              | "not_found"
              | "config"
              | "database"
              | "resend";
          message?: string;
      };

const LOG_SEGMENT = "inbound-reply";

function parseRecipientEmail(fromAddress: string): string {
    const trimmed = fromAddress.trim();
    const angle = trimmed.match(/^(.+?)\s*<([^>]+)>\s*$/);
    return angle ? angle[2].trim() : trimmed;
}

/**
 * Sends an admin reply for a stored inbound message: merges optional `reply_templates` placeholders,
 * renders HTML with the wedding transactional theme, sends via Resend with threading headers,
 * writes `inbound_email_replies` and `email_send_log`.
 *
 * Call only from trusted admin API routes (service-role Supabase + auth already enforced).
 */
export async function sendInboxReply(
    raw: unknown,
): Promise<SendInboxReplyResult> {
    const parsed = sendInboxReplyBodySchema.safeParse(raw);
    if (!parsed.success) {
        return {
            ok: false,
            kind: "validation",
            message: parsed.error.message,
        };
    }
    const input = parsed.data;

    let supabase;
    try {
        supabase = createServerClient();
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, kind: "config", message};
    }

    const {data: inbound, error: inboundError} = await supabase
        .from("inbound_emails")
        .select("*")
        .eq("id", input.inbound_email_id)
        .maybeSingle();

    if (inboundError) {
        return {
            ok: false,
            kind: "database",
            message: inboundError.message,
        };
    }
    if (!inbound) {
        return {ok: false, kind: "not_found", message: "Inbound message not found"};
    }

    const inboundRow = inbound as InboundEmailRow;

    let templateRow: ReplyTemplateRow | null = null;
    if (input.template_id) {
        const {data: tpl, error: tplError} = await supabase
            .from("reply_templates")
            .select(
                "id, name, subject, heading, body_html, body_text, is_default, created_at, updated_at",
            )
            .eq("id", input.template_id)
            .maybeSingle();
        if (tplError) {
            return {
                ok: false,
                kind: "database",
                message: tplError.message,
            };
        }
        if (!tpl) {
            return {
                ok: false,
                kind: "not_found",
                message: "Reply template not found",
            };
        }
        templateRow = tpl as ReplyTemplateRow;
    }

    const senderName = escapeHtml(deriveSenderDisplayName(inboundRow));
    const headingVar = escapeHtml(input.heading.trim());
    const bodyVar = sanitizeReplyBodyHtml(input.body_html);

    const vars = {
        senderName,
        heading: headingVar,
        body: bodyVar,
    };

    let subjectFinal: string;
    let headingHtml: string;
    let bodyHtml: string;

    if (templateRow) {
        subjectFinal = applyReplyTemplateVariables(
            templateRow.subject,
            vars,
        ).trim();
        headingHtml = applyReplyTemplateVariables(templateRow.heading, vars);
        bodyHtml = applyReplyTemplateVariables(templateRow.body_html, vars);
    } else {
        subjectFinal = input.subject!.trim();
        headingHtml = escapeHtml(input.heading.trim());
        bodyHtml = bodyVar;
    }

    if (!subjectFinal) {
        return {
            ok: false,
            kind: "validation",
            message: "Resolved subject is empty",
        };
    }

    const settings = await getSiteSettings();
    const replyTo = settings.public_contact.email.trim();
    if (!replyTo) {
        return {
            ok: false,
            kind: "config",
            message: "public_contact email is not configured",
        };
    }

    const apiKey = getResendApiKey();
    if (!apiKey) {
        return {
            ok: false,
            kind: "config",
            message: "RESEND_API_KEY is not set",
        };
    }

    const from = getTransactionalFromAddress();
    const to = parseRecipientEmail(inboundRow.from_address);
    if (!to) {
        return {
            ok: false,
            kind: "config",
            message: "Inbound from address is empty",
        };
    }

    const fullHtml = renderReplyEmailHtml({
        headingHtml,
        bodyHtml,
        documentTitle: subjectFinal,
    });
    const plainText = buildReplyEmailPlainText(headingHtml, bodyHtml);

    const threadHeaders = buildInboundReplyThreadHeaders(inboundRow);

    const resend = createResendClient(apiKey);

    async function logSend(args: {
        status: "sent" | "failed";
        resendEmailId: string | null;
        errorMessage: string | null;
    }): Promise<void> {
        const {error: insertError} = await supabase!.from("email_send_log").insert({
            template_id: null,
            recipient_email: to,
            subject: subjectFinal,
            status: args.status,
            resend_email_id: args.resendEmailId,
            error_message: args.errorMessage,
            segment: LOG_SEGMENT,
            from_address: from,
        });
        if (insertError) {
            console.error(
                "[admin-inbox-reply] email_send_log insert failed",
                insertError.message,
            );
        }
    }

    const {data, error} = await resend.emails.send({
        from,
        to: [to],
        subject: subjectFinal,
        html: fullHtml,
        text: plainText,
        replyTo: [replyTo],
        ...(threadHeaders ? {headers: threadHeaders} : {}),
    });

    if (error) {
        await logSend({
            status: "failed",
            resendEmailId: null,
            errorMessage: error.message,
        });
        return {ok: false, kind: "resend", message: error.message};
    }

    const resendId =
        data && typeof data === "object" && "id" in data && typeof data.id === "string"
            ? data.id
            : null;

    await logSend({
        status: "sent",
        resendEmailId: resendId,
        errorMessage: null,
    });

    const {data: replyRow, error: replyInsError} = await supabase
        .from("inbound_email_replies")
        .insert({
            inbound_email_id: inboundRow.id,
            to_address: to,
            subject: subjectFinal,
            html: fullHtml,
            text: plainText,
            resend_email_id: resendId,
            from_address: from,
            template_id: input.template_id ?? null,
        })
        .select("id")
        .single();

    if (replyInsError || !replyRow) {
        console.error(
            "[admin-inbox-reply] inbound_email_replies insert failed after send",
            replyInsError?.message,
        );
        return {
            ok: false,
            kind: "database",
            message: replyInsError?.message ?? "Failed to store reply row",
        };
    }

    return {
        ok: true,
        reply_id: replyRow.id as string,
        resend_email_id: resendId,
    };
}
