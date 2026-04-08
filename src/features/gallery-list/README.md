# feature: gallery-list

Read-only fetch of `photos` (service role). Used by `@widgets/gallery-section` (SSR first page) and **`GET /api/gallery/photos`** (same query contract for client “load more” and refresh after upload).

## `countGalleryPhotos()`

- **Returns**: `{ ok: true, total }` or `{ ok: false, kind, message }` (same error kinds as list).
- **Use**: SSR-only totals (e.g. “View all (N)”); not exposed on the public GET route by default to avoid an extra count query on every paginated fetch.

## `listGalleryPhotos(options?)`

- **Options**: `{ limit?: number; offset?: number }` — defaults `limit: 48`, `offset: 0`.
- **Pagination**: requests `limit + 1` rows via Supabase `.range(offset, offset + limit)` (inclusive), then returns `photos` trimmed to `limit` and `hasMore: rows.length > limit`. No separate `COUNT`.

## Success shape

`{ ok: true, photos, hasMore }` with `GalleryPhotoView[]`.

## HTTP mirror

`GET /api/gallery/photos?limit=&offset=` — Zod-validated query; **400** `invalid_query`; **500** `server_error`. JSON: `{ photos, hasMore }`.
