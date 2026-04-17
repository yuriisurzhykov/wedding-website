import "server-only";

import {z} from "zod";

import {getResendApiKey} from "@shared/api/resend";

const resendReceivedAttachmentRowSchema = z.object({
    id: z.string().uuid(),
    filename: z.string(),
    size: z.number().optional(),
    content_type: z.string().nullable().optional(),
    content_disposition: z.string().nullable().optional(),
    content_id: z.string().nullable().optional(),
    download_url: z.string().url(),
    expires_at: z.string(),
});

const resendAttachmentListSchema = z.object({
    object: z.literal("list"),
    data: z.array(resendReceivedAttachmentRowSchema),
});

const resendReceivedEmailSchema = z.object({
    object: z.literal("email"),
    id: z.string().uuid(),
    to: z.array(z.string()),
    from: z.string(),
    created_at: z.string(),
    subject: z.string().nullable().optional(),
    html: z.string().nullable().optional(),
    text: z.string().nullable().optional(),
    message_id: z.string().nullable().optional(),
    headers: z.record(z.string(), z.string()).optional(),
    bcc: z.array(z.string()).optional(),
    cc: z.array(z.string()).optional(),
});

export type ResendReceivedEmailPayload = z.infer<typeof resendReceivedEmailSchema>;
export type ResendReceivedAttachmentRow = z.infer<typeof resendReceivedAttachmentRowSchema>;

async function resendFetchJson<T>(
    path: string,
    schema: z.ZodType<T>,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
    const apiKey = getResendApiKey();
    if (!apiKey) {
        return {ok: false, error: "RESEND_API_KEY is not set"};
    }
    const res = await fetch(`https://api.resend.com${path}`, {
        headers: {Authorization: `Bearer ${apiKey}`},
    });
    const raw: unknown = await res.json().catch(() => null);
    if (!res.ok) {
        const msg =
            raw && typeof raw === "object" && "message" in raw
                ? String((raw as {message?: unknown}).message ?? res.statusText)
                : res.statusText;
        return {ok: false, error: `Resend ${res.status}: ${msg}`};
    }
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
        return {ok: false, error: "Unexpected Resend response shape"};
    }
    return {ok: true, data: parsed.data};
}

/**
 * Loads HTML/text and headers for a received email id (after `email.received` webhook).
 */
export async function fetchResendReceivedEmail(
    emailId: string,
): Promise<
    | { ok: true; email: ResendReceivedEmailPayload }
    | { ok: false; error: string }
> {
    const result = await resendFetchJson(
        `/emails/receiving/${emailId}`,
        resendReceivedEmailSchema,
    );
    if (!result.ok) {
        return result;
    }
    return {ok: true, email: result.data};
}

/**
 * Lists attachments with time-limited download URLs for a received email.
 */
export async function fetchResendReceivedAttachmentList(
    emailId: string,
): Promise<
    | { ok: true; attachments: ResendReceivedAttachmentRow[] }
    | { ok: false; error: string }
> {
    const result = await resendFetchJson(
        `/emails/receiving/${emailId}/attachments`,
        resendAttachmentListSchema,
    );
    if (!result.ok) {
        return result;
    }
    return {ok: true, attachments: result.data.data};
}
