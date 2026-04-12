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

/**
 * Keys for transactional guest RSVP confirmation rows (`guest-rsvp-confirmation-en` / `guest-rsvp-confirmation-ru`).
 * Values are pre-rendered fragments (HTML vs plain text where layout requires it); callers pass this list as the
 * optional allowlist when substituting `{{key}}` in those templates.
 */
export const GUEST_RSVP_CONFIRMATION_PLACEHOLDER_KEYS = [
    "subject",
    "greeting_html",
    "greeting_text",
    "lead",
    "summary",
    "when_where_title",
    "when_where_body_html",
    "when_where_body_text",
    "extras_html",
    "extras_text",
    "magic_link_html",
    "magic_link_text",
    "sign_off_html",
    "sign_off_text",
] as const;

export type GuestRsvpConfirmationPlaceholderKey =
    (typeof GUEST_RSVP_CONFIRMATION_PLACEHOLDER_KEYS)[number];
