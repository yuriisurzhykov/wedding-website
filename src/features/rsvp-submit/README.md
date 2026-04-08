# Feature: `rsvp-submit`

Server-only flow: accept JSON from the guest → validate → insert into Supabase (`rsvp`) → notify the admin (and the guest when `email` is set) by email without blocking the success response on mail delivery.

## Why this slice exists

- Keeps **HTTP adapters** (`app/api/rsvp/route.ts`) thin: they parse the request and map `SubmitRsvpResult` to status codes.
- Centralizes **validation** (Zod), **persistence**, and **email** policy in one place with a single error style (**`SubmitRsvpResult`**, no thrown domain errors from `submitRsvp`).

## Public API

| Export | Role |
|--------|------|
| `submitRsvp` | Main entry; see JSDoc on `api/submit-rsvp.ts` and `index.ts`. |
| `SubmitRsvpResult` | Discriminated union for routing and tests. |

Internal modules (`lib/validate-payload`, `lib/notify-admin`, `lib/notify-guest-rsvp-confirmation`, `lib/email/*`) are not re-exported; extend them inside this feature.

## `submitRsvp` → HTTP mapping (for `POST /api/rsvp`)

| Situation | Suggested HTTP | Response body hint |
|-----------|----------------|-------------------|
| `ok: true` | **200** | `{ ok: true }` (route may omit `id` for privacy) |
| `kind: 'validation'` | **400** | `{ error: 'validation', fieldErrors, formErrors }` |
| `kind: 'config'` | **500** | Generic error; log `message` server-side |
| `kind: 'database'` | **500** | Generic error; log `message` server-side |

## Admin email (fire-and-forget)

After a **successful insert**, `notifyAdminOfNewRsvp` runs in the background (`void …catch`). Content is built by `lib/email/build-admin-rsvp-email.ts` as **multipart** `{ subject, html, text }` for Resend. The guest still gets success if email fails; failures are logged under `[rsvp-submit]`. Missing `RESEND_API_KEY` or `ADMIN_EMAIL` skips email with a **warning** only.

## Guest confirmation email (fire-and-forget)

Sent only when the stored row has a **non-empty** `email` (trimmed). `notifyGuestRsvpConfirmation` builds content via `lib/email/build-guest-confirmation-email.ts` (same multipart shape as admin). Missing `RESEND_API_KEY` logs a **warning** and returns; **no log** when the guest omitted email (intentional no-op). Resend failures are logged as `[rsvp-submit] Guest confirmation failed (RSVP still saved): …` while the API still returns **200** after insert.

**Locale:** `parseRsvpPayload` returns `locale: 'ru' | 'en'` (default `'en'` if the client omits `locale`). Copy lives in `lib/email/guest-confirmation-copy.ts` only — no client i18n in the server templates.

**Site link:** `getPublicSiteUrl()` (`NEXT_PUBLIC_SITE_URL` or `https://${VERCEL_URL}`) is passed into the guest builder; if unset, the HTML/text omit the primary CTA but the rest of the message still sends.

## Email build contracts (Resend)

| Type / function | Role |
|-----------------|------|
| `AdminRsvpEmailPayload` | `{ subject, html, text }` from `buildAdminRsvpEmail` |
| `GuestConfirmationEmailPayload` | `{ subject, html, text }` from `buildGuestConfirmationEmail` |
| `buildAdminRsvpPlainText` | Plain-text body reused in HTML footer and inbox search |

User-controlled strings in HTML go through `escapeHtml` from `@shared/lib/html-escape`. Theme tokens: `lib/email/wedding-email-theme.ts` (keep in sync with `app/globals.css` `@theme`).

## Adding a new field

1. **Form / i18n** — `lib/config/rsvp` (`RSVP_FIELDS`) and messages.
2. **Validation** — `lib/validate-payload.ts` (`rsvpPayloadSchema`): types, max lengths, refinements.
3. **DB mapping** — `@entities/rsvp` (`RsvpFormInput`, `mapRsvpFormToRow`).
4. **Types** — `@entities/rsvp` `RsvpRow` / `RsvpRowInsert` if the column is new (and `supabase/schema.sql`).
5. **Email — admin** — `lib/email/build-admin-rsvp-email.ts`: add table rows / plain lines for new columns; wire through `notify-admin.ts`.
6. **Email — guest** — same file family: `build-guest-confirmation-email.ts` if the field should appear in the thank-you message (optional blocks, summary, etc.).
7. **Email — guest copy (RU/EN)** — `lib/email/guest-confirmation-copy.ts` for any new user-facing strings (subjects, labels, body lines).

## Observability

- **Vercel logs:** `[rsvp-submit]` prefix for admin/guest notification skips and failures (admin vs guest distinguished in the message text).
- **Supabase:** `rsvp` table rows and API errors from `insert`.
- **Resend:** dashboard for delivered/bounced mail when configured.
