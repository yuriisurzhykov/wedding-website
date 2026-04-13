# Feature: wedding-schedule

Server-only access to `schedule_section` and `schedule_items`: **public read** (anon + RLS), **admin replace-all write**
(service role), SVG **sanitization** before `icon_svg_inline` is stored, R2 **presign** for `icon_url`, and Next cache
tag invalidation after writes.

## Purpose

- **Guest RSC:** `getResolvedGuestSchedule(locale)` — cached read, resolves ru/en strings and maps rows to
  `@shared/lib/wedding-calendar` timeline items + section header overrides for `ScheduleSection`.
- **Admin loaders:** `getWeddingSchedule` / `getWeddingScheduleCached` — raw rows for forms and `GET /api/admin/schedule`.
- **Admin write:** `replaceWeddingSchedule` — validates with `@entities/wedding-schedule`, sanitizes inline SVG
  (`isomorphic-dompurify`), transactional replace of all items + section patch, then `revalidateTag(WEDDING_SCHEDULE_CACHE_TAG)`.
- **R2 upload path:** `presignScheduleIconSvgUpload` — validates size against `SCHEDULE_ICON_SVG_UPLOAD_MAX_BYTES`.

Schedule is **not** part of `@features/site-settings` or `PATCH /api/admin/site-settings`.

## Approach

- Reads use `createPublishableServerClient` where RLS allows anonymous `SELECT` on schedule tables (same idea as
  `site_settings`).
- Writes use `createServerClient` (service role) for `DELETE`/`INSERT`/`UPDATE` in a single use-case transaction.
- **`getWeddingScheduleCached`** / **`getResolvedGuestSchedule`** use `unstable_cache` with tag
  **`WEDDING_SCHEDULE_CACHE_TAG`** (`'wedding-schedule'`). Import the constant if another feature must invalidate after a
  related change.

## Public API

From `index.ts`:

| Export | Role |
|--------|------|
| `getWeddingSchedule`, `getWeddingScheduleCached`, `WEDDING_SCHEDULE_CACHE_TAG`, `WeddingScheduleSnapshot` | Load section + items from DB |
| `getResolvedGuestSchedule`, `ResolvedGuestSchedule` | Guest timeline + `sectionHeaders` for the home page |
| `replaceWeddingSchedule`, `ReplaceWeddingScheduleResult` | Admin replace-all persistence |
| `presignScheduleIconSvgUpload`, `PresignScheduleIconSvgUploadResult` | R2 PUT presign for SVG uploads |
| `mapScheduleItemsToTimelineRows` | DB rows → calendar `ScheduleItem` list |
| `resolveScheduleSectionHeaders` | DB section row → title/subtitle/badge for current locale |
| `sanitizeScheduleIconSvgInline` | Shared sanitizer (also used inside replace) |

## HTTP (admin)

All three routes use **`checkAdminRateLimit`** + **`isAdminApiAuthorized`** (same pattern as other admin APIs). **401**
`{ "error": "Unauthorized" }` when not admin. Rate limit failures return the shared rate-limit **Response** (typically **429**).

### `GET /api/admin/schedule`

- **200:** `{ ok: true, section, items }` — same row shapes as `getWeddingSchedule()`.
- **401:** not authorized.

### `PATCH /api/admin/schedule`

- **Body:** JSON matching `weddingScheduleReplacePayloadSchema` from `@entities/wedding-schedule` (`items`: non-empty
  array, max 64; optional `section` for `title_*` / `subtitle_*` / `emphasis_badge_*`). Omit or null section fields on the
  guest site resolve to `messages` fallbacks (see `resolveScheduleSectionHeaders`).
- **200:** `{ ok: true, updated_at, section, items }`.
- **400:** `{ error: string }` — validation (`replaceWeddingSchedule` uses `scheduleReplacePayloadValidationCode`) or DB
  failure message.
- **401:** not authorized.
- **Invalid JSON:** **400** `{ error: "Invalid JSON body" }`.

Implementation: `app/api/admin/schedule/route.ts` (thin handler).

### `POST /api/admin/schedule-icon/presign`

- **Body:** `{ "size": number }` — intended upload size in bytes (≤ `SCHEDULE_ICON_SVG_UPLOAD_MAX_BYTES`).
- **200:** `{ url, key, publicUrl }` — browser **`PUT`** to `url` with `Content-Type: image/svg+xml`, then persist
  `publicUrl` on the item as `icon_url` (mutually exclusive with preset / inline SVG).
- **400:** `{ error: "validation", fieldErrors, formErrors }` — Zod from `presignScheduleIconSvgUpload`.
- **401:** not authorized.
- **500:** `{ error: "server_misconfigured" }` or `{ error: "presign_failed" }` — missing R2 env or AWS/presign error
  (logged server-side).

Implementation: `app/api/admin/schedule-icon/presign/route.ts`.

## Usage

Guest home page loads schedule **in parallel** with site settings (schedule does not travel inside `SiteSettings`):

```tsx
import {getResolvedGuestSchedule} from '@features/wedding-schedule'
import {getSiteSettingsCached} from '@features/site-settings'

const [siteSettings, resolvedSchedule] = await Promise.all([
  getSiteSettingsCached(),
  getResolvedGuestSchedule(locale),
])
```

## Extending

Add a field end-to-end: Postgres migration → entity Zod (`db-rows` + `admin-replace-payload`) → `replaceWeddingSchedule` /
mappers → `PATCH` route (unchanged if body schema grows) → `AdminScheduleForm` → optional `ScheduleTimeline` props.

## Errors and edge cases

- `replaceWeddingSchedule` returns `{ ok: false, error: string }` on validation or Supabase errors; the route maps that to
  **400** with `{ error }` (no throw).
- `getWeddingSchedule` / cached variants: malformed rows are skipped for items; section uses `safeParse` and may be
  `null`.
- **XSS:** only sanitized SVG in `icon_svg_inline`; URL icons should be rendered as `<img src={url} />` in guest UI, not
  inlined HTML from the network.
