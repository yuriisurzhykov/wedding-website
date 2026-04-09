# Feature: `rsvp-submit`

Server-only flow: accept JSON from the guest → validate → upsert into Supabase (`rsvp` via `lib/persist-rsvp-row.ts`; unique non-null `email` and `phone`) → **await** admin email → **await** guest confirmation only when `email` is set and admin send succeeded. If mail fails after save, the API returns **502** so the UI can toast; the row still exists in the database.

## Why this slice exists

- Keeps **HTTP adapters** (`app/api/rsvp/route.ts`) thin: they parse the request and map `SubmitRsvpResult` to status codes.
- Centralizes **validation** (Zod), **persistence**, and **email** policy in one place with a single error style (**`SubmitRsvpResult`**, no thrown domain errors from `submitRsvp`).

## Public API

| Export | Role |
|--------|------|
| `submitRsvp` | Main entry; see JSDoc on `api/submit-rsvp.ts` and `index.ts`. |
| `SubmitRsvpResult` | Discriminated union for routing and tests. |

Internal modules (`lib/validate-payload`, `lib/persist-rsvp-row`, `lib/notify-admin`, `lib/notify-guest-rsvp-confirmation`, `lib/email/*`) are not re-exported; extend them inside this feature.

## `submitRsvp` → HTTP mapping (for `POST /api/rsvp`)

| Situation | Suggested HTTP | Response body hint |
|-----------|----------------|-------------------|
| `ok: true` | **200** | `{ ok: true, sessionEstablished, session? }` — §4 snapshot when `guest_sessions` insert succeeded; **`Set-Cookie`** (HttpOnly) with opaque token; no `id` in body for privacy |
| `kind: 'validation'` | **400** | `{ error: 'validation', fieldErrors, formErrors }` |
| `kind: 'config'` | **500** | Generic error; log `message` server-side |
| `kind: 'database'` | **500** | Generic error; log `message` server-side |
| `kind: 'notification'` | **502** | `{ error: 'notification_failed', step: 'admin' or 'guest', id, sessionEstablished, session? }` + optional **`Set-Cookie`** if session was created before mail failed — row saved; client should toast (see widget `RsvpSectionForm`) and may still apply `session` via `GuestSessionProvider` |

## Admin email (sequential, blocking)

After a **successful save** (insert or update), `submitRsvp` **awaits** `notifyAdminOfNewRsvp`. Content is built by `lib/email/build-admin-rsvp-email.ts` as **multipart** `{ subject, html, text }` for Resend. Missing `RESEND_API_KEY` / `ADMIN_EMAIL` or a Resend error yields `kind: 'notification'`, `step: 'admin'`.

## Guest confirmation email (after admin only)

Sent only when the stored row has a **non-empty** `email` (trimmed), and **only after** admin send succeeds. `notifyGuestRsvpConfirmation` uses `lib/email/build-guest-confirmation-email.ts`. If the guest provided an email but Resend fails, the API returns **502** with `step: 'guest'`. **No-op** when the guest omitted email (nothing to send).

**Locale:** `parseRsvpPayload` returns `locale: 'ru' | 'en'` (default `'en'` if the client omits `locale`). Copy lives in `lib/email/guest-confirmation-copy.ts` only — no client i18n in the server templates.

**Site link:** `getPublicSiteUrl()` (`NEXT_PUBLIC_SITE_URL`, else Vercel `VERCEL_PROJECT_PRODUCTION_URL` / `VERCEL_URL`) is passed into the guest builder; if unset, the HTML/text omit the primary CTA but the rest of the message still sends.

## Email build contracts (Resend)

| Type / function | Role |
|-----------------|------|
| `AdminRsvpEmailPayload` | `{ subject, html, text }` from `buildAdminRsvpEmail` |
| `GuestConfirmationEmailPayload` | `{ subject, html, text }` from `buildGuestConfirmationEmail` |
| `buildAdminRsvpPlainText` | Plain-text body for Resend `text` part (inbox search / plain-text clients); not repeated inside HTML |

User-controlled strings in HTML go through `escapeHtml` from `@shared/lib/html-escape`. Theme tokens: `lib/email/wedding-email-theme.ts` (keep in sync with `app/globals.css` `@theme`).

## Adding a new field

1. **Form / i18n** — `@entities/rsvp` (`RSVP_FIELDS`; `lib/config/rsvp` re-exports during migration) and messages.
2. **Validation** — `lib/validate-payload.ts` (`rsvpPayloadSchema`): types, max lengths, refinements.
3. **DB mapping** — `@entities/rsvp` (`RsvpFormInput`, `mapRsvpFormToRow`).
4. **Types** — `@entities/rsvp` `RsvpRow` / `RsvpRowInsert` if the column is new (and `supabase/schema.sql`).
5. **Email — admin** — `lib/email/build-admin-rsvp-email.ts`: add table rows / plain lines for new columns; wire through `notify-admin.ts`.
6. **Email — guest** — same file family: `build-guest-confirmation-email.ts` if the field should appear in the thank-you message (optional blocks, summary, etc.).
7. **Email — guest copy (RU/EN)** — `lib/email/guest-confirmation-copy.ts` for any new user-facing strings (subjects, labels, body lines).

## Observability

- **Vercel logs:** `[rsvp-submit]` prefix for admin/guest notification skips and failures (admin vs guest distinguished in the message text).
- **Supabase:** `rsvp` table rows and API errors from `persistRsvpRow` (select / insert / update).
- **Resend:** dashboard for delivered/bounced mail when configured.
