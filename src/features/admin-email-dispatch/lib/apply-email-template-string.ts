import {EMAIL_TEMPLATE_PLACEHOLDER_KEYS} from "@entities/email-template";

const DEFAULT_ALLOWLIST = new Set<string>(EMAIL_TEMPLATE_PLACEHOLDER_KEYS);

/**
 * Replaces `{{key}}` segments using only allowlisted keys; unknown keys become empty strings.
 *
 * @param allowlist — When omitted, uses {@link EMAIL_TEMPLATE_PLACEHOLDER_KEYS} (admin broadcast templates).
 *   For guest RSVP confirmation templates, pass `GUEST_RSVP_CONFIRMATION_PLACEHOLDER_KEYS` from `@entities/email-template`.
 */
export function applyEmailTemplateString(
    template: string,
    vars: Partial<Record<string, string>>,
    allowlist?: readonly string[],
): string {
    const allowed = allowlist ? new Set(allowlist) : DEFAULT_ALLOWLIST;
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_full, key: string) => {
        if (!allowed.has(key)) {
            return "";
        }
        return vars[key] ?? "";
    });
}
