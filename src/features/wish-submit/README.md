# feature: wish-submit

**Contract:** `submitWish(rawBody, request)` — validates guest wishes, inserts into `wishes` via service role.

- **Session cookie:** If `validateGuestSessionFromRequest` succeeds, `wishes.author_name` is the session guest’s
  `guest_accounts.display_name` (client `authorName` is ignored). `wishes.guest_account_id` is set to that account.
- **No session:** `authorName` is **required** in the JSON body (trimmed, max 100 chars); `guest_account_id` is null.
- **Photo attachment:** `photoR2Key` requires a valid session and a matching `photos` row for the same
  `guest_account_id` (see `assertWishPhotoOwnedByGuestAccount`).
- **400** — validation (`authorName` when anonymous, `message`, invalid `photoR2Key`, or attachment without session).
- **403** — `{ error: 'feature_disabled' }` when `wishSubmit` is off, or when a photo is present but not allowed for this
  caller. Wish photos use `isWishPhotoAttachmentAllowedForGuest` in `@entities/site-settings`: if `wishSubmit` is
  `enabled` and the guest RSVP’d **not attending**, photos are allowed even when `wishPhotoAttach` is not `enabled`
  (same rule as upload APIs).
- **500** — Supabase/R2 env or DB failure.

HTTP adapter: `POST /api/wishes` in `app/api/wishes/route.ts`. After success, the client should refresh the page (or
refetch) to show the new wish.
