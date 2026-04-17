import type {InboundEmailRow, ReplyTemplateRow} from "@entities/inbound-email";
import {applyReplyTemplateVariables} from "@features/admin-inbox-reply/lib/apply-template-variables";
import {deriveSenderDisplayName} from "@features/admin-inbox-reply/lib/derive-sender-display-name";
import {renderReplyEmailHtml} from "@features/admin-inbox-reply/lib/render-reply-email";
import {sanitizeReplyBodyHtml} from "@features/admin-inbox-reply/lib/sanitize-reply-body-html";
import {escapeHtml} from "@shared/lib/html-escape";

export type BuildReplyPreviewInput = Readonly<{
    inbound: Pick<InboundEmailRow, "from_name" | "from_address">;
    template: ReplyTemplateRow | null;
    /** Required when `template` is null. */
    subjectNoTemplate: string;
    heading: string;
    body_html: string;
}>;

/**
 * Mirrors server merge rules in {@link sendInboxReply} for an approximate WYSIWYG preview.
 */
export function buildReplyPreviewDocument(input: BuildReplyPreviewInput): string {
    const senderName = escapeHtml(deriveSenderDisplayName(input.inbound));
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

    if (input.template) {
        subjectFinal = applyReplyTemplateVariables(input.template.subject, vars).trim();
        headingHtml = applyReplyTemplateVariables(input.template.heading, vars);
        bodyHtml = applyReplyTemplateVariables(input.template.body_html, vars);
    } else {
        subjectFinal = input.subjectNoTemplate.trim();
        headingHtml = escapeHtml(input.heading.trim());
        bodyHtml = bodyVar;
    }

    if (!subjectFinal) {
        subjectFinal = "—";
    }

    return renderReplyEmailHtml({
        headingHtml,
        bodyHtml,
        documentTitle: subjectFinal,
    });
}
