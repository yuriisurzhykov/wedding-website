# feature: gallery-upload

**Contract:** `presignGalleryUpload` / `confirmGalleryUpload` accept JSON bodies from the browser upload flow (see ARCHITECTURE Phase 5).

- **400** — validation (`fieldErrors` / `formErrors` from Zod).
- **500** — missing R2 or Supabase env (`kind: 'config'`), R2 signing failure (`kind: 'r2'`), or DB error on confirm (`kind: 'database'`).

Public entry: `@features/gallery-upload` only. HTTP mapping lives in `app/api/upload/presign` and `confirm`.
