# Feature: admin-wishes-delete

## Purpose

Admin-only listing and bulk deletion of guest wishes (Postgres + optional R2 attachment). Used by `DELETE /api/admin/wishes` and the admin wishes page after authentication and rate limiting.

## Approach

- Service-role Supabase client.
- Order: delete DB rows → for each removed row with `photo_r2_key`, best-effort `deleteR2Object` (log failures).

## Public contract

| Export | Role |
|--------|------|
| `listWishesForAdmin` | Paginated list (`created_at` desc), ignores guest feature flags. |
| `deleteWishesForAdmin` | Parses `{ ids: UUID[] }` (max 100), returns `deleted` count. |

## Usage

Call only from server code behind `isAdminApiAuthorized` + `checkAdminRateLimit` (see `app/api/admin/wishes/route.ts`).

## Errors & edge cases

- **Validation** — invalid JSON or empty `ids` → HTTP **400** in the route.
- **Database** — Supabase errors → **500**.
- **200** — `{ ok: true, deleted: number }`.

## Extension

Raise max batch size in `validate-delete-wishes-payload.ts` and document here.
