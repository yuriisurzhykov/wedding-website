import type {EmailTemplatePlaceholderKey} from "@entities/email-template";
import {EMAIL_TEMPLATE_PLACEHOLDER_KEYS} from "@entities/email-template";

const ALLOWED = new Set<string>(EMAIL_TEMPLATE_PLACEHOLDER_KEYS);

/**
 * Replaces `{{key}}` segments using only whitelisted keys; unknown keys become empty strings.
 */
export function applyEmailTemplateString(
    template: string,
    vars: Partial<Record<EmailTemplatePlaceholderKey, string>>,
): string {
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_full, key: string) => {
        if (!ALLOWED.has(key)) {
            return "";
        }
        const k = key as EmailTemplatePlaceholderKey;
        return vars[k] ?? "";
    });
}
