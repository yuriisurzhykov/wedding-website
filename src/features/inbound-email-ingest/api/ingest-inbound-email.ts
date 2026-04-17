import "server-only";

import {
    resendEmailReceivedEventSchema,
    type EmailStatus,
} from "@entities/inbound-email";
import {createServerClient} from "@shared/api/supabase/server";

import {
    fetchResendReceivedAttachmentList,
    fetchResendReceivedEmail,
} from "../lib/fetch-resend-received-email";
import {mailHeaderLookup} from "../lib/mail-header-lookup";
import {notifyAdminOfInboundEmail} from "../lib/notify-admin-of-inbound";
import {parseRfc5322From} from "../lib/parse-rfc5322-from";
import {persistInboundAttachmentsToR2} from "../lib/persist-attachments-to-r2";
import {readSvixHeaders, verifySvixSignature} from "../lib/verify-svix-signature";

function normalizeMailbox(emailish: string): string {
    const m = emailish.match(/<([^>]+)>/);
    const raw = (m?.[1] ?? emailish).trim();
    return raw.toLowerCase();
}

function pickToAddressForFilter(
    toList: string[],
    filterNorm: string,
): string | null {
    for (const line of toList) {
        if (normalizeMailbox(line) === filterNorm) {
            const parsed = parseRfc5322From(line);
            return parsed.address;
        }
    }
    return null;
}

async function loadWebhookSubscriptionRow(supabase: ReturnType<typeof createServerClient>): Promise<{
    signing_secret: string | null;
    filter_email: string | null;
}> {
    const {data, error} = await supabase
        .from("resend_webhook_subscription")
        .select("signing_secret, filter_email")
        .eq("id", "default")
        .maybeSingle();

    if (error) {
        throw new Error(error.message);
    }
    return {
        signing_secret: data?.signing_secret ?? null,
        filter_email: data?.filter_email?.trim() ?? null,
    };
}

function resolveSigningSecret(rowSecret: string | null): string | undefined {
    const fromDb = rowSecret?.trim();
    if (fromDb) {
        return fromDb;
    }
    return process.env.RESEND_WEBHOOK_SIGNING_SECRET?.trim();
}

export type IngestInboundEmailResult =
    | { ok: true; kind: "stored"; id: string }
    | { ok: true; kind: "duplicate" }
    | {
          ok: true;
          kind: "skipped";
          reason: "allowlist" | "filter_unconfigured";
      }
    | { ok: false; kind: "signature" }
    | { ok: false; kind: "invalid_json" }
    | { ok: false; kind: "validation"; message: string }
    | { ok: false; kind: "config"; message: string }
    | { ok: false; kind: "database"; message: string }
    | { ok: false; kind: "resend_api"; message: string };

/**
 * Verifies Svix, validates the webhook payload, enforces the contact-email allow-list, persists the row and
 * attachments, then notifies the admin (async). Intended for `POST /api/webhooks/resend/inbound`.
 *
 * @param rawBody — Raw request body (exact bytes as string).
 * @param headers — Incoming request headers (Svix + any).
 * @param request — Optional; improves absolute admin links in the notification email.
 */
