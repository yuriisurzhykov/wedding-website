# feature: wish-submit

**Contract:** `submitWish(rawBody)` — validates guest wishes, inserts into `wishes` via service role.

- **400** — validation (`authorName`, `message`, optional `photoR2Key` under `photos/`).
- **500** — Supabase/R2 env or DB failure.

HTTP adapter: `POST /api/wishes` in `app/api/wishes/route.ts`. After success, the client should refresh the page (or refetch) to show the new wish.
