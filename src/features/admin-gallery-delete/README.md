# Feature: admin-gallery-delete

## Purpose

Admin-only listing and bulk deletion of gallery photos (Postgres + R2). Used by `DELETE /api/admin/photos` and the admin gallery page after authentication and rate limiting.

## Approach

- Service-role Supabase client (`createServerClient`).
- Deletes **do not** check `rsvp_id` (contrast with guest `deleteGalleryPhoto`).
- Order: delete DB rows → `revalidateTag` for gallery list cache → best-effort R2 `deleteR2Object` per removed `r2_key` (log failures).

## Public contract

| Export | Role |
|--------|------|
| `listPhotosForAdmin` | Paginated list (`uploaded_at` desc), ignores guest feature flags. |
| `deletePhotosForAdmin` | Parses `{ ids: UUID[] }` (max 100), returns `deleted` count. |

## Usage

Call only from server code behind `isAdminApiAuthorized` + `checkAdminRateLimit` (see `app/api/admin/photos/route.ts`).

## Errors & edge cases

- **Validation** — invalid JSON shape or empty `ids` → map to HTTP **400** in the route.
- **Database** — Supabase errors → **500** with `{ error: string }`.
- **200** — `{ ok: true, deleted: number }` (may be less than requested if ids were stale).

## Extension

Raise max batch size in `validate-delete-photos-payload.ts` and document here.
