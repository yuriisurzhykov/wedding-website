# Feature: `rsvp-submit`

Server-only flow: accept JSON from the guest → validate → upsert into Supabase (`rsvp` via `lib/persist-rsvp-row.ts`;
unique non-null `email` and `phone`) → sync **`guest_accounts`** for the party (`lib/sync-guest-accounts-party-for-rsvp.ts`
after `lib/build-party-members-from-form.ts`) → **await** admin email → **await** guest confirmation only when `email`
is set and admin send succeeded. If mail fails after save, the API returns **502** so the UI can toast; the row still
exists in the database. If party sync fails after the RSVP row is saved, the handler returns **500** (operational follow-up
may be needed).

## Why this slice exists

- Keeps **HTTP adapters** (`app/api/rsvp/route.ts`) thin: they parse the request and map `SubmitRsvpResult` to status
  codes.
- Centralizes **validation** (Zod), **persistence**, and **email** policy in one place with a single error style (*
  *`SubmitRsvpResult`**, no thrown domain errors from `submitRsvp`).

## Public API

| Export             | Role                                                          |
|--------------------|---------------------------------------------------------------|
| `submitRsvp`       | Main entry; see JSDoc on `api/submit-rsvp.ts` and `index.ts`. |
| `SubmitRsvpResult` | Discriminated union for routing and tests.                    |

Internal modules (`lib/validate-payload`, `lib/persist-rsvp-row`, `lib/notify-admin`,
`lib/notify-guest-rsvp-confirmation`, `lib/email/*`) are not re-exported; extend them inside this feature.

## `submitRsvp` → HTTP mapping (for `POST /api/rsvp`)

