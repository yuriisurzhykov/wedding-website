# feature: wish-submit

**Contract:** `submitWish(rawBody, request)` — validates guest wishes, inserts into `wishes` via service role.

- **Session cookie:** If `validateGuestSessionFromRequest` succeeds, the author stored in `wishes.author_name` is *
  *`rsvp.name`** for that session (client `authorName` is ignored). Same source as `@features/gallery-upload` confirm.
- **No session:** `authorName` is **required** in the JSON body (trimmed, max 100 chars).
- **400** — validation (`authorName` when anonymous, `message`, optional `photoR2Key` under `photos/`).
- **403** — `{ error: 'feature_disabled' }` when `wishSubmit` is off, or when a photo is present but not allowed for this
  caller. Wish photos use `isWishPhotoAttachmentAllowedForGuest` in `@entities/site-settings`: if `wishSubmit` is
  `enabled` and the guest RSVP’d **not attending**, photos are allowed even when `wishPhotoAttach` is not `enabled`
  (same rule as upload APIs).
- **500** — Supabase/R2 env or DB failure.

HTTP adapter: `POST /api/wishes` in `app/api/wishes/route.ts`. After success, the client should refresh the page (or
refetch) to show the new wish.
