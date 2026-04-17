/**
 * Keys allowed in `{{key}}` placeholders for admin reply templates (unknown keys are rejected at render time).
 */
export const REPLY_TEMPLATE_PLACEHOLDER_KEYS = [
    "senderName",
    "heading",
    "body",
] as const;

export type ReplyTemplatePlaceholderKey =
    (typeof REPLY_TEMPLATE_PLACEHOLDER_KEYS)[number];

/**
 * Brace-wrapped tokens as they appear in stored template strings.
 */
export const REPLY_TEMPLATE_BRACE_PLACEHOLDERS = [
    "{{senderName}}",
    "{{heading}}",
    "{{body}}",
] as const;

/**
 * Row shape for `reply_templates` (single-locale flat fields; footer is fixed in code at send time).
 */
export type ReplyTemplateRow = Readonly<{
    id: string;
    name: string;
    subject: string;
    heading: string;
    body_html: string;
    body_text: string;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}>;
