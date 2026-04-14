# Feature: admin-email-dispatch

Send **broadcast** admin mail and **single-recipient transactional** mail through Resend, with per-send logging in
`email_send_log`. Placeholders in templates are **allowlisted** per send (broadcast defaults vs transactional keys).

## Purpose

- **Broadcast:** test send and segment mail to many RSVP addresses; sequential sends with delay and caps (see below).
- **Transactional:** one message to one address, template loaded by **`slug`** via `getEmailTemplateBySlugForAdmin` in
  `@features/admin-email-templates` (`sendTransactionalEmailFromSlug`). Used by `@features/rsvp-submit` for guest RSVP
  confirmation (`segment` `transactional:guest-rsvp`).
- **From line:** `sender_id` on the **broadcast** body overrides the template’s `sender_id`; otherwise the template’s
  sender; otherwise `getTransactionalFromAddress()` (`RESEND_FROM_EMAIL`). Unknown `sender_id` → 404. Transactional
  sends resolve `from` the same way from the loaded template row.

## Approach

- **Substitution:** `applyEmailTemplateString` replaces `{{key}}` only for keys in the active allowlist; unknown keys
  become empty. **Default** allowlist is `EMAIL_TEMPLATE_PLACEHOLDER_KEYS` (seven RSVP row fields) for admin broadcasts.
  Callers pass **`placeholderAllowlist`** (e.g. `GUEST_RSVP_CONFIRMATION_PLACEHOLDER_KEYS` from `@entities/email-template`)
  for templates that use a different key set so broadcast UI and docs are not forced to list every transactional key.
- **Logging:** each successful send appends `email_send_log` with `template_id`, `from_address`, and **`segment`**
  (caller-defined; guest RSVP confirmation uses `transactional:guest-rsvp`).

### Reserved slugs (guest RSVP confirmation)

Product convention: RSVP guest mail uses two rows in `email_templates`, **`guest-rsvp-confirmation-en`** and
**`guest-rsvp-confirmation-ru`** (locale selects slug; no `locale` column). Deleting a row does not break RSVP: callers
may fall back to code-built mail. See `@features/rsvp-submit` README.

Companion rehome uses **`guest-magic-link-rehome-en`** / **`guest-magic-link-rehome-ru`** with segment
`transactional:guest-rehome-magic-link` and allowlist `GUEST_MAGIC_LINK_REHOME_PLACEHOLDER_KEYS`; see `@features/guest-session` README.

## Resend limits

Resend applies account-level rate limits and daily quotas; this feature does not implement a queue or cron. Very large lists require multiple requests (narrow the segment) or external tooling. Document your plan’s throughput in operations runbooks.

## Public API

- `sendAdminEmail(body)` — validates `adminEmailSendSchema`; returns `resend_unconfigured` when `RESEND_API_KEY` is missing.
- `sendTransactionalEmailFromSlug({ slug, to, vars, segment, placeholderAllowlist? })` — loads template by `slug`,
  resolves `from` from `sender_id` or `getTransactionalFromAddress()`, substitutes into `subject_template` / `body_html` /
  `body_text`, sends via Resend, writes `email_send_log`. Result: `ok` with optional `resend_email_id`; or `not_found`
  (no template row), `resend_unconfigured`, `resend`, `sender_not_found`, `database`, `config`. Failed sends may still
  be logged where applicable.
- `listEmailSendLogForAdmin({ limit? })` — recent rows for the admin UI.
- `applyEmailTemplateString(template, vars, allowlist?)` — shared substitution helper; third argument selects allowlist.
- Re-export: `EMAIL_TEMPLATE_PLACEHOLDER_KEYS` from `@entities/email-template` (broadcast default keys).

## HTTP

`POST /api/admin/email/send`, `GET /api/admin/email/log?limit=` — both behind admin rate limit + auth.

## Errors

- Template missing → `404` from route when dispatch reports `not_found`.
- Resend missing → `503` with a clear JSON error.

## Observability

- **`email_send_log.segment`** — use stable values such as `transactional:guest-rsvp` to filter transactional traffic
  from broadcast campaigns in support queries.
