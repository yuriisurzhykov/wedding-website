import "server-only";

import {
    formatResendFromLine,
    getEmailSenderByIdForAdmin,
} from "@features/admin-email-senders";
import {getEmailTemplateByIdForAdmin} from "@features/admin-email-templates";
import type {RsvpRow} from "@entities/rsvp";
import {
    createResendClient,
    getResendApiKey,
    getTransactionalFromAddress,
} from "@shared/api/resend";
import {createServerClient} from "@shared/api/supabase/server";

import type {AdminEmailSendInput} from "../lib/admin-email-send-schema";
import {adminEmailSendSchema} from "../lib/admin-email-send-schema";
import {applyEmailTemplateString} from "../lib/apply-email-template-string";
import {buildRsvpPlaceholderVars} from "../lib/build-rsvp-placeholder-vars";
import {getAdminEmailLimits} from "../lib/get-admin-email-limits";

function defaultPlaceholderVars(email: string) {
    return {
        name: "Guest",
        email,
        phone: "",
        guest_count: "1",
        dietary: "",
        message: "",
        attending: "yes",
    } as const;
}

async function sleep(ms: number): Promise<void> {
    await new Promise((r) => setTimeout(r, ms));
}

export type SendAdminEmailResult =
    | {
          ok: true;
          mode: "test" | "broadcast";
          sent: number;
          failed: number;
          capped_total?: number;
      }
    | {ok: false; kind: "validation"; error: string}
    | {ok: false; kind: "not_found"}
    | {ok: false; kind: "sender_not_found"}
    | {ok: false; kind: "resend_unconfigured"; message: string}
    | {ok: false; kind: "database"; message: string}
    | {ok: false; kind: "config"; message: string};

/**
 * Sends a test email or a capped broadcast using a stored template and RSVP placeholders.
 * Logs each attempt to `email_send_log`. Requires `RESEND_API_KEY` and a verified sender (see `@shared/api/resend`).
 */
export async function sendAdminEmail(body: unknown): Promise<SendAdminEmailResult> {
    const parsed = adminEmailSendSchema.safeParse(body);
    if (!parsed.success) {
        const msg = parsed.error.issues.map((i) => i.message).join("; ");
        return {ok: false, kind: "validation", error: msg || "Invalid body"};
    }

    const payload: AdminEmailSendInput = parsed.data;

    const apiKey = getResendApiKey();
    if (!apiKey) {
        return {
            ok: false,
            kind: "resend_unconfigured",
            message: "RESEND_API_KEY is not set",
        };
    }

    const tplResult = await getEmailTemplateByIdForAdmin(payload.template_id);
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
    const limits = getAdminEmailLimits();

    const effectiveSenderId =
        payload.sender_id ?? template.sender_id ?? null;

    let from: string;
    if (effectiveSenderId) {
        const senderResult = await getEmailSenderByIdForAdmin(effectiveSenderId);
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

    const resend = createResendClient(apiKey);

    let supabase;
    try {
        supabase = createServerClient();
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return {ok: false, kind: "config", message};
    }

    async function logSend(args: {
        recipientEmail: string;
        subject: string;
        status: "sent" | "failed";
        resendEmailId: string | null;
        errorMessage: string | null;
        segment: string;
        fromAddress: string;
    }): Promise<void> {
        const {error} = await supabase!.from("email_send_log").insert({
            template_id: template.id,
            recipient_email: args.recipientEmail,
            subject: args.subject,
            status: args.status,
            resend_email_id: args.resendEmailId,
            error_message: args.errorMessage,
            segment: args.segment,
            from_address: args.fromAddress,
        });
        if (error) {
            console.error("[admin-email] email_send_log insert failed", error.message);
        }
    }

    async function sendOne(args: {
        to: string;
        vars: ReturnType<typeof buildRsvpPlaceholderVars> | ReturnType<typeof defaultPlaceholderVars>;
        segmentLabel: string;
    }): Promise<boolean> {
        const subject = applyEmailTemplateString(
            template.subject_template,
            args.vars,
        );
        const html = applyEmailTemplateString(template.body_html, args.vars);
        const textRaw = template.body_text
            ? applyEmailTemplateString(template.body_text, args.vars)
            : undefined;

        const {data, error} = await resend.emails.send({
            from,
            to: args.to,
            subject,
            html,
            ...(textRaw ? {text: textRaw} : {}),
        });

        if (error) {
            await logSend({
                recipientEmail: args.to,
                subject,
                status: "failed",
                resendEmailId: null,
                errorMessage: error.message,
                segment: args.segmentLabel,
                fromAddress: from,
            });
            return false;
        }

        const resendId =
            data && typeof data === "object" && "id" in data && typeof data.id === "string"
                ? data.id
                : null;

        await logSend({
            recipientEmail: args.to,
            subject,
            status: "sent",
            resendEmailId: resendId,
            errorMessage: null,
            segment: args.segmentLabel,
            fromAddress: from,
        });
        return true;
    }

    if (payload.mode === "test") {
        const {data: sample} = await supabase
            .from("rsvp")
            .select("*")
            .not("email", "is", null)
            .limit(1)
            .maybeSingle();

        const vars = sample
            ? buildRsvpPlaceholderVars(sample as RsvpRow)
            : defaultPlaceholderVars(payload.test_email);

        const ok = await sendOne({
            to: payload.test_email,
            vars,
            segmentLabel: "test",
        });
        return {
            ok: true,
            mode: "test",
            sent: ok ? 1 : 0,
            failed: ok ? 0 : 1,
        };
    }

    let query = supabase
        .from("rsvp")
        .select("*")
        .not("email", "is", null);

    if (payload.segment === "attending") {
        query = query.eq("attending", true);
    } else if (payload.segment === "not_attending") {
        query = query.eq("attending", false);
    }

    const {data: rows, error: listError} = await query.order("created_at", {
        ascending: false,
    });

    if (listError) {
        return {ok: false, kind: "database", message: listError.message};
    }

    const all = (rows ?? []) as RsvpRow[];
    const cappedTotal = all.length;
    const batch = all.slice(0, limits.maxBroadcastRecipients);

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < batch.length; i++) {
        const row = batch[i]!;
        const email = row.email?.trim();
        if (!email) {
            continue;
        }
        const vars = buildRsvpPlaceholderVars(row);
        const ok = await sendOne({
            to: email,
            vars,
            segmentLabel: payload.segment,
        });
        if (ok) {
            sent++;
        } else {
            failed++;
        }
        if (i < batch.length - 1 && limits.sendDelayMs > 0) {
            await sleep(limits.sendDelayMs);
        }
    }

    return {
        ok: true,
        mode: "broadcast",
        sent,
        failed,
        ...(cappedTotal > limits.maxBroadcastRecipients
            ? {capped_total: cappedTotal}
            : {}),
    };
}
