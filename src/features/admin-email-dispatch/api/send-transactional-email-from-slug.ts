import "server-only";

import {
    formatResendFromLine,
    getEmailSenderByIdForAdmin,
} from "@features/admin-email-senders";
import {getEmailTemplateBySlugForAdmin} from "@features/admin-email-templates";
import {
    createResendClient,
    getResendApiKey,
    getTransactionalFromAddress,
} from "@shared/api/resend";
import {createServerClient} from "@shared/api/supabase/server";

import {applyEmailTemplateString} from "../lib/apply-email-template-string";

export type SendTransactionalEmailFromSlugInput = Readonly<{
    slug: string;
    to: string;
    vars: Partial<Record<string, string>>;
    /** Stored in `email_send_log.segment` (e.g. `transactional:guest-rsvp`). */
    segment: string;
    /**
     * Placeholder keys allowed in `subject_template` / `body_html` / `body_text`.
     * When omitted, uses broadcast keys from `@entities/email-template` (same as admin sends).
     */
    placeholderAllowlist?: readonly string[];
}>;

export type SendTransactionalEmailFromSlugResult =
    | {ok: true; resend_email_id: string | null}
    | {
          ok: false;
          kind:
              | "not_found"
              | "resend_unconfigured"
              | "resend"
              | "sender_not_found"
              | "database"
              | "config";
          message?: string;
      };

/**
 * Loads a template by `slug`, resolves `from` via `sender_id` → verified sender or
 * {@link getTransactionalFromAddress}, substitutes `vars` into subject/HTML/text, sends via Resend,
 * and appends one row to `email_send_log` (including `template_id` and `segment`).
 */
export async function sendTransactionalEmailFromSlug(
    input: SendTransactionalEmailFromSlugInput,
): Promise<SendTransactionalEmailFromSlugResult> {
    const to = input.to.trim();
    if (!to) {
        return {ok: false, kind: "config", message: "Recipient email is empty"};
    }

    const apiKey = getResendApiKey();
    if (!apiKey) {
        return {
            ok: false,
            kind: "resend_unconfigured",
            message: "RESEND_API_KEY is not set",
        };
    }

    const tplResult = await getEmailTemplateBySlugForAdmin(input.slug);
    if (!tplResult.ok) {
        if (tplResult.kind === "not_found") {
            return {ok: false, kind: "not_found"};
        }
        return {
            ok: false,
            kind: tplResult.kind === "config" ? "config" : "database",
            message: tplResult.message,
        };
    }

    const template = tplResult.row;
    const allowlist = input.placeholderAllowlist;

    let from: string;
    if (template.sender_id) {
        const senderResult = await getEmailSenderByIdForAdmin(template.sender_id);
        if (!senderResult.ok) {
            if (senderResult.kind === "not_found") {
                return {ok: false, kind: "sender_not_found"};
            }
            return {
                ok: false,
                kind: senderResult.kind === "config" ? "config" : "database",
                message: senderResult.message,
            };
        }
        from = formatResendFromLine(senderResult.row);
    } else {
        from = getTransactionalFromAddress();
    }

    const subject = applyEmailTemplateString(
        template.subject_template,
        input.vars,
        allowlist,
    );
    const html = applyEmailTemplateString(template.body_html, input.vars, allowlist);
    const textRaw = template.body_text
        ? applyEmailTemplateString(template.body_text, input.vars, allowlist)
        : undefined;

    const resend = createResendClient(apiKey);

    let supabase;
    try {
        supabase = createServerClient();
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, kind: "config", message};
    }

    const {data, error} = await resend.emails.send({
        from,
        to,
        subject,
        html,
        ...(textRaw ? {text: textRaw} : {}),
    });

    async function logSend(args: {
        status: "sent" | "failed";
        resendEmailId: string | null;
        errorMessage: string | null;
    }): Promise<void> {
        const {error: insertError} = await supabase!.from("email_send_log").insert({
            template_id: template.id,
            recipient_email: to,
            subject,
            status: args.status,
            resend_email_id: args.resendEmailId,
            error_message: args.errorMessage,
            segment: input.segment,
            from_address: from,
        });
        if (insertError) {
            console.error(
                "[transactional-email] email_send_log insert failed",
                insertError.message,
            );
        }
    }

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

    return {ok: true, resend_email_id: resendId};
}
