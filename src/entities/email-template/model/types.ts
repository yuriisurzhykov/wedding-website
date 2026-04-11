/**
 * Saved "From" identity for admin sends (`email_senders`). Must use a mailbox/domain verified in Resend.
 */
export type EmailSenderRow = Readonly<{
    id: string;
    label: string;
    mailbox: string;
    display_name: string | null;
    created_at: string;
    updated_at: string;
}>;

/**
 * Row shape for `email_templates` (admin-managed HTML/text templates).
 */
export type EmailTemplateRow = Readonly<{
    id: string;
    slug: string;
    name: string;
    subject_template: string;
    body_html: string;
    body_text: string | null;
    /** Saved sender (`email_senders`); omit or null → use `RESEND_FROM_EMAIL` at send time. */
    sender_id?: string | null;
    created_at: string;
    updated_at: string;
}>;

/**
 * Row shape for `email_send_log` (per-recipient result after a send attempt).
 */
export type EmailSendLogRow = Readonly<{
    id: string;
    template_id: string | null;
    recipient_email: string;
    subject: string;
    status: "sent" | "failed";
    resend_email_id: string | null;
    error_message: string | null;
    segment: string | null;
    from_address: string | null;
    created_at: string;
}>;
