# Entity: email-template

Row types for `email_templates` and `email_send_log` (admin email tooling).

## Purpose

Shared typing for `@features/admin-email-templates` and `@features/admin-email-dispatch` without importing feature code into entities.

## Public API

- `EmailTemplateRow`, `EmailSendLogRow`
- `EMAIL_TEMPLATE_PLACEHOLDER_KEYS`, `EmailTemplatePlaceholderKey` — allowed `{{key}}` tokens for admin templates (shared with `@features/admin-email-dispatch` so client UI does not import server-only code).
