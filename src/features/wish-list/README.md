# feature: wish-list

Read-only fetch of `wishes` (service role). Used by `@widgets/wishes-section` for the **SSR first page**. Further pages use the same contract over HTTP (no duplicated query logic in the route handler beyond Zod).

## `countWishes()`

- **Returns**: `{ ok: true, total }` or `{ ok: false, kind, message }` (same error kinds as list).
- **Use**: SSR-only totals (e.g. “All wishes (N)”); keep off the default public GET path unless you add an explicit opt-in query later.

## `listWishes(options?)`

- **Options**: `{ limit?: number; offset?: number }` — defaults `limit: 50`, `offset: 0`.
- **Pagination**: same `limit + 1` / `hasMore` pattern as `@features/gallery-list` (`created_at` desc).

## Success shape

`{ ok: true, wishes, hasMore }` with `WishView[]`.

## HTTP mirror (unified with gallery)

`GET /api/wishes?limit=&offset=` — Zod-validated; **400** `invalid_query`; **500** `server_error`. JSON: `{ wishes, hasMore }`.

`POST /api/wishes` remains handled by `@features/wish-submit` in the same route file.
