import type {EmailSenderRow} from "@entities/email-template";

/**
 * Builds the Resend `from` string: `Display <mailbox@domain>` or plain mailbox.
 */
export function formatResendFromLine(row: EmailSenderRow): string {
    const mailbox = row.mailbox.trim();
    const display = row.display_name?.trim();
    if (display) {
        return `${display} <${mailbox}>`;
    }
    return mailbox;
}
