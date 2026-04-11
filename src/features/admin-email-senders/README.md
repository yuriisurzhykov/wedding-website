# Feature: admin-email-senders

CRUD for `email_senders`: saved **From** lines for admin broadcasts (mailbox + optional display name). Each address must be allowed in Resend (verified domain).

## Purpose

Admins define identities once, then attach them to templates (`email_templates.sender_id`) or pass `sender_id` on `POST /api/admin/email/send` to override. If no sender is chosen, dispatch falls back to `getTransactionalFromAddress()` (`RESEND_FROM_EMAIL`).

## Public API

- `listEmailSendersForAdmin()`, `getEmailSenderByIdForAdmin(id)`
- `createEmailSenderForAdmin`, `updateEmailSenderForAdmin`, `deleteEmailSenderForAdmin`
- `formatResendFromLine(row)` — builds the Resend `from` string

## HTTP

`GET/POST /api/admin/email/senders`, `PATCH/DELETE /api/admin/email/senders/[id]` — rate limit + `isAdminApiAuthorized` first.
