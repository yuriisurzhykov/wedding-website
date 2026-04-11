# Feature: admin-email-dispatch

Send admin email broadcasts through Resend, with per-recipient logging in `email_send_log`. Placeholders in templates are **whitelisted** (see `EMAIL_TEMPLATE_PLACEHOLDER_KEYS`).

## Purpose

- **Test send:** one message to an arbitrary address using real RSVP data when available (first row with email), otherwise safe defaults.
- **From line:** `sender_id` on the **send** body overrides the template’s `sender_id`; otherwise the template’s sender; otherwise `getTransactionalFromAddress()` (`RESEND_FROM_EMAIL`). Unknown `sender_id` → 404.
- **Broadcast:** all RSVP rows with a non-null email, optionally filtered by `attending`, capped per request by **`ADMIN_EMAIL_MAX_BROADCAST_RECIPIENTS`** (default 250). Sends are sequential with **`ADMIN_EMAIL_SEND_DELAY_MS`** (default 75) between calls to reduce rate-limit pressure. Each log row stores **`from_address`**.

## Resend limits

Resend applies account-level rate limits and daily quotas; this feature does not implement a queue or cron. Very large lists require multiple requests (narrow the segment) or external tooling. Document your plan’s throughput in operations runbooks.

## Public API

- `sendAdminEmail(body)` — validates `adminEmailSendSchema`; returns `resend_unconfigured` when `RESEND_API_KEY` is missing.
- `listEmailSendLogForAdmin({ limit? })` — recent rows for the admin UI.

## HTTP

`POST /api/admin/email/send`, `GET /api/admin/email/log?limit=` — both behind admin rate limit + auth.

## Errors

- Template missing → `404` from route when dispatch reports `not_found`.
- Resend missing → `503` with a clear JSON error.
