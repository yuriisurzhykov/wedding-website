import {
    type ReplyTemplatePlaceholderKey,
    REPLY_TEMPLATE_PLACEHOLDER_KEYS,
} from "@entities/inbound-email";

const ALLOWED = new Set<string>(REPLY_TEMPLATE_PLACEHOLDER_KEYS);

/**
 * Substitutes `{{senderName}}`, `{{heading}}`, `{{body}}` only; other `{{keys}}` are removed.
 */
export function applyReplyTemplateVariables(
    template: string,
    vars: Partial<Record<ReplyTemplatePlaceholderKey, string>>,
): string {
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_full, key: string) => {
        if (!ALLOWED.has(key)) {
            return "";
        }
        return vars[key as ReplyTemplatePlaceholderKey] ?? "";
    });
}
