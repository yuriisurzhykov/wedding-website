# Feature: `guest-session`

Opaque guest sessions after RSVP: **raw token only in HttpOnly cookie**, **SHA-256 hash** in
`guest_sessions.token_hash`, JSON error contract for APIs and UI (plan §4–5).

## Why this slice exists

- Single place for **token hashing**, **session create/validate**, **cookie descriptors** (Next.js `cookies().set` /
  `NextResponse.cookies.set`), and **stable `error.code` values** mapped to HTTP status + JSON body.
- Route handlers stay thin: they parse HTTP, call `@features/guest-session/server`, map results to responses.

## Entry points

| Module                           | Use when                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
|----------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `@features/guest-session`        | **Client-safe**: shared types, §4 snapshot via `buildGuestSessionClientSnapshot` (alias of `@entities/guest-viewer` `buildGuestViewerSnapshot`), §5 `buildGuestSessionErrorJson`, `httpStatusForGuestSessionErrorCode`, `mapValidateGuestSessionFailureToCode`, **`GuestSessionProvider` / `useGuestSession`** (hydrate from `GET /api/guest/session`, **`restoreSession({ name, email })`** → `POST /api/guest/session`, apply §4 snapshot on success), **`GuestSessionRestoreForm`** (reusable name+email UI; `layout: 'page' \| 'embedded'`). Safe to import from client components (no `server-only` chain). |
| `@features/guest-session/server` | **Server only**: `createGuestSession`, `validateGuestSession`, `validateGuestSessionFromRequest`, cookie extractors/descriptors, `getGuestSessionRuntimeConfig`, `hashSessionToken`, restore helpers (see HTTP routes below).                                                                                                                                                                                                                                                                                                                                                                                    |

## HTTP: `POST /api/rsvp`

Handled in `app/api/rsvp/route.ts` via `@features/rsvp-submit` (`submitRsvp`). After a successful **`rsvp` upsert**, the
feature calls `createGuestSession` (same `guest_sessions` row shape as restore). **200** with `Set-Cookie` when session
insert succeeds, body `{ ok: true, sessionEstablished: true, session }` (§4 snapshot, no raw token). If session insert
fails, RSVP still succeeds with `sessionEstablished: false`. **502** (`notification_failed`) after save includes the
same `session` / `sessionEstablished` fields when a session was created before mail failed.

Wrap the app (e.g. `[locale]/layout`) with **`GuestSessionProvider`**; the RSVP widget passes `applyFromApiBody` into
`submitRsvpFetch` so the UI updates in the same tick as the response (plan §3.3).

**Restore shell (plan §3, §8.3):** localized page `app/[locale]/guest/sign-in/page.tsx` renders *
*`GuestSessionRestoreForm`** with
`layout="page"`. Gallery and wishes embed the same form with `layout="embedded"` when the user is anonymous so they can
restore without hunting for a link. Main nav includes **`guestSignIn`** (label `nav.guestSignIn`) whenever the session
is
not `authenticated` (hidden after sign-in). Copy for the form lives under **`guestSession.restore.*`** in `messages/*`.

## HTTP: `GET` / `POST` `/api/guest/session`

Thin handlers in `app/api/guest/session/route.ts`.

| Method | Role                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
|--------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `GET`  | Reads the guest session cookie. **200** `{ sessionEstablished: true, session }` when valid; **200** `{ sessionEstablished: false }` when there is no cookie; **401** + `error.code` when a cookie is present but invalid or expired; **500** on unexpected DB errors during validation or RSVP load.                                                                                                                                                                                                           |
| `POST` | Body `{ "name": string, "email": string }` — same field rules as RSVP submit; values are normalized with `mapRsvpFormToRow` before matching `rsvp`. **200** + `Set-Cookie` + `{ sessionEstablished: true, session }` on success; **401** + `restore_credentials_no_match` when no row matches; **400** `validation` (Zod flatten) on bad input; **429** + `rate_limited` + `retryAfterSec` when the fixed-window limit is exceeded (plan §13); **500** on DB/session create failure or rate-limit RPC failure. |