| Situation              | Suggested HTTP | Response body hint                                                                                                                                                                                                                                                                            |
|------------------------|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ok: true`             | **200**        | `{ ok: true, sessionEstablished, session? }` — §4 snapshot (`GuestViewerSnapshot`: `displayName`, `emailMasked?`, `attending`) when `guest_sessions` insert succeeded; **`Set-Cookie`** (HttpOnly) with opaque token; no `id` in body for privacy                                             |
| `kind: 'validation'`   | **400**        | `{ error: 'validation', fieldErrors, formErrors }`                                                                                                                                                                                                                                            |
| `kind: 'feature_disabled'` | **403**    | `{ error: 'feature_disabled' }` — `site_settings.capabilities.rsvp` is off                                                                                                                                                                                                                    |
| `kind: 'config'`       | **500**        | Generic error; log `message` server-side                                                                                                                                                                                                                                                      |
| `kind: 'database'`     | **500**        | Generic error; log `message` server-side                                                                                                                                                                                                                                                      |
| `kind: 'notification'` | **502**        | `{ error: 'notification_failed', step: 'admin' or 'guest', id, sessionEstablished, session? }` + optional **`Set-Cookie`** if session was created before mail failed — row saved; client should toast (see widget `RsvpSectionForm`) and may still apply `session` via `GuestSessionProvider` |

## Admin email (sequential, blocking)

After a **successful save** (insert or update) and **party sync**, `submitRsvp` **awaits** `notifyAdminOfNewRsvp`.
Content is built by `lib/email/build-admin-rsvp-email.ts` as **multipart** `{ subject, html, text }` for Resend. When the
guest is attending with companions, companion display names are passed into the admin template (plain text + HTML table
row). Missing `RESEND_API_KEY` / `ADMIN_EMAIL` or a Resend error yields `kind: 'notification'`, `step: 'admin'`.

## Guest confirmation email (after admin only)

Sent only when the stored row has a **non-empty** `email` (trimmed), and **only after** admin send succeeds. If the
guest provided an email but Resend fails, the API returns **502** with `step: 'guest'`. **No-op** when the guest
omitted email (nothing to send).

### DB-backed transactional template (primary path)

`notifyGuestRsvpConfirmation` calls `sendTransactionalEmailFromSlug` from `@features/admin-email-dispatch` with:

- **Reserved slugs** (one logical role, two language rows in `email_templates`): `guest-rsvp-confirmation-en`,
  `guest-rsvp-confirmation-ru`. Mapping: `locale === 'ru'` → Russian slug; otherwise English.
- **Variables** — `buildGuestRsvpConfirmationTemplateVars` in `lib/email/build-guest-rsvp-confirmation-template-vars.ts`
  (venue, calendar lines, conditional blocks, optional site and magic-link URLs). Allowed `{{key}}` names are
  `GUEST_RSVP_CONFIRMATION_PLACEHOLDER_KEYS` in `@entities/email-template` (separate from the seven broadcast keys).
- **Log segment** — `email_send_log.segment` is `transactional:guest-rsvp` for these sends.

### Fallback when the template row is missing

If no row exists for the slug (e.g. deleted in admin), the feature logs a warning `[rsvp-submit] Guest confirmation
template missing; using code fallback.` and sends using `buildGuestConfirmationEmail` (`lib/email/build-guest-confirmation-email.ts`)
with Resend `from` from `getTransactionalFromAddress()` (the same default used when a template row has no `sender_id`),
so RSVP delivery stays reliable.

**Locale:** `parseRsvpPayload` returns `locale: 'ru' | 'en'` (default `'en'` if the client omits `locale`). For the
primary path, subject/body live in `email_templates` per slug. The fallback path still uses
`lib/email/guest-confirmation-copy.ts` for copy — no client i18n in server templates.

**Site link:** `getPublicSiteUrl()` — priority: `NEXT_PUBLIC_SITE_URL` (canonical override), then Vercel
`VERCEL_PROJECT_PRODUCTION_URL`, then `VERCEL_URL` (see `@shared/lib/README.md` “Public site URL”). Passed into the
template vars / guest builder; if unset, the HTML/text omit the primary CTA but the rest of the message still sends.

## Email build contracts (Resend)

| Type / function                 | Role                                                                                                 |
|---------------------------------|------------------------------------------------------------------------------------------------------|
| `AdminRsvpEmailPayload`         | `{ subject, html, text }` from `buildAdminRsvpEmail`                                                 |
| `GuestConfirmationEmailPayload` | `{ subject, html, text }` from `buildGuestConfirmationEmail` (fallback path only)                  |
| Guest RSVP template vars       | `Record` of string values for `{{key}}` substitution; keys in `GUEST_RSVP_CONFIRMATION_PLACEHOLDER_KEYS` (`@entities/email-template`) |
| `buildAdminRsvpPlainText`       | Plain-text body for Resend `text` part (inbox search / plain-text clients); not repeated inside HTML |

User-controlled strings in HTML go through `escapeHtml` from `@shared/lib/html-escape`. Theme tokens:
`lib/email/wedding-email-theme.ts` (keep in sync with `app/globals.css` `@theme`); transactional HTML in the database
should stay visually aligned with those tokens when edited in admin.

## Adding a new field

1. **Form / i18n** — `@entities/rsvp` (`RSVP_FIELDS`; `lib/config/rsvp` re-exports during migration) and messages.
2. **Validation** — `lib/validate-payload.ts` (`rsvpPayloadSchema`): types, max lengths, refinements (including
   `companionNames` length vs `guestCount` when attending, per-name limits, and party-wide unique names).
3. **DB mapping** — `@entities/rsvp` (`RsvpFormInput`, `mapRsvpFormToRow`).
4. **Types** — `@entities/rsvp` `RsvpRow` / `RsvpRowInsert` if the column is new (and `supabase/schema.sql`).
5. **Email — admin** — `lib/email/build-admin-rsvp-email.ts`: add table rows / plain lines for new columns; wire through
   `notify-admin.ts`.
6. **Email — guest (transactional)** — extend `buildGuestRsvpConfirmationTemplateVars` and, if new placeholders are
   required, add keys to `GUEST_RSVP_CONFIRMATION_PLACEHOLDER_KEYS` in `@entities/email-template`, then update the
   `guest-rsvp-confirmation-en` / `guest-rsvp-confirmation-ru` rows in `email_templates` (subject/body) so admin sends
   match the allowlist. `applyEmailTemplateString` substitutes only allowed keys.
7. **Email — guest (fallback)** — `build-guest-confirmation-email.ts` and `guest-confirmation-copy.ts` for any new
   user-facing strings when the code path runs (template row missing).

## Observability

- **Vercel logs:** `[rsvp-submit]` prefix for admin/guest notification skips and failures (admin vs guest distinguished
  in the message text); guest template missing logs before code fallback.
- **email_send_log:** transactional guest sends include `segment` `transactional:guest-rsvp` (see `@features/admin-email-dispatch` README).
- **Supabase:** `rsvp` table rows and API errors from `persistRsvpRow` (select / insert / update).
- **Resend:** dashboard for delivered/bounced mail when configured.
