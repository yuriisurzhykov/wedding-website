# Feature: `rsvp-submit`

Server-only flow: accept JSON from the guest → validate → insert into Supabase (`rsvp`) → notify the admin by email without blocking the success response on mail delivery.

## Why this slice exists

- Keeps **HTTP adapters** (`app/api/rsvp/route.ts`) thin: they parse the request and map `SubmitRsvpResult` to status codes.
- Centralizes **validation** (Zod), **persistence**, and **email** policy in one place with a single error style (**`SubmitRsvpResult`**, no thrown domain errors from `submitRsvp`).

## Public API

| Export | Role |
|--------|------|
| `submitRsvp` | Main entry; see JSDoc on `api/submit-rsvp.ts` and `index.ts`. |
| `SubmitRsvpResult` | Discriminated union for routing and tests. |

Internal modules (`lib/validate-payload`, `lib/notify-admin`) are not re-exported; extend them inside this feature.

## `submitRsvp` → HTTP mapping (for `POST /api/rsvp`)

| Situation | Suggested HTTP | Response body hint |
|-----------|----------------|-------------------|
| `ok: true` | **200** | `{ ok: true }` (route may omit `id` for privacy) |
| `kind: 'validation'` | **400** | `{ error: 'validation', fieldErrors, formErrors }` |
| `kind: 'config'` | **500** | Generic error; log `message` server-side |
| `kind: 'database'` | **500** | Generic error; log `message` server-side |

## Admin email (fire-and-forget)

After a **successful insert**, `notifyAdminOfNewRsvp` runs in the background (`void …catch`). The guest still gets success if email fails; failures are logged under `[rsvp-submit]`. Missing `RESEND_API_KEY` or `ADMIN_EMAIL` skips email with a **warning** only.

## Adding a new field

1. **Form / i18n** — `lib/config/rsvp` (`RSVP_FIELDS`) and messages.
2. **Validation** — `lib/validate-payload.ts` (`rsvpPayloadSchema`): types, max lengths, refinements.
3. **DB mapping** — `@entities/rsvp` (`RsvpFormInput`, `mapRsvpFormToRow`).
4. **Types** — `@entities/rsvp` `RsvpRow` / `RsvpRowInsert` if the column is new (and `supabase/schema.sql`).
5. **Email** — `lib/notify-admin.ts` (`formatRsvpSummary`).

## Observability

- **Vercel logs:** `[rsvp-submit]` prefix for notification skips and failures.
- **Supabase:** `rsvp` table rows and API errors from `insert`.
- **Resend:** dashboard for delivered/bounced mail when configured.
