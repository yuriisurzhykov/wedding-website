/** Keys allowed in `{{key}}` placeholders in admin email templates (unknown keys are stripped at send time). */
export const EMAIL_TEMPLATE_PLACEHOLDER_KEYS = [
    "name",
    "email",
    "phone",
    "guest_count",
    "dietary",
    "message",
    "attending",
] as const;

export type EmailTemplatePlaceholderKey =
    (typeof EMAIL_TEMPLATE_PLACEHOLDER_KEYS)[number];