## HTTP: `GET /api/guest/claim` (magic link, plan §8.2)

Query: **`token`** (opaque, required), **`locale`** (`ru` \| `en`, optional, default `en`).

| Outcome                                                                                                                                                                                 | Response                                                                                              |
|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| Valid token, not past `expires_at`                                                                                                                                                      | **302** to localized home with **Set-Cookie** (`guest_sessions`). Same link works again until expiry. |
| Missing/invalid/expired token                                                                                                                                                           | **302** to `/{locale}/guest/claim?error=magic_link_invalid` (default-locale path has no prefix).      |
| DB / session insert failure                                                                                                                                                             | **302** to `…/guest/claim?error=server_error`.                                                        |
| Missing public site URL (no `getPublicSiteUrl()` / `resolvePublicSiteBaseForServerEmail` result — set `NEXT_PUBLIC_SITE_URL` or rely on Vercel `VERCEL_*`; see `@shared/lib/README.md`) | **500** + `error.code: server_error` (misconfiguration).                                              |

Implementation: `claimMagicLink` in `@features/guest-session/server` validates the opaque token against
`guest_magic_link_tokens` by hash and `expires_at` only (session **restore** semantics; the DB column `used_at` is
legacy and is not updated on claim).

## Rate limiting (restore `POST`, plan §13)

- **Store:** Postgres table `guest_session_restore_rate` + RPC `guest_session_check_restore_rate` (atomic, fixed window
  per bucket). Not in-memory — safe on serverless multi-instance.
- **Bucket:** SHA-256 of `client IP` + normalized name + normalized email (same normalization as `mapRsvpFormToRow` /
  restore query). IP from `x-forwarded-for` (first hop) or `x-real-ip`.
- **Response when limited:** **429**, `buildGuestSessionErrorJson("rate_limited", { retryAfterSec })`.
- **Wire vs TS:** the RPC JSON from Postgres uses `retry_after_sec`; TypeScript uses `retryAfterSec` everywhere after
  parsing.
- **Internals:** `checkGuestSessionRestoreRate` in `@features/guest-session/server`; thresholds are **not** exported
  from the client-safe package.

Restore deliberately uses a **single** failure code for “no match” (plan §5.2). Raw session tokens never appear in JSON.

Do not import `server` from Client Components — the package uses `server-only` on those modules.

## Session mechanics

1. **Create:** `createGuestSession(supabase, rsvpId)` generates an opaque token (32 random bytes, base64url), stores *
   *only** `hashSessionToken(raw)` in `guest_sessions`, sets `expires_at` from config TTL.
2. **Cookie:** `getGuestSessionCookieDescriptor(rawToken)` returns `{ name, value, options }` for `Set-Cookie` (
   HttpOnly, `Secure` in production by default, `SameSite` default `lax`, `Path=/`).
3. **Validate:** `validateGuestSession(supabase, rawToken)` or `validateGuestSessionFromRequest(supabase, request)`
   loads by hash, checks `expires_at`, updates `last_seen_at` best-effort.

## Environment (optional)

| Variable                                  | Default                                            | Role                                                             |
|-------------------------------------------|----------------------------------------------------|------------------------------------------------------------------|
| `GUEST_SESSION_COOKIE_NAME`               | `guest_session`                                    | Cookie name.                                                     |
| `GUEST_SESSION_MAX_AGE_SEC`               | `7776000` (90d)                                    | Cookie `maxAge` and DB `expires_at` window for **new** sessions. |
| `GUEST_SESSION_COOKIE_SECURE`             | `true` if `NODE_ENV === "production"` else `false` | `Secure` flag; set to `1` / `true` to force.                     |
| `GUEST_SESSION_COOKIE_SAMESITE`           | `lax`                                              | `strict`, `lax`, or `none`.                                      |
| `GUEST_SESSION_RESTORE_RATE_WINDOW_SEC`   | `900` (15 min)                                     | Fixed window length for restore attempts per bucket.             |
| `GUEST_SESSION_RESTORE_RATE_MAX_ATTEMPTS` | `10`                                               | Max attempts per window per bucket before **429**.               |
| `GUEST_MAGIC_LINK_MAX_AGE_SEC`            | `7776000` (90d)                                    | TTL for new `guest_magic_link_tokens` rows (email links).        |