export async function ingestInboundEmail(input: {
    rawBody: string;
    headers: Headers;
    request?: Request;
}): Promise<IngestInboundEmailResult> {
    let supabase: ReturnType<typeof createServerClient>;
    try {
        supabase = createServerClient();
    } catch (e) {
        const msg = e instanceof Error ? e.message : "Supabase unavailable";
        return {ok: false, kind: "config", message: msg};
    }

    const svix = readSvixHeaders(input.headers);
    if (!svix) {
        return {ok: false, kind: "signature"};
    }

    let sub: Awaited<ReturnType<typeof loadWebhookSubscriptionRow>>;
    try {
        sub = await loadWebhookSubscriptionRow(supabase);
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return {ok: false, kind: "database", message: msg};
    }

    const secret = resolveSigningSecret(sub.signing_secret);
    if (!secret) {
        return {ok: false, kind: "signature"};
    }

    const verified = verifySvixSignature({
        rawBody: input.rawBody,
        svixId: svix.id,
        svixTimestamp: svix.timestamp,
        svixSignature: svix.signature,
        secret,
    });
    if (!verified) {
        return {ok: false, kind: "signature"};
    }

    let parsedJson: unknown;
    try {
        parsedJson = JSON.parse(input.rawBody) as unknown;
    } catch {
        return {ok: false, kind: "invalid_json"};
    }

    const parsed = resendEmailReceivedEventSchema.safeParse(parsedJson);
    if (!parsed.success) {
        const message = parsed.error.issues.map((i) => i.message).join("; ");
        return {ok: false, kind: "validation", message: message || "Invalid payload"};
    }

    const event = parsed.data;
    const emailId = event.data.email_id;

    const {data: existing, error: existingErr} = await supabase
        .from("inbound_emails")
        .select("id")
        .eq("resend_event_id", emailId)
        .maybeSingle();

    if (existingErr) {
        return {ok: false, kind: "database", message: existingErr.message};
    }
    if (existing) {
        return {ok: true, kind: "duplicate"};
    }

    const filterRaw = sub.filter_email;
    if (!filterRaw) {
        console.warn(
            "[inbound-email-ingest] skip: resend_webhook_subscription.filter_email is empty",
        );
        return {ok: true, kind: "skipped", reason: "filter_unconfigured"};
    }

    const filterNorm = filterRaw.toLowerCase();
    const toAddress = pickToAddressForFilter(event.data.to, filterNorm);
    if (!toAddress) {
        return {ok: true, kind: "skipped", reason: "allowlist"};
    }

    const full = await fetchResendReceivedEmail(emailId);
    if (!full.ok) {
        return {ok: false, kind: "resend_api", message: full.error};
    }

    const fromParsed = parseRfc5322From(full.email.from);
    const status: EmailStatus = "unread";

    const insertRow = {
        resend_event_id: emailId,
        to_address: toAddress,
        from_address: fromParsed.address,
        from_name: fromParsed.name,
        subject: full.email.subject ?? event.data.subject ?? null,
        html: full.email.html ?? null,
        text: full.email.text ?? null,
        message_id: full.email.message_id ?? event.data.message_id ?? null,
        in_reply_to: mailHeaderLookup(full.email.headers, "In-Reply-To"),
        references: mailHeaderLookup(full.email.headers, "References"),
        status,
        received_at: event.data.created_at,
    };

    const {data: inserted, error: insertErr} = await supabase
        .from("inbound_emails")
        .insert(insertRow)
        .select("id")
        .single();

    if (insertErr) {
        return {ok: false, kind: "database", message: insertErr.message};
    }

    const rowId = inserted.id as string;

    try {
        const attList = await fetchResendReceivedAttachmentList(emailId);
        if (!attList.ok) {
            throw new Error(attList.error);
        }

        const persisted = await persistInboundAttachmentsToR2({
            inboundEmailId: rowId,
            rows: attList.attachments,
        });

        if (persisted.length > 0) {
            const attRows = persisted.map((a) => ({
                inbound_email_id: rowId,
                filename: a.filename,
                content_type: a.content_type,
                size_bytes: a.size_bytes,
                r2_key: a.r2_key,
                r2_public_url: a.r2_public_url,
            }));

            const {error: attErr} = await supabase
                .from("inbound_email_attachments")
                .insert(attRows);

            if (attErr) {
                throw new Error(attErr.message);
            }
        }
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[inbound-email-ingest] rollback after failure: ${msg}`);
        await supabase.from("inbound_emails").delete().eq("id", rowId);
        return {ok: false, kind: "database", message: msg};
    }

    const senderLabel = fromParsed.name ?? fromParsed.address;
    void notifyAdminOfInboundEmail({
        inboundEmailId: rowId,
        senderLabel,
        request: input.request,
    }).catch((err) => {
        console.error(
            "[inbound-email-ingest] admin notify failed:",
            err instanceof Error ? err.message : err,
        );
    });

    return {ok: true, kind: "stored", id: rowId};
}
