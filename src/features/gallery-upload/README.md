# feature: gallery-upload

**Two upload paths**

1. **Presigned (default)** — `presignGalleryUpload` / `confirmGalleryUpload` + `POST /api/upload/presign` and `confirm`. Browser `PUT`s directly to R2. The bucket **must** have CORS — copy `docs/r2-cors-dashboard.json` per **`docs/r2-cors.md`**.
2. **Server multipart** — `uploadGalleryPhotoFromMultipart` + `POST /api/upload/server`. Use when R2 CORS is impossible or for Vercel body limits: set `NEXT_PUBLIC_GALLERY_SERVER_UPLOAD=true`.

**Errors**

- **400** — validation (`fieldErrors` / `formErrors` from Zod, or multipart message).
- **500** — missing R2 or Supabase env, R2 failure, or DB error.

Public entry: `@features/gallery-upload` only. HTTP mapping lives in `app/api/upload/*`.