## Error JSON (§5.1)

Successful mutation responses may include a session snapshot (§4) from the route; **errors** use:

```json
{
  "error": {
    "code": "<GuestSessionPublicErrorCode>",
    "retryAfterSec": 60
  }
}
```

`retryAfterSec` is only set when `code === "rate_limited"` (and similar cases agreed in API).

Use **`buildGuestSessionErrorJson(code, { retryAfterSec })`** for the body and *
*`httpStatusForGuestSessionErrorCode(code)`** for the status. Map validation failures with *
*`mapValidateGuestSessionFailureToCode`** (`guest_session_missing` / `guest_session_invalid` / `guest_session_expired` /
`server_error`).

### Catalog: `GuestSessionPublicErrorCode`

| `code`                         | Meaning                                                                                   | Suggested HTTP | Suggested `next-intl` keys (example)                                           |
|--------------------------------|-------------------------------------------------------------------------------------------|----------------|--------------------------------------------------------------------------------|
| `guest_session_expired`        | Cookie present or DB row found but `expires_at` passed                                    | 401            | `guestSession.errors.guest_session_expired.title` / `.description` / `.action` |
| `guest_session_missing`        | No session cookie / empty token                                                           | 401            | `…guest_session_missing.…`                                                     |
| `guest_session_invalid`        | Token does not match any row                                                              | 401            | `…guest_session_invalid.…`                                                     |
| `restore_credentials_no_match` | Name+email restore did not match an `rsvp` row (single message for all “not found” cases) | 401            | `…restore_credentials_no_match.…`                                              |
| `rate_limited`                 | Too many attempts; include `retryAfterSec`                                                | 429            | `…rate_limited.…` (interpolate seconds)                                        |
| `request_failed`               | Client/network failure (usually client-side mapping)                                      | 400            | `…request_failed.…`                                                            |
| `server_error`                 | Unexpected server/DB failure                                                              | 500            | `…server_error.…`                                                              |
| `upload_presign_failed`        | Presign step failed                                                                       | 400            | `…upload_presign_failed.…`                                                     |
| `upload_r2_failed`             | R2 upload failed                                                                          | 400            | `…upload_r2_failed.…`                                                          |
| `upload_confirm_failed`        | Confirm step failed                                                                       | 400            | `…upload_confirm_failed.…`                                                     |
| `upload_no_session`            | Upload requires guest session                                                             | 400            | `…upload_no_session.…`                                                         |
| `photo_delete_forbidden`       | Delete not allowed (e.g. not owner / IDOR-safe wording)                                   | 403            | `…photo_delete_forbidden.…`                                                    |
| `magic_link_invalid`           | Magic-link claim failed (bad or expired token)                                            | 400            | `guestClaim.*` (claim error page after redirect)                               |

All user-visible copy must live in **`messages/en.json`** and **`messages/ru.json`**; the client chooses strings by
`error.code`.

## §4 Client snapshot

Canonical type: **`GuestViewerSnapshot`** in `@entities/guest-viewer` (re-exported as **`GuestSessionClientSnapshot`**
here for §4 / API stability).

`buildGuestSessionClientSnapshot({ name, email, attending })` returns `{ displayName, emailMasked?, attending }` for
JSON bodies after RSVP /
restore / magic link. **`attending`** comes from the persisted `rsvp` row and is the app’s policy hook (e.g. gallery /
wishes); **Never** put the raw session token in JSON.

## Extending

- **New error code:** Add to `GuestSessionPublicErrorCode` in `lib/guest-session-error.ts`, implement
  `httpStatusForGuestSessionErrorCode`, document the row above, add i18n keys in both locales.
- **New server behavior:** Add a small module under `lib/`, export from `server.ts`, keep `index.ts` free of
  `server-only` imports.

## Observability

Log full details server-side; responses expose only `code` and safe fields (`retryAfterSec`). Validation touches
`last_seen_at` with `console.warn` on update failure.
