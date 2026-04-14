# Feature: admin-rsvp-list

Briefly: server-side reads for the admin panel — list `guest_accounts` joined to `rsvp` (one row per account), optional
`attending` filter on the party, and helpers for the admin HTTP route. Callers are `app/api/admin/rsvps` and widgets that
may call `listGuestAccountsForAdmin` directly to skip a self-HTTP round-trip.

## Purpose

- Provide a narrow DTO (`AdminGuestListRow`) for admin guest tables and `GET /api/admin/rsvps`.
- Validate optional `attending` query parameters for that route.
- Keep `listRsvpsForAdmin` as a legacy one-row-per-RSVP read for callers that still need raw `rsvp` rows.

**Non-goals:** admin authentication, rate limiting, and HTTP status mapping (owned by `@features/admin-api` and thin
route handlers). No writes or mutations.

## Approach

- **Server-only:** modules that touch Supabase use `import "server-only"` and `createServerClient()` (service role),
  consistent with other server features.
- **Data:** `guest_accounts` with embedded `rsvp!inner(...)`; optional `.eq("rsvp.attending", …)` when the client passes
  `attending` (same dotted filter style as `@features/guest-session`).
- **Ordering:** PostgREST does not apply “party by `created_at` desc, then `sort_order` asc” in one shot; the feature maps
  rows then sorts in TypeScript via `sortAdminGuestRowsByParty`. Acceptable at current admin scale; a DB view or RPC
  could replace this if the dataset grows.

## Public API

From `index.ts` (only supported import path for consumers outside this slice):

| Export | Role |
|--------|------|
| `listGuestAccountsForAdmin` | Primary list: `{ ok: true, rows }` or `{ ok: false, kind, message }`. |
| `ListGuestAccountsForAdminOptions` / `ListGuestAccountsForAdminResult` | Types for the list call. |
| `AdminGuestListRow` | DTO for UI/API; `contactEmail` matches `@entities/guest-account` (party email on `rsvp` for primary, companion account email with party fallback). |
| `listRsvpsForAdmin` | Legacy `rsvp` table list; `ListRsvpsForAdminOptions` / `ListRsvpsForAdminResult`. |
| `parseAdminRsvpsQuery` / `parseAdminRsvpsSearchParams` | Optional `attending` query validation; `ParseAdminRsvpsQueryResult`. |

**Not exported:** `mapGuestAccountJoinToAdminRow`, `sortAdminGuestRowsByParty`, PostgREST `select` strings, or other
`api/` / `model/` internals. Do not import them from outside the slice.

### HTTP: `GET /api/admin/rsvps`

- **200:** `{ guests: AdminGuestListRow[] }` — same rows as a successful `listGuestAccountsForAdmin` for the parsed query.
- **Breaking note:** older versions returned `{ rsvps: RsvpRow[] }`; there are no in-repo consumers of that shape.

## Usage

```ts
import {
    listGuestAccountsForAdmin,
    parseAdminRsvpsSearchParams,
} from "@features/admin-rsvp-list";

const parsed = parseAdminRsvpsSearchParams(new URL(request.url).searchParams);
if (!parsed.ok) {
    // map parsed.error to 400
}

const result = await listGuestAccountsForAdmin({attending: parsed.attending});
if (!result.ok) {
    // map result.kind / result.message to 500 (after auth / rate limit)
}
// result.rows
```

## Extending

- **New table column:** extend `AdminGuestListRow`, `mapGuestAccountJoinToAdminRow`, the `select(...)` in
  `list-guest-accounts-for-admin.ts`, admin UI, and i18n keys together.
- **New filter:** extend `ListGuestAccountsForAdminOptions`, the Supabase query (or admin-only post-filter), parsers in
  `parse-admin-rsvps-query.ts`, and the route.
- **RPC later:** keep the public `listGuestAccountsForAdmin` result shape so callers stay stable; swap implementation
  inside `api/list-guest-accounts-for-admin.ts`.

Submodule layout: see `api/README.md` and `model/README.md`.

## Configuration

- None beyond Supabase environment used by `createServerClient()`.

## Errors and edge cases

- **HTTP (`GET /api/admin/rsvps`):** Rate limit first (429 + `retry_after`), then auth (401). Invalid `attending` → 400
  JSON `{ error }`. List helper failures → 500 JSON `{ error }`. Success → 200 JSON `{ guests: AdminGuestListRow[] }`.
- **Mapping:** rows that fail strict validation in `mapGuestAccountJoinToAdminRow` are skipped so one malformed row
  does not fail the entire list.
