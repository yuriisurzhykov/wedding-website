# feature: gallery-list

Read-only fetch of `photos` (service role). Used by `@widgets/gallery-section` (SSR first page) and *
*`GET /api/gallery/photos`** (same query contract for client “load more” and refresh after upload).

## `countGalleryPhotos()`

- **Returns**: `{ ok: true, total }` or `{ ok: false, kind, message }` (same error kinds as list).
- **Use**: SSR-only totals (e.g. “View all (N)”); not exposed on the public GET route by default to avoid an extra count
  query on every paginated fetch.

## `listGalleryPhotos(options?)`

- **Options**: `{ limit?: number; offset?: number }` — defaults `limit: 48`, `offset: 0`.
- **Pagination**: requests `limit + 1` rows via Supabase `.range(offset, offset + limit)` (inclusive), then returns
  `photos` trimmed to `limit` and `hasMore: rows.length > limit`. No separate `COUNT`.

## Success shape

`{ ok: true, photos, hasMore }` with `GalleryPhotoView[]`.

## `getGalleryPhotoDownload(photoId)`

- **Gated** on `galleryBrowse`; looks the row up by `id` to resolve its private `r2_key` (never trusts a
  client-supplied key), then reads the object via `@shared/api/r2` `getR2Object`.
- **Returns**: `{ ok: true, bytes, contentType, filename }` (filename `wedding-photo-<id8>.<ext>`), or
  `{ ok: false, kind }` with `kind` ∈ `disabled | not_found | config | database | storage`.

## HTTP mirror

- `GET /api/gallery/photos?limit=&offset=` — Zod-validated query; **400** `invalid_query`; **500** `server_error`.
  JSON: `{ photos, hasMore }`.
- `GET /api/gallery/photos/[id]/download` — same-origin proxy that streams the photo with
  `Content-Disposition: attachment`; **400** `invalid_id`, **404** `not_found` (missing or `galleryBrowse` off),
  **429** `too_many_requests`, **500** `server_error`.
