# Feature: admin-rsvp-list

Server-only reads of the `rsvp` table for the admin panel. Used by `GET /api/admin/rsvps` and the admin guests page (widget may call the list function directly to avoid a self-HTTP round-trip).

## Purpose

- Provide a single implementation for listing RSVPs with an optional `attending` filter, ordered by `created_at` descending.
- Keep validation of query parameters in one place (`parseAdminRsvpsQuery` / `parseAdminRsvpsSearchParams`).

## Approach

- Uses `createServerClient()` (Supabase service role) like other server features.
- No feature-flag gating: admins always see stored RSVP data.

## Public API

- `listRsvpsForAdmin(options?)` — returns `{ ok: true, rows }` or `{ ok: false, kind, message }`.
- `parseAdminRsvpsQuery` / `parseAdminRsvpsSearchParams` — validates optional `attending` query.

**Not exported:** internal helpers beyond the above.

## Usage

```ts
import {listRsvpsForAdmin, parseAdminRsvpsSearchParams} from "@features/admin-rsvp-list";

const parsed = parseAdminRsvpsSearchParams(new URL(request.url).searchParams);
if (!parsed.ok) {
  // map to 400
}
const result = await listRsvpsForAdmin({attending: parsed.attending});
```

## Extending

- New filters: extend `parseAdminRsvpsQuery`, `listRsvpsForAdmin`, and the route; document query params in this README.

## Configuration

- None beyond Supabase env used by `createServerClient`.

## Errors and edge cases

- **HTTP (`GET /api/admin/rsvps`):** Rate limit runs first (429 + `retry_after`), then auth (401). Invalid `attending` → 400 JSON `{ error }`. Config/database errors from `listRsvpsForAdmin` → 500 JSON `{ error }`. Success → 200 JSON `{ rsvps: RsvpRow[] }`.
