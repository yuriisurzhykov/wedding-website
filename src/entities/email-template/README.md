# Entity: email-template

Row types for `email_templates` and `email_send_log` (admin email tooling).

## Purpose

Shared typing for `@features/admin-email-templates` and `@features/admin-email-dispatch` without importing feature code into entities.

## Public API

- `EmailTemplateRow`, `EmailSendLogRow`
- `EMAIL_TEMPLATE_PLACEHOLDER_KEYS`, `EmailTemplatePlaceholderKey` — allowed `{{key}}` tokens for admin broadcast templates (shared with `@features/admin-email-dispatch` so client UI does not import server-only code).
- `GUEST_RSVP_CONFIRMATION_PLACEHOLDER_KEYS`, `GuestRsvpConfirmationPlaceholderKey` — reserved slugs for guest transactional confirmation; pre-computed fragment keys for DB-backed templates.
- `GUEST_MAGIC_LINK_REHOME_PLACEHOLDER_KEYS`, `GuestMagicLinkRehomePlaceholderKey` — transactional companion rehome mail (`guest-magic-link-rehome-en` / `guest-magic-link-rehome-ru`); see `@features/guest-session` README.
