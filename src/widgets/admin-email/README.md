# Widget: admin-email

Admin screen for HTML email templates, test/broadcast sends via Resend, and a recent send log.

## Purpose

Composes `@features/admin-email-senders`, `@features/admin-email-templates`, and `@features/admin-email-dispatch` behind `/api/admin/email/*` routes. The server section loads senders, templates, and log rows; the client panel performs CRUD and send actions with `router.refresh()` after mutations.

## Public API

- `AdminEmailSection` — use on `app/[locale]/admin/(dashboard)/email/page.tsx`.

## Configuration

Placeholder keys are fixed in `@entities/email-template` (`EMAIL_TEMPLATE_PLACEHOLDER_KEYS`). Saved senders must use mailboxes/domains verified in Resend. Broadcast volume is capped by `ADMIN_EMAIL_MAX_BROADCAST_RECIPIENTS` and pacing by `ADMIN_EMAIL_SEND_DELAY_MS` (see feature README).
