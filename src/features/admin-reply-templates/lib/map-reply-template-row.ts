import type {ReplyTemplateRow} from "@entities/inbound-email";

/**
 * Normalizes nullable DB fields to the entity row shape used by admin callers.
 */
export function mapReplyTemplateRow(data: Record<string, unknown>): ReplyTemplateRow {
    return {
        id: String(data.id),
        name: String(data.name),
        subject: String(data.subject),
        heading: String(data.heading),
        body_html: String(data.body_html),
        body_text: data.body_text == null ? "" : String(data.body_text),
        is_default: Boolean(data.is_default),
        created_at: String(data.created_at),
        updated_at: String(data.updated_at),
    };
}
