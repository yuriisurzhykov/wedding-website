/**
 * Workflow state for rows in `inbound_emails.status` (Postgres check constraint).
 */
export type EmailStatus = "unread" | "read" | "archived";

/**
 * Row shape for `inbound_emails` (service-role access only; RLS enabled, no anon policies).
 */
export type InboundEmailRow = Readonly<{
    id: string;
    /** Idempotency key from the inbound provider (e.g. Resend `email_id` on `email.received`). */
    resend_event_id: string;
    to_address: string;
    from_address: string;
    from_name: string | null;
    subject: string | null;
    html: string | null;
    text: string | null;
    message_id: string | null;
    in_reply_to: string | null;
    /** RFC 5322 `References` header (stored as text). */
    references: string | null;
    status: EmailStatus;
    received_at: string;
    created_at: string;
}>;

/**
 * Row shape for `inbound_email_attachments`.
 */
export type InboundEmailAttachmentRow = Readonly<{
    id: string;
    inbound_email_id: string;
    filename: string;
    content_type: string | null;
    size_bytes: number | null;
    r2_key: string;
    r2_public_url: string | null;
    created_at: string;
}>;

/**
 * Domain alias for a stored inbound message (same fields as {@link InboundEmailRow}).
 */
export type InboundEmail = InboundEmailRow;

/**
 * Domain alias for a stored attachment (same fields as {@link InboundEmailAttachmentRow}).
 */
export type InboundEmailAttachment = InboundEmailAttachmentRow;

/**
 * Canonical RFC 5322-style display of the sender: `Name <addr@host>` when a display
 * name is known, falls back to the bare address otherwise.
 *
 * Used by admin UI and outbound notification emails so that the sender string is
 * formatted identically everywhere the admin sees it.
 */
export function formatSenderDisplay(input: {
    from_name: string | null;
    from_address: string;
}): string {
    const name = input.from_name?.trim();
    const address = input.from_address.trim();
    return name ? `${name} <${address}>` : address;
}
