import {z} from "zod";

/**
 * Attachment metadata on Resend `email.received` (body bytes are fetched via Received Email / Attachments APIs).
 *
 * @see https://resend.com/docs/webhooks/emails/received
 */
export const resendEmailReceivedAttachmentSchema = z.object({
    id: z.string().uuid(),
    filename: z.string(),
    content_type: z.string(),
    content_disposition: z.string(),
    content_id: z.string().optional(),
});

/**
 * Nested `data` object for `email.received`.
 */
export const resendEmailReceivedDataSchema = z.object({
    email_id: z.string().uuid(),
    created_at: z.string(),
    /** May be a bare address or `Name <addr@domain>`. */
    from: z.string(),
    to: z.array(z.string()).default([]),
    bcc: z.array(z.string()).default([]),
    cc: z.array(z.string()).default([]),
    message_id: z.string(),
    subject: z.string(),
    attachments: z.array(resendEmailReceivedAttachmentSchema).default([]),
    tags: z.record(z.string(), z.string()).optional(),
});

/**
 * Top-level Resend webhook payload for inbound mail (`type` = `email.received`).
 *
 * Webhook bodies omit HTML/text and attachment bytes; callers fetch content via Resend APIs using `data.email_id`.
 */
export const resendEmailReceivedEventSchema = z.object({
    type: z.literal("email.received"),
    created_at: z.string(),
    data: resendEmailReceivedDataSchema,
});

export type ResendEmailReceivedAttachment = z.infer<
    typeof resendEmailReceivedAttachmentSchema
>;
export type ResendEmailReceivedData = z.infer<typeof resendEmailReceivedDataSchema>;
export type ResendEmailReceivedEvent = z.infer<typeof resendEmailReceivedEventSchema>;
